const AllPlayerPrompt = require('./allplayerprompt');
const AdaptiveBidPrompt = require('./AdaptiveBidPrompt');
const logger = require('../../log');

class AdaptiveGameThreePrompt extends AllPlayerPrompt {
    constructor(game, requestingPlayer) {
        super(game);
        this.requestingPlayer = requestingPlayer;
        this.completedPlayers = new Set([requestingPlayer]);
        this.cancelled = false;
    }

    completionCondition(player) {
        return this.cancelled || this.completedPlayers.has(player);
    }

    activePrompt() {
        return {
            menuTitle: { text: '{{player}} is ready to bid. Ready?', values: { player: this.requestingPlayer.name } },
            buttons: [
                { arg: 'yes', text: 'Yes' }
            ]
        };
        //{ arg: 'no', text: 'No' }
    }

    waitingPrompt() {
        return {
            menuTitle: 'Waiting for opponent to agree to bid'
        };
    }

    onMenuCommand(player, arg) {
        if(arg === 'yes') {
            this.completedPlayers.add(player);
        //} else {
            //this.game.addAlert('info', '{0} would not like to continue', player);
            //this.cancelled = true;
        }

        return true;
    }

    onCompleted() {
        if(this.cancelled) {
            return;
        }

        const deckOwner = this.game.adaptiveData.records[0];
        this.game.addAlert('info', '{0} bids 0 for their deck', deckOwner);

        const bidder = this.game.getPlayers().find(p => p.name === this.game.adaptiveData.records[1]);
        this.game.queueStep(new AdaptiveBidPrompt(this.game, bidder, 0));
    }
}

module.exports = AdaptiveGameThreePrompt;
