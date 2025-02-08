const dataGameHandling = () => {
    // Frutas
    const frutas = [
        'abacaxi', 'pera', 'uva', 'apple', 'cereja', 'abacate',
        'melancia', 'morango', 'laranja', 'pessego', 'mirtilos', 'kiwi'
    ];
    let frutas2 = [];
    const emojis = {
        'abacaxi': '🍍',
        'pera': '🍐',
        'uva': '🍇',
        'apple': '🍎',
        'cereja': '🍒',
        'abacate': '🥑',
        'melancia': '🍉',
        'morango': '🍓',
        'laranja': '🍊',
        'pessego': '🍑',
        'mirtilos': '🫐',
        'kiwi': '🥝'
    };
    let frutas_escolhidas = [];
    let frutas_id = {};
    let jogador1 = '';
    let jogador2 = '';
    let vezDoJogador = '';

    const cartas_corretas_jogador1 = new Set();
    const cartas_corretas_jogador2 = new Set();

    // Embaralhar (Fisher-Yates)
    const embaralhar_frutas = () => {
        frutas2 = [...frutas, ...frutas].sort(() => Math.random() - 0.5);  // Duplicando frutas para mais cartas
        frutas2.forEach((frutas, index) => {
            frutas_id[index] = frutas;
        });
    };

    // Retornos para acessar as variáveis externas
    return {
        set_jogadores: (j1, j2) => { jogador1 = j1; jogador2 = j2, vezDoJogador = j1 },
        jogador1,
        jogador2,
        toggle_vez_jogador: () => { vezDoJogador = vezDoJogador == jogador1 ? jogador2 : jogador1 },
        get_vez_jogador: () => vezDoJogador,
        embaralhar_frutas,
        get_frutas2: () => frutas2,
        get_emojis: () => emojis,
        get_frutas_id: () => frutas_id,
        add_frutas_escolhidas: (f) => frutas_escolhidas.push(f),
        get_frutas_escolhidas: () => frutas_escolhidas,
        pop_frutas_escolhidas: () => frutas_escolhidas.pop(),
        add_cartas_corretas_jogador1: (carta) => cartas_corretas_jogador1.add(carta),
        add_cartas_corretas_jogador2: (carta) => cartas_corretas_jogador2.add(carta),
        get_cartas_corretas_jogador1: () => cartas_corretas_jogador1,
        get_cartas_corretas_jogador2: () => cartas_corretas_jogador2,
    };
};

module.exports = dataGameHandling;
