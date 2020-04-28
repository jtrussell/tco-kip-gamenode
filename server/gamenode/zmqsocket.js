const EventEmitter = require('events');

const redis = require('redis');
const redisSubscriber = redis.createClient(process.env.REDIS_URL);
const redisPublisher = redis.createClient(process.env.REDIS_URL);

const config = require('config');
const logger = require('../log.js');

class ZmqSocket extends EventEmitter {
    constructor(listenAddress, protocol, version) {
        super();

        this.listenAddress = listenAddress;
        this.protocol = protocol;
        this.version = version;
        this.identity = process.env.SERVER || config.gameNode.name;

        redisSubscriber.on('subscribe', this.onConnect.bind(this));
        redisSubscriber.on('message', this.onMessage.bind(this));
        redisSubscriber.subscribe('gamenode-commands');
    }

    send(command, arg) {
        console.log(`[zmqsocket] Sending command ${command}`);
        redisPublisher.publish('node-registration', JSON.stringify({
            identity: this.identity,
            command,
            arg
        }));
    }

    onConnect() {
        console.log('[gamenode] Connected to redis');
        this.emit('onGameSync', this.onGameSync.bind(this));
    }

    onGameSync(games) {
        this.send('HELLO', {
            maxGames: config.maxGames,
            version: this.version,
            address: this.listenAddress,
            port: process.env.NODE_ENV === 'production' ? 80 : (process.env.PORT || config.gameNode.socketioPort),
            protocol: this.protocol,
            games: games,
            identity: this.identity
        });
    }

    onMessage(_, msg) {
        var message = undefined;
        try {
            message = JSON.parse(msg.toString());
        } catch(err) {
            logger.info(err);
            return;
        }

        const { identity } = message;

        if(identity !== this.identity) {
            return;
        }

        switch(message.command) {
            case 'PING':
                this.send('PONG');
                break;
            case 'STARTGAME':
                this.emit('onStartGame', message.arg);
                break;
            case 'SPECTATOR':
                this.emit('onSpectator', message.arg.game, message.arg.user);
                break;
            case 'CONNECTFAILED':
                this.emit('onFailedConnect', message.arg.gameId, message.arg.username);
                break;
            case 'CLOSEGAME':
                this.emit('onCloseGame', message.arg.gameId);
                break;
            case 'CARDDATA':
                this.emit('onCardData', message.arg);
                break;
            case 'RESTART':
                this.onGameSync([]);
                break;
        }
    }
}

module.exports = ZmqSocket;
