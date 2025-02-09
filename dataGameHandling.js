
//     // Frutas
//     const frutas = [
//         'abacaxi',
//         'pera', 'uva',
//         //  'apple', 'cereja',
//         // 'abacate', 'melancia', 'morango', 'laranja', 'pessego', 'mirtilos', 'kiwi'
//     ];
//     let frutas2 = [];
//     const emojis = {
//         'abacaxi': '🍍',
//         'pera': '🍐',
//         'uva': '🍇',
//         // 'apple': '🍎',
//         // 'cereja': '🍒',
//         // 'abacate': '🥑',
//         // 'melancia': '🍉',
//         // 'morango': '🍓',
//         // 'laranja': '🍊',
//         // 'pessego': '🍑',
//         // 'mirtilos': '🫐',
//         // 'kiwi': '🥝'
//     };



const dataGameHandling = () => {
    // Frutas
    const frutas = ['abacaxi', 'pera', 'uva'];
    const emojis = { 'abacaxi': '🍍', 'pera': '🍐', 'uva': '🍇' };
    let scope = {};

    return {
        use_scope: (roomCode) => {
            if (!(roomCode in scope)) {
                scope[roomCode] = {
                    jogador1: null,
                    jogador2: null,
                    frutas: [],
                    frutas_id: {},
                    cartas_corretas_jogador1: new Set(),
                    cartas_corretas_jogador2: new Set(),
                    frutas_escolhidas: [],
                    vezDoJogador: null
                };
                console.log('[USE_SCOPE] Criando nova sala: ' + roomCode);
            } else {
                console.log('[USE_SCOPE] Sala já existe: ' + roomCode);
            }
        },
        set_jogadores: (j1, j2, roomCode) => {
            if (roomCode in scope) {
                scope[roomCode].jogador1 = j1;
                scope[roomCode].jogador2 = j2;
                scope[roomCode].vezDoJogador = j1;

                console.log('[SET JOGAD]>_ ', scope[roomCode].jogador1, scope[roomCode].jogador2, scope[roomCode].vezDoJogador);
            }
        },
        get_jogadores: (roomCode) => scope[roomCode] ? [scope[roomCode].jogador1, scope[roomCode].jogador2] : [],
        toggle_vez_jogador: (roomCode) => {
            if (roomCode in scope) {
                scope[roomCode].vezDoJogador =
                    scope[roomCode].vezDoJogador === scope[roomCode].jogador1
                        ? scope[roomCode].jogador2
                        : scope[roomCode].jogador1;
            }
        },
        get_jogador1: (roomCode) => { return scope[roomCode]?.jogador1 },
        get_jogador2: (roomCode) => { return scope[roomCode]?.jogador2 },
        get_vez_jogador: (roomCode) => { return scope[roomCode]?.vezDoJogador },
        embaralhar_frutas: (roomCode) => {
            console.log('tentando embaralhar :(');
            console.log(JSON.stringify(scope));
            console.log('existe?? :( -> ' + roomCode);
            console.log(scope[roomCode]);
            console.log(scope.roomCode);
            console.log(roomCode in scope);
            console.log((scope.hasOwnProperty(roomCode)));

            console.log('-------------------------------------');
            for (const key of Object.keys(scope)) {
                console.log('key: ' + key);
                console.log(scope[key]);
                console.log();
            }

            if (roomCode in scope) {
                console.log('[SCOPE]>_ ' + JSON.stringify(scope));

                console.log('randooming...')
                const frutas2 = [...frutas, ...frutas].sort(() => Math.random() - 0.5);
                let frutas_id2 = {};
                frutas2.forEach((fruta, index) => {
                    frutas_id2[index] = fruta;
                    console.log(':D');
                });

                scope[roomCode].frutas_id = {};
                scope[roomCode].frutas_id = frutas_id2;

                console.log('[RANDOM_FRUIT_GAME]>_ ');
                // console.log('[S_FRUITS]>_ ' + scope[roomCode].frutas);
                console.log('[S_FRUITS_ID]>_ ' + JSON.stringify(scope[roomCode].frutas_id));
            } else {
                console.log('[EMBARALHAR_FRUITS]>_ Sala não encontrada');
            }
        },
        // get_frutas2: (roomCode) => frutas,
        get_emojis: () => emojis,
        get_frutas_id: (roomCode) => scope[roomCode].frutas_id,
        add_frutas_escolhidas: (roomCode, fruta) => {
            if (roomCode in scope) scope[roomCode].frutas_escolhidas.push(fruta);
        },
        get_frutas_escolhidas: (roomCode) => scope[roomCode] ? scope[roomCode].frutas_escolhidas : [],
        pop_frutas_escolhidas: (roomCode) => {
            if (roomCode in scope) return scope[roomCode].frutas_escolhidas.pop();
            return null;
        },
        add_cartas_corretas_jogador1: (roomCode, carta) => {
            if (roomCode in scope) scope[roomCode].cartas_corretas_jogador1.add(carta);
        },
        add_cartas_corretas_jogador2: (roomCode, carta) => {
            if (roomCode in scope) scope[roomCode].cartas_corretas_jogador2.add(carta);
        },
        get_cartas_corretas_jogador1: (roomCode) => scope[roomCode] ? scope[roomCode].cartas_corretas_jogador1 : new Set(),
        get_cartas_corretas_jogador2: (roomCode) => scope[roomCode] ? scope[roomCode].cartas_corretas_jogador2 : new Set(),
        clear: (roomCode) => {
            if (roomCode in scope) {
                delete scope[roomCode];
            }
        }
    };
};

module.exports = dataGameHandling;
