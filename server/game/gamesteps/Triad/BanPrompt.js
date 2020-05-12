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

        this.game.triadData[opponent.name].bannedDeck = uuid;
        return true;
    }

    onCompleted() {
        if(this.cancelled) {
            return;
        }

        this.game.getPlayers().forEach(player => {
            const opponent = this.game.getOpponent(player);
            if(!opponent) {
                return;
            }

            const bannedDeckUiid = this.game.triadData[opponent.name].bannedDeck;
            const bannedDeck = this.game.triadData[opponent.name].decks[bannedDeckUiid];
            this.game.addMessage(`${player.name} banned ${bannedDeck.name}`);
        });

        this.game.queueStep(new ChooseFirstDeckPrompt(this.game));
        return true;
    }
}

module.exports = TriadBanPrompt;
