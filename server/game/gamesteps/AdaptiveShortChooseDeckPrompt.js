const AllPlayerPrompt = require('./allplayerprompt');
const AdaptiveShortBidPrompt = require('./AdaptiveShortBidPrompt');

class AdaptiveShortChooseDeckPrompt extends AllPlayerPrompt {
    constructor(game) {
        super(game);
        this.deckChoices = {};
        this.deckOwners = {};
        const players = this.game.getPlayers();
        const decks = players.map(player => player.deckData);
        decks.forEach(deck => this.deckOwners[deck.uuid] = deck.username);
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

        this.game.addMessage(`${player.name} picked ${selectedDeck.name}`);
        this.deckChoices[player.name] = uuid;
        return true;
    }

    onCompleted() {
        if(this.cancelled) {
            return;
        }

        const players = this.game.getPlayers();
        const deckMap = {};
        players.map(player => deckMap[player.deckData.uuid] = player.deckData);

        const playerNames = Object.keys(this.deckChoices);

        const playerAChoice = deckMap[this.deckChoices[playerNames[0]]];
        const playerBChoice = deckMap[this.deckChoices[playerNames[1]]];

        if(playerAChoice.username === playerNames[0] && playerBChoice.username === playerNames[1]) {
            this.game.addMessage('Both players picked their own deck');
            return true;
        }

        if(playerAChoice.username === playerNames[1] && playerBChoice.username === playerNames[0]) {
            this.game.addMessage('Both players picked their opponent\'s deck');
            this.game.swapPlayersDecks();
            this.game.initialisePlayers();
            return true;
        }

        if(playerAChoice.uuid === playerBChoice.uuid) {
            this.game.addMessage(`Both players picked ${playerAChoice.username}'s deck`);
            this.game.addAlert('info', '{0} bids 0 for their deck', playerAChoice.username);

            const bidder = players.find(p => p.name !== playerAChoice.username);
            this.game.queueStep(new AdaptiveShortBidPrompt(this.game, bidder, 0, playerAChoice.uuid));
            return true;
        }

        return true;
    }
}

module.exports = AdaptiveShortChooseDeckPrompt;
