const game = require('./dataGameHandling')();

game.set_jogadores('hick', 'kate');

for (let i = 0; i < 5; i++) {
    game.toggle_vez_jogador();
    console.log('[VEZ]>_ ' + game.get_vez_jogador());
    console.log();
}

