const AllPlayerPrompt = require('./allplayerprompt');
const AdaptiveBidPrompt = require('./AdaptiveBidPrompt');

class AdaptiveShortChooseDeckPrompt extends AllPlayerPrompt {
    constructor(game) {
        super(game);
        this.deckChoices = {};
    }

    completionCondition(player) {
        return !!this.deckChoices[player.name];
    }

    activePrompt() {
        const players = this.game.getPlayers();
        const decks = players.map(player => player.deckData);

        return {
            menuTitle: { text: 'Choose your deck' },
            buttons: [
                { text: 'Deck A', arg: decks[0].uuid },
                { text: 'Deck B', arg: decks[1].uuid }
            ],
            promptType: 'adaptive-short-deck-select'
        };
    }

    waitingPrompt() {
        return { menuTitle: 'Waiting for opponent to choose a deck' };
    }

    onMenuCommand(player, uuid) {
        const players = this.game.getPlayers();
        const decks = players.map(player => player.deckData);

        const selectedDeck = decks.find(deck => deck.uuid === uuid);

        this.game.addAlert('info', '{0} chose {1}', player, selectedDeck.name);
        this.deckChoices[player.name] = uuid;
        return true;
    }

    onCompleted() {
        if(this.cancelled) {
            return;
        }

        const players = this.game.getPlayers();
        const playerNames = Object.keys(this.deckChoices);

        const choiceA = Object.values(this.deckChoices)[0];
        const choiceB = Object.values(this.deckChoices)[0];

        if(choiceA !== choiceB) {
            //this.game.rematch();
        }

        //const deckAOwner =
        //this.game.addAlert('info', '{0} bids 0 for their deck', deckOwner);

        //const bidder = this.game.getPlayers().find(p => p.name === this.game.adaptiveData.records[1]);
        //this.game.queueStep(new AdaptiveBidPrompt(this.game, bidder, 0));
        return true;
    }
}

module.exports = AdaptiveShortChooseDeckPrompt;
