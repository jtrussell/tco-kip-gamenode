const AllPlayerPrompt = require('../allplayerprompt');

class TriadChooseFirstDeckPrompt extends AllPlayerPrompt {
    constructor(game) {
        super(game);
        this.deckChoices = {};
    }

    completionCondition(player) {
        return !!this.deckChoices[player.name];
    }

    activePrompt(player) {
        let deckUuids = this.game.triadData[player.name].deckUuids;
        deckUuids = deckUuids.filter(uuid => uuid !== this.game.triadData[player.name].bannedDeck);

        return {
            menuTitle: { text: 'Choose your first deck' },
            buttons: [
                { text: 'Deck A', arg: deckUuids[0] },
                { text: 'Deck B', arg: deckUuids[1] }
            ],
            promptType: 'triad-choose-deck'
        };
    }

    waitingPrompt() {
        return { menuTitle: 'Waiting for opponent to pick a deck' };
    }

    onMenuCommand(player, uuid) {
        const selectedDeck = this.game.triadData[player.name].decks[uuid];

        this.game.addMessage(`${player.name} picked ${selectedDeck.name}`);
        this.deckChoices[player.name] = uuid;
        return true;
    }

    onCompleted() {
        if(this.cancelled) {
            return;
        }

        const players = this.game.getPlayers();
        players.forEach(player => {
            const triadData = this.game.triadData[player.name];
            const decks = triadData.decks;
            const choiceUuid = this.deckChoices[player.name];
            const deck = decks[choiceUuid];
            player.selectDeck(deck);

            triadData.firstDeck = choiceUuid;
            triadData.secondDeck = triadData.deckUuids.find(uuid => uuid !== choiceUuid && uuid !== triadData.bannedDeck);
        });
        this.game.initialisePlayers();

        return true;
    }
}

module.exports = TriadChooseFirstDeckPrompt;
