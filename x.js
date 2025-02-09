const game = require('./dataGameHandling')();

const sala ='sala'
game.use_scope(sala)
game.set_jogadores('hick', 'kate', 'sala');

// console.log('get_jogadores: ' + game.get_jogadores(sala))
// console.log('jogador1: ' + game.get_jogador1(sala));
// console.log('jogador1: ' + game.get_jogador2(sala));
// console.log('vez: ' + game.get_vez_jogador(sala));
// game.embaralhar_frutas(sala);
// console.log(game.get_frutas2(sala));
game.embaralhar_frutas(sala);
console.log(Object.keys(game))
for (const key of Object.keys(game)) {
    console.log('key: ' + key);
    console.log(game[key]);
    console.log();
}
