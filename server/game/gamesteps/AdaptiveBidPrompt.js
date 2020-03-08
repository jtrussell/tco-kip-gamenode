const OptionsMenuPrompt = require('./OptionsMenuPrompt');
const logger = require('../../log');

class AdaptiveBidPrompt extends OptionsMenuPrompt {
    constructor(game, bidder, lastBid) {
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
    }

    onCompleted() {
        const newBidder = this.game.getPlayers().find(p => p !== this.bidder);
        logger.info(`${this.bidder.name} bids ${this.lastBid}`);

        if(this.choice === -1) {
            this.game.addAlert('info', `${this.bidder.name} passes`);
            this.game.addAlert('info', `${newBidder.name} wins at ${this.lastBid} chain${this.lastBid === 1 ? '' : 's'}`);
            logger.info(`${this.bidder.name} passes`);
            logger.info(`${newBidder.name} wins at ${this.lastBid} chain${this.lastBid === 1 ? '' : 's'}`);
            this.game.adaptiveData.bidWinner = newBidder.name;
            this.game.adaptiveData.bidWinChains = this.lastBid;
            this.game.rematch();
            return;
        }

        this.game.addAlert('info', `${this.bidder.name} bids ${this.choice} chains`);
        this.game.queueStep(new AdaptiveBidPrompt(this.game, newBidder, this.choice));
    }
}

module.exports = AdaptiveBidPrompt;
