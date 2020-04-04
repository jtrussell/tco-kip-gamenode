const OptionsMenuPrompt = require('./OptionsMenuPrompt');
const logger = require('../../log');

class AdaptiveShortBidPrompt extends OptionsMenuPrompt {
    constructor(game, bidder, lastBid, deckUuid) {
        const options = [];

        for(let i = lastBid + 1; i < 24; i++) {
            options.push({
                name: `${i} chain${i === 1 ? '' : 's'}`,
                value: i
            });
        }

        const properties = {
            source: {
                name: 'Bidding Phase'
            },
            activePromptTitle: 'Select a bid or pass',
            waitingPromptTitle: 'Waiting for opponent to bid or pass',
            options,
            optionsHandler: ({ value }) => {
                this.choice = value;
            }
        };

        options.unshift({
            name: 'Pass',
            value: -1
        });

        super(game, bidder, properties);
        this.bidder = bidder;
        this.lastBid = lastBid;
        this.deckUuid = deckUuid;
    }

    onCompleted() {
        const players = this.game.getPlayers();
        const decks = players.map(player => player.deckData);

        const newBidder = players.find(p => p !== this.bidder);
        logger.info(`${this.bidder.name} bids ${this.choice}`);

        if(this.choice === -1) {
            this.game.addAlert('info', `${this.bidder.name} passes`);
            this.game.addAlert('info', `${newBidder.name} wins at ${this.lastBid} chain${this.lastBid === 1 ? '' : 's'}`);
            logger.info(`${this.bidder.name} passes`);
            logger.info(`${newBidder.name} wins at ${this.lastBid} chain${this.lastBid === 1 ? '' : 's'}`);

            newBidder.chains = this.lastBid;
            const deckBidFor = decks.find(d => d.uuid === this.deckUuid);

            if(newBidder.name !== deckBidFor.username) {
                this.game.swapPlayersDecks();
                this.game.initialisePlayers();
            }

            return;
        }

        this.game.addAlert('info', `${this.bidder.name} bids ${this.choice} chains`);
        this.game.queueStep(new AdaptiveShortBidPrompt(this.game, newBidder, this.choice, this.deckUuid));
    }
}

module.exports = AdaptiveShortBidPrompt;
