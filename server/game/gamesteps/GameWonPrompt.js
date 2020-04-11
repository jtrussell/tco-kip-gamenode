const AllPlayerPrompt = require('./allplayerprompt');
const RematchPrompt = require('./RematchPrompt');
const AdaptiveGameTwoPrompt = require('./AdaptiveGameTwoPrompt');
const AdaptiveGameThreePrompt = require('./AdaptiveGameThreePrompt');
const AdaptiveBidPrompt = require('./AdaptiveBidPrompt');
const logger = require('../../log');

class GameWonPrompt extends AllPlayerPrompt {
    constructor(game, winner) {
        super(game);
        this.winner = winner;
        this.clickedButton = {};

        if(this.game.gameType === 'adaptive') {
            this.matchNumber = this.game.adaptiveData.match;
            this.game.adaptiveData.records.push(winner.name);
            this.game.adaptiveData.match += 1;
        }
    }

    completionCondition(player) {
        return !!this.clickedButton[player.name];
    }

    activePrompt() {
        if(this.game.gameType !== 'adaptive') {
            return {
                promptTitle: 'Game Won',
                menuTitle: { text: '{{player}} has won the game!', values: { player: this.winner.name } },
                buttons: [
                    { arg: 'continue', text: 'Continue Playing' },
                    { arg: 'rematch', text: 'Rematch' }
                ]
            };
        }

        let buttons = [];
        let promptTitle = 'Game Won';
        let menuTitle = { text: '{{player}} has won the adaptive match!', values: { player: this.winner.name } };

        if(this.matchNumber === 1) {
            menuTitle = { text: '{{player}} has won the game!', values: { player: this.winner.name } };
            buttons = [
                { arg: 'adaptive-game-2', text: 'Play Game 2' }
            ];
        } else if(this.matchNumber === 2 && this.game.adaptiveData.records[0] !== this.winner.name) {
            menuTitle = { text: '{{player}} has won the game!', values: { player: this.winner.name } };
            buttons = [
                { arg: 'adaptive-game-3', text: 'Play Final Game' }
            ];
        }

        return {
            promptTitle,
            menuTitle,
            buttons
        };
    }

    waitingPrompt() {
        return { menuTitle: 'Waiting for opponent to choose to continue' };
    }

    menuCommand(player, arg) {
        this.clickedButton[player.name] = true;

        if(arg === 'continue') {
            this.game.addMessage('{0} would like to continue', player);
        }

        if(arg === 'rematch') {
            this.game.addMessage('{0} would like a rematch', player);
            this.game.queueStep(new RematchPrompt(this.game, player));
            return true;
        }

        if(arg === 'adaptive-game-2') {
            //this.game.addMessage('{0} would like to continue', player);
            this.game.queueStep(new AdaptiveGameTwoPrompt(this.game, player));
            return true;
        }

        if(arg === 'adaptive-game-3') {
            //this.game.addMessage('{0} would like to continue', player);
            //this.game.queueStep(new AdaptiveGameThreePrompt(this.game, player));

            const deckOwner = this.game.adaptiveData.records[0];
            this.game.addAlert('info', '{0} bids 0 for their deck', deckOwner);
            logger.info('{0} bids 0 for their deck', deckOwner);

            const bidder = this.game.getPlayers().find(p => p.name === this.game.adaptiveData.records[1]);
            this.game.queueStep(new AdaptiveBidPrompt(this.game, bidder, 0));
            return true;
        }

        return true;
    }
}

module.exports = GameWonPrompt;
