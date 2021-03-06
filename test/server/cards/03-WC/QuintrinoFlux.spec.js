describe('Quintrino Flux', function() {
    integration(function() {
        describe('Quintrino Flux\'s ability', function() {
            beforeEach(function() {
                this.setupTest({
                    player1: {
                        house: 'staralliance',
                        hand: ['quintrino-flux'],
                        inPlay: ['navigator-ali', 'nurse-soto', 'lieutenant-khrkhar'] //[3, 3, 5]
                    },
                    player2: {
                        inPlay: ['gamgee', 'silvertooth', 'yantzee-gang'] //[2, 2, 5]
                    }
                });
            });

            it('should prompt the player to choose a friendly target and an enemy target, and destroy all creatures with that power', function() {
                this.player1.play(this.quintrinoFlux);
                expect(this.player1).toHavePrompt('Quintrino Flux');
                expect(this.player1).toBeAbleToSelect(this.navigatorAli);
                expect(this.player1).toBeAbleToSelect(this.nurseSoto);
                expect(this.player1).toBeAbleToSelect(this.lieutenantKhrkhar);
                expect(this.player1).not.toBeAbleToSelect(this.gamgee);
                expect(this.player1).not.toBeAbleToSelect(this.silvertooth);
                expect(this.player1).not.toBeAbleToSelect(this.yantzeeGang);
                this.player1.clickCard(this.nurseSoto);
                expect(this.player1).toHavePrompt('Quintrino Flux');
                expect(this.player1).toBeAbleToSelect(this.gamgee);
                expect(this.player1).toBeAbleToSelect(this.silvertooth);
                expect(this.player1).toBeAbleToSelect(this.yantzeeGang);
                expect(this.player1).not.toBeAbleToSelect(this.navigatorAli);
                expect(this.player1).not.toBeAbleToSelect(this.nurseSoto);
                expect(this.player1).not.toBeAbleToSelect(this.lieutenantKhrkhar);
                this.player1.clickCard(this.silvertooth);
                expect(this.silvertooth.location).toBe('discard');
                expect(this.nurseSoto.location).toBe('discard');
                expect(this.navigatorAli.location).toBe('discard');
                expect(this.gamgee.location).toBe('discard');
                expect(this.lieutenantKhrkhar.location).toBe('play area');
                expect(this.yantzeeGang.location).toBe('play area');
                expect(this.player1).toHavePrompt('Choose a card to play, discard or use');
            });
        });

        describe('Quintrino Flux\'s ability', function() {
            beforeEach(function() {
                this.setupTest({
                    player1: {
                        house: 'staralliance',
                        hand: ['quintrino-flux'],
                        inPlay: ['thero-centurion', 'tricerian-legionary'] // [6, 5]
                    },
                    player2: {
                        inPlay: ['mogghunter', 'ogopogo', 'kaloch-stonefather', 'cowfyne', 'alaka'] // [6, 6, 6, 5, 4]
                    }
                });
            });

            it('should work with warded creatures', function() {
                this.theroCenturion.ward();
                this.player1.play(this.quintrinoFlux);
                this.player1.clickCard(this.theroCenturion);
                this.player1.clickCard(this.alaka);
                expect(this.theroCenturion.warded).toBe(false);
                expect(this.theroCenturion.location).toBe('play area');
                expect(this.tricerianLegionary.location).toBe('play area');
                expect(this.mogghunter.location).toBe('discard');
                expect(this.ogopogo.location).toBe('discard');
                expect(this.kalochStonefather.location).toBe('discard');
                expect(this.cowfyne.location).toBe('play area');
                expect(this.alaka.location).toBe('discard');
                expect(this.player1).toHavePrompt('Choose a card to play, discard or use');
            });
        });

        describe('Quintrino Flux\'s ability', function() {
            beforeEach(function() {
                this.setupTest({
                    player1: {
                        house: 'staralliance',
                        hand: ['quintrino-flux'],
                        inPlay: ['navigator-ali', 'nurse-soto']
                    },
                    player2: {
                    }
                });
            });

            it('should prompt for friendly creatures in play', function() {
                this.player1.play(this.quintrinoFlux);
                expect(this.player1).toHavePrompt('Quintrino Flux');
                expect(this.player1).toBeAbleToSelect(this.navigatorAli);
                expect(this.player1).toBeAbleToSelect(this.nurseSoto);
                this.player1.clickCard(this.nurseSoto);
                expect(this.nurseSoto.location).toBe('discard');
                expect(this.navigatorAli.location).toBe('discard');
                expect(this.player1).toHavePrompt('Choose a card to play, discard or use');
            });
        });

        describe('Quintrino Flux\'s ability', function() {
            beforeEach(function() {
                this.setupTest({
                    player1: {
                        house: 'staralliance',
                        hand: ['quintrino-flux']
                    },
                    player2: {
                        inPlay: ['gamgee', 'silvertooth', 'yantzee-gang']
                    }
                });
            });

            it('should prompt for enemy creatures in play', function() {
                this.player1.play(this.quintrinoFlux);
                expect(this.player1).toHavePrompt('Quintrino Flux');
                expect(this.player1).toBeAbleToSelect(this.gamgee);
                expect(this.player1).toBeAbleToSelect(this.silvertooth);
                expect(this.player1).toBeAbleToSelect(this.yantzeeGang);
                this.player1.clickCard(this.silvertooth);
                expect(this.silvertooth.location).toBe('discard');
                expect(this.gamgee.location).toBe('discard');
                expect(this.yantzeeGang.location).toBe('play area');
                expect(this.player1).toHavePrompt('Choose a card to play, discard or use');
            });
        });

        describe('Quintrino Flux\'s ability', function() {
            beforeEach(function() {
                this.setupTest({
                    player1: {
                        house: 'staralliance',
                        hand: ['quintrino-flux']
                    },
                    player2: {
                    }
                });
            });

            it('should be able to play when no creatures are in play', function() {
                this.player1.play(this.quintrinoFlux);
                expect(this.player1).toHavePrompt('Choose a card to play, discard or use');
            });
        });
    });
});
