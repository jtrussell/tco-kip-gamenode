const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('config');
const http = require('http');
const express = require('express');
const _ = require('underscore');
const request = require('request');
const app = express();

const { detectBinary } = require('../util');
const logger = require('../log.js');
const ZmqSocket = require('./zmqsocket.js');
const Game = require('../game/game.js');
const Socket = require('../socket.js');
const version = require('../../version.js');
const CRUCIBLE_TRACKER_URL = require('../crucibletracker/url');
const getChecksForPlayer = require('../crucibletracker/getChecksForPlayer');
const getTotalTurns = require('../crucibletracker/getTotalTurns');
const removeChatMessages = require('../crucibletracker/removeChatMessages');

class GameServer {
    constructor() {
        this.games = {};
        this.host = process.env.MY_HOST;
        this.protocol = 'http';
        const server = http.createServer(app);

        this.zmqSocket = new ZmqSocket(this.host, this.protocol, version.build);
        this.zmqSocket.on('onStartGame', this.onStartGame.bind(this));
        this.zmqSocket.on('onSpectator', this.onSpectator.bind(this));
        this.zmqSocket.on('onGameSync', this.onGameSync.bind(this));
        this.zmqSocket.on('onFailedConnect', this.onFailedConnect.bind(this));
        this.zmqSocket.on('onCloseGame', this.onCloseGame.bind(this));
        this.zmqSocket.on('onCardData', this.onCardData.bind(this));

        server.listen(process.env.PORT);

        app.use(function(req, res, next) {
            res.header('Access-Control-Allow-Origin', 'https://kiptournaments.com');
            res.header('Access-Control-Allow-Credentials', true);
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
            next();
        });

        app.get('/', function (req, res) {
            res.send('Ok');
        });

        app.get('/state', (req, res) => {
            const states = Object.values(this.games).map(game => game.getSaveState());
            res.json(states);
        });

        var options = {
            perMessageDeflate: false,
            path: '/node0'
        };

        this.io = socketio(server, options);
        this.io.set('heartbeat timeout', 30000);
        this.io.use(this.handshake.bind(this));

        //if(config.gameNode.origin) {
        //this.io.set('origins', config.gameNode.origin);
        //}

        this.io.on('connection', this.onConnection.bind(this));

        setInterval(() => this.clearStaleAndFinishedGames(), 30 * 1000);
    }

    debugDump() {
        var games = _.map(this.games, game => {
            var players = _.map(game.playersAndSpectators, player => {
                return {
                    name: player.name,
                    left: player.left,
                    disconnected: !!player.disconnectedAt,
                    id: player.id,
                    spectator: game.isSpectator(player)
                };
            });

            return {
                name: game.name,
                players: players,
                id: game.id,
                started: game.started,
                startedAt: game.startedAt
            };
        });

        return {
            games: games,
            gameCount: _.size(this.games)
        };
    }

    handleError(game, e) {
        logger.error(e);

        let gameState = game.getState();
        let debugData = {};

        if(e.message.includes('Maximum call stack')) {
            debugData.badSerializaton = detectBinary(gameState);
        } else {
            debugData.game = gameState;
            debugData.game.players = undefined;

            debugData.messages = game.getPlainTextLog();
            debugData.game.messages = undefined;

            _.each(game.getPlayers(), player => {
                debugData[player.name] = player.getState(player);
            });
        }

        if(game) {
            game.addMessage('A Server error has occured processing your game state, apologies.  Your game may now be in an inconsistent state, or you may be able to continue.  The error has been logged.');
        }
    }

    closeGame(game) {
        for(let player of Object.values(game.getPlayersAndSpectators())) {
            if(player.socket) {
                player.socket.tIsClosing = true;
                player.socket.disconnect();
            }
        }

        delete this.games[game.id];
        this.zmqSocket.send('GAMECLOSED', { game: game.id });
    }

    clearStaleAndFinishedGames() {
        const timeout = 20 * 60 * 1000;

        let staleGames = Object.values(this.games).filter(game => game.finishedAt && (Date.now() - game.finishedAt > timeout));
        for(let game of staleGames) {
            logger.info('closed finished game', game.id, 'due to inactivity');
            this.closeGame(game);
        }

        let emptyGames = Object.values(this.games).filter(game => game.isEmpty());
        for(let game of emptyGames) {
            logger.info('closed empty game', game.id);
            this.closeGame(game);
        }
    }

    runAndCatchErrors(game, func) {
        try {
            func();
        } catch(e) {
            this.handleError(game, e);

            this.sendGameState(game);
        }
    }

    findGameForUser(username) {
        return _.find(this.games, game => {
            var player = game.playersAndSpectators[username];

            if(!player || player.left) {
                return false;
            }

            return true;
        });
    }

    sendGameState(game) {
        _.each(game.getPlayersAndSpectators(), player => {
            if(player.left || player.disconnectedAt || !player.socket) {
                return;
            }

            player.socket.send('gamestate', game.getState(player.name));
        });
    }

    handshake(socket, next) {
        if(socket.handshake.query.token && socket.handshake.query.token !== 'undefined') {
            jwt.verify(socket.handshake.query.token, config.secret, function(err, user) {
                if(err) {
                    return;
                }

                socket.request.user = user;
            });
        }

        next();
    }

    gameWon(game, reason, winner) {
        this.zmqSocket.send('GAMEWIN', { game: game.getSaveState(), winner: winner.name, reason: reason });

        const loser = game.getPlayers().find(p => p !== winner);

        if(!loser) {
            return;
        }

        const events = removeChatMessages(game.gameChat.messages);

        events.unshift({
            'message': [
                {
                    'name': loser.name,
                    'argType': 'nonAvatarPlayer'
                },
                ' is playing as the Archon: ',
                {
                    'link': 'https://www.keyforgegame.com/deck-details/' + loser.deckData.uuid,
                    'label': loser.deckData.name
                }
            ]
        });

        events.unshift({
            'message': [
                {
                    'name': winner.name,
                    'argType': 'nonAvatarPlayer'
                },
                ' is playing as the Archon: ',
                {
                    'link': 'https://www.keyforgegame.com/deck-details/' + winner.deckData.uuid,
                    'label': winner.deckData.name
                }
            ]
        });

        const message = {
            type: 'RECORD_GAME',
            data: {
                date: (new Date()).toISOString(),
                turns: getTotalTurns(events),
                winner: winner.name,
                winnerDeckName: winner.deckData.name,
                winnerDeckID: winner.deckData.uuid,
                winnerKeys: Object.values(winner.keys).filter(v => v).length,
                winnerChecks: getChecksForPlayer(winner.name, events),
                loser: loser.name,
                loserDeckName: loser.deckData.name,
                loserDeckID: loser.deckData.uuid,
                loserKeys: Object.values(loser.keys).filter(v => v).length,
                loserChecks: getChecksForPlayer(loser.name, events),
                crucibleGameID: game.id,
                m9: 424
            },
            events
        };

        request.post({
            url: `${CRUCIBLE_TRACKER_URL}/api/games`,
            json: true,
            body: message.data
        }, function(error, response, body) {
            try {
                if(error) {
                    logger.error(JSON.stringify(error));
                }

                const crucibleTrackerGameID = body.id;

                request.post({
                    url: `${CRUCIBLE_TRACKER_URL}/api/events`,
                    json: true,
                    body: {
                        events,
                        gameID: crucibleTrackerGameID,
                        m9: 424
                    }
                }, function(error2, response2, body2) {
                    try {
                        if(error2) {
                            logger.error(JSON.stringify(error2));
                        }
                    } catch(e2) {
                        logger.error(JSON.stringify(e2));
                    }
                });
            } catch(e) {
                logger.error(JSON.stringify(e));
            }
        });
    }

    rematch(game) {
        for(let player of Object.values(game.getSpectators())) {
            logger.info('Game is going to rematch. Disconnecting spectator' + player.name);
            this.zmqSocket.send('PLAYERLEFT', {
                gameId: game.id,
                game: game.getSaveState(),
                player: player.name,
                spectator: true
            });

            game.leave(player.name);

            if(!player.socket) {
                console.log('player has no socket', player.name);
                continue;
            }

            player.socket.send('cleargamestate');
            player.socket.leaveChannel(game.id);
            player.socket.disconnect();
        }

        console.log(game.getSaveState());
        this.zmqSocket.send('REMATCH', { game: game.getSaveState() });

        for(let player of Object.values(game.getPlayers())) {
            if(player.left || player.disconnectedAt || !player.socket) {
                continue;
            }

            player.socket.send('cleargamestate');
            player.socket.leaveChannel(game.id);
            player.left = true; // So they don't get game state sent after the /rematch command is issued
        }

        delete this.games[game.id];
    }

    onStartGame(pendingGame) {
        console.log('[gameserver] Starting game');
        let game = new Game(pendingGame, {
            router: this,
            cardData: this.cardData
        });
        game.on('onTimeExpired', () => {
            this.sendGameState(game);
        });
        this.games[pendingGame.id] = game;

        game.started = true;
        for(let player of Object.values(pendingGame.players)) {
            game.selectDeck(player.name, player.deck);
        }

        game.initialise();
        if(pendingGame.rematch) {
            game.addAlert('info', 'The rematch is ready');
        }

        game.on('endofround', this.onEndOfRound.bind(this));

        game.getPlayers().forEach(player => {
            const name = player.name;
            const drawEvent = `draw-start-hand-${name}`;
            const mulliganEvent = `mulligan-${name}`;

            const sendStartingHand = (hand) => {
                const cards = hand.map(card => ({
                    id: card.id,
                    name: card.name
                }));

                setTimeout(() => {
                    request.post({
                        url: `${CRUCIBLE_TRACKER_URL}/api/games/starting-hand`,
                        json: true,
                        body: {
                            gameID: game.id,
                            hand: cards,
                            player: name,
                            deckSet: player.deckData.expansion,
                            deckID: player.deckData.uuid,
                            houses: player.houses,
                            m9: 424
                        }
                    });
                }, Math.random() * 10000);
            };

            game.once(drawEvent, sendStartingHand);
            game.once(mulliganEvent, sendStartingHand);

            game.once('endofround', () => {
                game.off(drawEvent, sendStartingHand);
                game.off(mulliganEvent, sendStartingHand);
            });
        });
    }


    onSpectator(pendingGame, user) {
        var game = this.games[pendingGame.id];
        if(!game) {
            return;
        }

        game.watch('TBA', user);

        this.sendGameState(game);
    }

    onGameSync(callback) {
        var gameSummaries = _.map(this.games, game => {
            var retGame = game.getSummary(undefined, { fullData: true });
            retGame.password = game.password;

            return retGame;
        });

        logger.info('syncing', _.size(gameSummaries), ' games');

        callback(gameSummaries);
    }

    onFailedConnect(gameId, username) {
        var game = this.findGameForUser(username);
        if(!game || game.id !== gameId) {
            return;
        }

        game.failedConnect(username);

        if(game.isEmpty()) {
            delete this.games[game.id];

            this.zmqSocket.send('GAMECLOSED', { game: game.id });
        }

        this.sendGameState(game);
    }

    onCloseGame(gameId) {
        let game = this.games[gameId];
        if(!game) {
            return;
        }

        for(let player of Object.values(game.getPlayersAndSpectators())) {
            player.socket.send('cleargamestate');
            player.socket.leaveChannel(game.id);
        }

        delete this.games[gameId];
        this.zmqSocket.send('GAMECLOSED', { game: game.id });
    }

    onCardData(cardData) {
        this.cardData = cardData.cardData;
    }

    onConnection(ioSocket) {
        let user;
        try {
            user = JSON.parse(ioSocket.handshake.query.user);
        } catch(e) {
            logger.error('[gameserver] error parsing json onConnection');
            logger.error(e);
        }

        if(!user) {
            ioSocket.disconnect();
            return;
        }

        const { username } = user;

        if(!username) {
            logger.info('socket connected with no user, disconnecting');
            ioSocket.disconnect();
            return;
        }

        var game = this.findGameForUser(username);
        if(!game) {
            logger.info('No game for', username, 'disconnecting');
            ioSocket.disconnect();
            return;
        }

        var socket = new Socket(ioSocket, { config: config, user });

        var player = game.playersAndSpectators[socket.user.username];
        if(!player) {
            logger.info(`Player "${socket.user.username}" not found in playersAndSpectators`);
            return;
        }

        player.lobbyId = player.id;
        player.id = socket.id;
        player.connectionSucceeded = true;

        if(player.disconnectedAt) {
            logger.info('user \'%s\' reconnected to game', socket.user.username);
            game.reconnect(socket, player.name);
        }

        socket.joinChannel(game.id);

        player.socket = socket;

        if(!game.isSpectator(player) && !player.disconnectedAt) {
            game.addAlert('info', '{0} has connected to the game server', player);
        }

        logger.info(`${player.name} has connected to the game server`);

        this.sendGameState(game);

        socket.registerEvent('game', this.onGameMessage.bind(this));
        socket.on('disconnect', this.onSocketDisconnected.bind(this));
    }

    onSocketDisconnected(socket, reason) {
        let game = this.findGameForUser(socket.user.username);
        if(!game) {
            return;
        }

        logger.info('user \'%s\' disconnected from a game: %s', socket.user.username, reason);

        let player = game.playersAndSpectators[socket.user.username];
        if(player.id !== socket.id) {
            return;
        }

        let isSpectator = player && player.isSpectator();

        game.disconnect(socket.user.username);

        if(!socket.tIsClosing) {
            if(game.isEmpty()) {
                delete this.games[game.id];

                this.zmqSocket.send('GAMECLOSED', { game: game.id });
            } else if(isSpectator) {
                this.zmqSocket.send('PLAYERLEFT', { gameId: game.id, game: game.getSaveState(), player: socket.user.username, spectator: true });
            }
        }

        this.sendGameState(game);
    }

    onLeaveGame(socket) {
        var game = this.findGameForUser(socket.user.username);
        if(!game) {
            return;
        }

        let player = game.playersAndSpectators[socket.user.username];
        let isSpectator = player.isSpectator();

        game.leave(socket.user.username);

        this.zmqSocket.send('PLAYERLEFT', {
            gameId: game.id,
            game: game.getSaveState(),
            player: socket.user.username,
            spectator: isSpectator
        });

        socket.send('cleargamestate');
        socket.leaveChannel(game.id);

        if(game.isEmpty()) {
            delete this.games[game.id];

            this.zmqSocket.send('GAMECLOSED', { game: game.id });
        }

        this.sendGameState(game);
    }

    markGameAsWin(socket) {
        var game = this.findGameForUser(socket.user.username);
        if(!game) {
            return;
        }

        let player = game.playersAndSpectators[socket.user.username];
        if(player.isSpectator()) {
            return;
        }

        player.game.recordWinner(player, 'manual-report');
        this.sendGameState(game);
    }

    onGameMessage(socket, command, ...args) {
        var game = this.findGameForUser(socket.user.username);

        if(!game) {
            return;
        }

        if(command === 'leavegame') {
            return this.onLeaveGame(socket);
        }

        if(command === 'wingame') {
            return this.markGameAsWin(socket);
        }

        if(!game[command] || !_.isFunction(game[command])) {
            return;
        }

        this.runAndCatchErrors(game, () => {
            game[command](socket.user.username, ...args);

            game.continue();

            this.sendGameState(game);
        });
    }

    onEndOfRound(game) {
        const data = {
            hand: {},
            purged: {},
            board: {},
            archives: {}
        };
        game
            .getPlayers()
            .forEach(player => {
                const name = player.name;
                const playerState = player.getState(player, 'archon');

                data.board[name] = Object.assign({}, playerState.cardPiles.cardsInPlay);
                data.hand[name] = Object.assign(
                    {},
                    playerState.cardPiles.hand.map(c => {
                        if(c.name) {
                            return c.name;
                        }

                        return '';
                    })
                );
                data.archives[name] = Object.assign(
                    {},
                    playerState.cardPiles.archives.map(c => {
                        if(c.name) {
                            return c.name;
                        }

                        return '';
                    })
                );
                data.purged[name] = Object.assign(
                    {},
                    playerState.cardPiles.purged.map(c => {
                        if(c.name) {
                            return c.name;
                        }

                        return '';
                    })
                );
            });

        request.post({
            url: `${CRUCIBLE_TRACKER_URL}/api/games/${game.id}/board`,
            json: true,
            body: {
                gameID: game.id,
                board: data.board,
                hand: data.hand,
                archives: data.archives,
                purged: data.purged,
                turn: game.roundDouble,
                m9: 424
            }
        }, function(error, response, body) {
            if(error) {
                logger.error(JSON.stringify(error));
            }
        });
    }
}

module.exports = GameServer;
