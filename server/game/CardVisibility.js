const OpenInformationLocations = [
    'play area',
    'purged',
    'discard'
];

const godmodeAccounts = [
    'KiP',
    'KiP2',
    'KiP3',
    'KiP4',
    'KiP5',
    'KiP6',
    'KiP7',
    'KiP8',
    'KiP9',
    'KiP10'
];

class CardVisibility {
    constructor(game) {
        this.game = game;
        this.rules = [
            (card) => this.isPublicRule(card),
            (card, player) => this.isControllerRule(card, player),
            (card, player) => this.isSpectatorRule(card, player)
        ];
    }

    isVisible(card, player) {
        return this.rules.some(rule => rule(card, player));
    }

    addRule(rule) {
        this.rules.push(rule);
    }

    removeRule(rule) {
        this.rules = this.rules.filter(r => r !== rule);
    }

    isPublicRule(card) {
        return OpenInformationLocations.includes(card.location) && !card.facedown;
    }

    isControllerRule(card, player) {
        return card.controller === player && (card.location !== 'draw deck' || player.showDeck);
    }

    isSpectatorRule(card, player) {
        return godmodeAccounts.includes(player.name) || (this.game.showHand &&
            player.isSpectator() &&
            ['hand', 'archives'].includes(card.location));
    }
}

module.exports = CardVisibility;
