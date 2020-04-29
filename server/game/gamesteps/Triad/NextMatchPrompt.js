const AllPlayerPrompt = require('../allplayerprompt');

class NextMatchPrompt extends AllPlayerPrompt {
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
            menuTitle: { text: '{{player}} would like to play the next match', values: { player: this.requestingPlayer.name } },
            buttons: [
                { arg: 'yes', text: 'Play' }
            ]
        };
    }

    waitingPrompt() {
        return {
            menuTitle: 'Waiting for opponent to agree to next match'
        };
    }

    onMenuCommand(player, arg) {
        if(arg === 'yes') {
            this.game.addAlert('info', '{0} is ready to continue, setting it up now', player);
            this.completedPlayers.add(player);
        } else {
            this.game.addAlert('info', '{0} is not ready to continue', player);
            this.cancelled = true;
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

module.exports = NextMatchPrompt;
