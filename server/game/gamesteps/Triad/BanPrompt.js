const AllPlayerPrompt = require('../allplayerprompt');
const ChooseFirstDeckPrompt = require('./ChooseFirstDeckPrompt');

class TriadBanPrompt extends AllPlayerPrompt {
    completionCondition(player) {
        const opponent = this.game.getOpponent(player);

        if(!opponent) {
            return true;
        }

        return !!this.game.triadData[opponent.name].bannedDeck;
    }

    activePrompt(player) {
        const opponent = this.game.getOpponent(player);

        if(!opponent) {
            this.complete();
            return null;
        }

        const deckUuids = this.game.triadData[opponent.name].deckUuids;

        return {
            menuTitle: { text: 'Choose a deck to ban' },
            buttons: [
                { text: 'Deck A', arg: deckUuids[0] },
                { text: 'Deck B', arg: deckUuids[1] },
                { text: 'Deck C', arg: deckUuids[2] }
            ],
            promptType: 'triad-ban-deck'
        };
    }

    waitingPrompt() {
        return {
            menuTitle: 'Waiting for opponent to ban a deck',
            promptType: 'triad-ban-deck'
        };
    }

    onMenuCommand(player, uuid) {
        const opponent = this.game.getOpponent(player);
        if(!opponent) {
            this.complete();
            return null;
        }

        const selectedDeck = this.game.triadData[opponent.name].decks[uuid];

        this.game.triadData[opponent.name].bannedDeck = uuid;
        this.game.addMessage(`${player.name} banned ${selectedDeck.name}`);
        return true;
    }

    onCompleted() {
        if(this.cancelled) {
            return;
        }

        this.game.queueStep(new ChooseFirstDeckPrompt(this.game));
        return true;
    }
}

module.exports = TriadBanPrompt;
