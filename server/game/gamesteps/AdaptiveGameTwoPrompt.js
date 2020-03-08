const AllPlayerPrompt = require('./allplayerprompt');

class AdaptiveGameTwoPrompt extends AllPlayerPrompt {
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
            menuTitle: { text: '{{player}} is ready to continue. Ready?', values: { player: this.requestingPlayer.name } },
            buttons: [
                { arg: 'yes', text: 'Yes' }
            ]
        };
        //{ arg: 'no', text: 'No' }
    }

    waitingPrompt() {
        return {
            menuTitle: 'Waiting for opponent to agree to continue'
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

        this.game.rematch();
    }
}

module.exports = AdaptiveGameTwoPrompt;
