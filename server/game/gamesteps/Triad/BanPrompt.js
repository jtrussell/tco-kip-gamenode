const AllPlayerPrompt = require('../allplayerprompt');
const ChooseFirstDeckPrompt = require('./ChooseFirstDeckPrompt');

class TriadBanPrompt extends AllPlayerPrompt {
    completionCondition(player) {
        const players = this.game.getPlayers();
        return players.every(player => {
            return this.game.triadData[player.name].bannedDeck;
        });
    }

    activePrompt(player) {
        const opponent = this.game.getOpponent(player);
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
        return { menuTitle: 'Waiting for opponent to ban a deck' };
    }

    onMenuCommand(player, uuid) {
        const opponent = this.game.getOpponent(player);
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
