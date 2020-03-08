const Card = require('../../Card.js');

class GronNineToes extends Card {
    setupCardAbilities(ability) {
        this.persistentEffect({
            match: this,
            condition: () => this.tokens.damage > 0,
            effect: ability.effects.modifyPower(4)
        });
    }
}

GronNineToes.id = 'gron-nine-toes';

module.exports = GronNineToes;
