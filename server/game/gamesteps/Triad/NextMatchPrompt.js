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

        const {
            triadData,
            winner
        } = this.game;

        const loser = this.game.getOpponent(winner);
        const loserWins = triadData[loser.name].wins;

        let loserDeckUuid = triadData[loser.name].firstDeck;
        if(loserWins === 1) {
            loserDeckUuid = triadData[loser.name].secondDeck;
        }

        const loserNextDeck = triadData[loser.name].decks[loserDeckUuid];

        const winnerDeckUuid = triadData[winner.name].secondDeck;
        const winnerNextDeck = triadData[winner.name].decks[winnerDeckUuid];

        console.log(loserNextDeck.name, winnerNextDeck.name);

        winner.selectDeck(winnerNextDeck);
        loser.selectDeck(loserNextDeck);

        this.game.rematch();
    }
}

module.exports = NextMatchPrompt;
