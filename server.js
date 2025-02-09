const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + "/assets"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_, res) => {
    res.render('index');
});

// criar hmtl com os nomes corretos
function criar_sala(jogador1, jogador2, roomCode) {
    console.log('[CREATING] ' + roomCode)
    scopeRoom[roomCode] = {
        jogador1: jogador1,
        jogador2: jogador2,
        frutas: [],
        frutas_id: {},
        cartas_corretas_jogador1: new Set(),
        cartas_corretas_jogador2: new Set(),
        frutas_escolhidas: [],
        vezDoJogador: jogador1
    }
    // crypto
    const nomeSala = crypto.createHash('sha256').update(jogador1 + roomCode + jogador2).digest('hex');
    console.log("[CRYPTO_SALA]: " + nomeSala);
    console.log("[SALA]: " + roomCode);
    app.get(`/game/${nomeSala}`, (_, res) => {
        res.render('game', { jogador1, jogador2, nomeSala, roomCode });
    });
    return nomeSala;
}

const players = {};
const rooms = {};
let namespacesCreated = {};
let jogarDeNovo = {};

// ############################################## dados dataGameHandling ##############################################
const frutas = ['abacaxi', 'pera', 'uva'];
const emojis = { 'abacaxi': '🍍', 'pera': '🍐', 'uva': '🍇' };
let scopeRoom = {};

function GAME_embaralhar_frutas(nomeSala) {
    console.log('nomeSala: ' + nomeSala);
    console.log(nomeSala in scopeRoom);
    scopeRoom[nomeSala].frutas = [...frutas, ...frutas].sort(() => Math.random() - 0.5);
    scopeRoom[nomeSala].frutas_id = [...frutas, ...frutas].reduce((acc, fruit, index) => {
        acc[index] = fruit;
        return acc;
    }, {});
    console.log('[X] DONE \n')
}
// ###########################################################################################################################



function novo_namespace(nomeSala) {
    console.log("#####################################################################################")
    console.log(`[NAMESPACE_${nomeSala}]> Criando namespace ${nomeSala}`);

    io.of(`/${nomeSala}`).on('connection', (socket) => {
        console.log(`[NAMESPACE_${nomeSala}]>_ ${socket.id} conectou ao namespace ${nomeSala}`);

        // EMBARALHAR AS FRUTAS
        if (!(nomeSala in namespacesCreated) || !namespacesCreated[nomeSala]) {
            console.log('[RANDOM_FRUITS]>_ embaralhar_frutas()');
            namespacesCreated[nomeSala] = false;
            GAME_embaralhar_frutas(nomeSala);
            namespacesCreated[nomeSala] = true;

            // ENVIAR PRO FRONT-END
            console.log('[EMOJIS] ', emojis);
            console.log("[FRUTAS_ID] ", scopeRoom[nomeSala].frutas_id);
            console.log('[vezDoJogador]: ' + scopeRoom[nomeSala].vezDoJogador);

            const data = {
                frutas_id: scopeRoom[nomeSala].frutas_id,
                emojis,
                vezDoJogador: scopeRoom[nomeSala].vezDoJogador,
            };
            socket.emit("startGame", data);
        } else {
            const data = {
                frutas_id: scopeRoom[nomeSala].frutas_id,
                emojis,
                vezDoJogador: scopeRoom[nomeSala].vezDoJogador,
            };
            socket.emit("startGame", data);
        }


        socket.on('flip-flashcard', ({ id, im }) => {
            console.log(`[FLIP_FLASHCARD]>_ ${im} virou a carta ${id}`);

            if (scopeRoom[nomeSala].frutas_escolhidas.includes(id)) return;
            scopeRoom[nomeSala].frutas_escolhidas.push(id);
            console.log('[ADD_FRUTA] ', scopeRoom[nomeSala].frutas_escolhidas);
            socket.broadcast.emit('flip-flashcard', id);

            if (scopeRoom[nomeSala].frutas_escolhidas.length === 2) {
                console.log('[CHECK_FRUTAS]');
                const f1 = scopeRoom[nomeSala].frutas_escolhidas.pop();
                const f2 = scopeRoom[nomeSala].frutas_escolhidas.pop();
                console.log(f1, f2);
                console.log(scopeRoom[nomeSala].frutas_id[f1], scopeRoom[nomeSala].frutas_id[f2]);

                if (scopeRoom[nomeSala].frutas_id[f1] === scopeRoom[nomeSala].frutas_id[f2]) {
                    console.log('[FRUTAS_IGUAIS]');
                    console.log('im: ' + im);
                    console.log("jogador: " + scopeRoom[nomeSala].vezDoJogador);
                    const [j1, j2] = [scopeRoom[nomeSala].jogador1, scopeRoom[nomeSala].jogador2];
                    console.log("jogador1: " + j1);
                    console.log("jogador2: " + j2);

                    if (im === j1) {
                        console.log('[JOGADOR1]>_ + 1 acerto');
                        scopeRoom[nomeSala].cartas_corretas_jogador1.add(f1);
                        scopeRoom[nomeSala].cartas_corretas_jogador1.add(f2);
                    } else {
                        console.log('[JOGADOR2]>_ + 1 acerto');
                        scopeRoom[nomeSala].cartas_corretas_jogador2.add(f1);
                        scopeRoom[nomeSala].cartas_corretas_jogador2.add(f2);
                    }
                    const cj1 = scopeRoom[nomeSala].cartas_corretas_jogador1;
                    const cj2 = scopeRoom[nomeSala].cartas_corretas_jogador2;
                    console.log("[ACERTOS_J1]>_ " + JSON.stringify(cj1), cj1.size);
                    console.log("[ACERTOS_J2]>_ " + JSON.stringify(cj2), cj2.size);
                    console.log();
                } else {
                    console.log('[FRUTAS_DIFERENTES]');
                    if (im === scopeRoom[nomeSala].jogador1) {
                        console.log('[JOGADOR1]>_ + 1 erro');
                    } else {
                        console.log('[JOGADOR2]>_ + 1 erro');
                    }
                    setTimeout(() => io.of(nomeSala).emit('flip-two', { f1, f2 }), 1000);
                }

                // trocar vez
                scopeRoom[nomeSala].vezDoJogador = scopeRoom[nomeSala].vezDoJogador == scopeRoom[nomeSala].jogador1 ?
                    scopeRoom[nomeSala].jogador2 :
                    scopeRoom[nomeSala].jogador1

                console.log('[CHANGE_TURN]>_ ' + scopeRoom[nomeSala].vezDoJogador);
                io.of(nomeSala).emit('vez-jogador', scopeRoom[nomeSala].vezDoJogador);
                const cj1 = scopeRoom[nomeSala].cartas_corretas_jogador1.size;
                const cj2 = scopeRoom[nomeSala].cartas_corretas_jogador2.size;
                const data = {
                    cartas_corretas_jogador1: cj1,
                    cartas_corretas_jogador2: cj2,
                    total: Object.keys(scopeRoom[nomeSala].frutas_id).length
                }
                io.of(nomeSala).emit('cartas-acertadas', data);
            }

        });

        socket.on('invite-play-again', (im) => {
            console.log('[INVITE_ARRIEVED]>_ from ' + im);
            jogarDeNovo[nomeSala] = [im];
            console.log('player waiting: ' + jogarDeNovo[nomeSala]);

            console.log('[INVITE]>_ from ' + im);
            socket.broadcast.emit('received-invite', '');
        });

        socket.on('acept-play-again', (im) => {
            console.log(`[ACCEPT_PLAY_AGAIN]>_ ${im}`);
            console.log('players before: ' + jogarDeNovo[nomeSala]);
            jogarDeNovo[nomeSala].push(im);
            console.log('players play again: ' + jogarDeNovo[nomeSala]);

            // limpar todos os dados
            // delete scope[nomeSala];
            // const data = {};
            io.of(nomeSala).emit('restart', '');
        });

        socket.on('disconnect', () => {
            console.log(`[DISCONNECT]>_ ${socket.id}`);
            io.of(nomeSala).emit('ply-disconnect', '');
        });

    });


}



io.on("connection", (socket) => {
    console.log("Novo jogador conectado");

    // ------------------------------------------------------ criação ------------------------------------------------------
    socket.on("createRoom", ({ username, roomCode }) => {
        // verificar se username e room já existe antes no jogo
        if (username in players && roomCode in rooms) {
            socket.emit("create-user", 'error');
            socket.emit("create-room", 'error');
            return;
        } else if (username in players) {
            socket.emit("create-user", 'error');
            return;
        } else if (roomCode in rooms) {
            socket.emit("create-room", 'error');
            return;
        } else {
            players[username] = '';
            rooms[roomCode] = [username];
            socket.emit("create-user", 'save');
            socket.emit("create-room", 'save');
            console.log(`[CREATE]>_ ${username} criou a sala ${roomCode}`);
            console.log(JSON.stringify(rooms));
            socket.join(roomCode);
        }
    });

    socket.on("del-create-user-room", ({ username, roomCode }) => {
        console.log("####################### DELETEEEEE #######################")
        delete players[username];
        delete rooms[roomCode];
        console.log(`[DEL]>_ Usuário ${socket.id} saiu do jogo`);
        console.log(JSON.stringify(players));
        console.log(JSON.stringify(roomCode));
    });


    // ------------------------------------------------------ join ------------------------------------------------------


    socket.on("joinRoom", ({ username, roomCode }) => {
        // verificar se username e room já existe antes no jogo
        if (username in players) {
            console.log("[ERROR] nome já existe");
            socket.emit("join-user", 'error');
            return;
        }
        else if (!(roomCode in rooms)) {
            console.log("[ERROR] sala não existe");
            socket.emit("join-room", 'error');
            return;
        } else if (rooms[roomCode].length === 2) {
            console.log("[ERROR] sala cheia");
            socket.emit("join-room", 'full');
            return;
        } else {
            console.log(`[JOIN]>_ ${username} TENTou entrar na sala ${roomCode}`);

            // Registra o jogador e adiciona à sala
            players[username] = '';
            rooms[roomCode].push(username);

            // Faz o socket entrar na sala para poder utilizar socket.to(roomCode)
            socket.join(roomCode);

            socket.emit("join-user", 'save');
            socket.emit("join-room", 'save');
            console.log(`[JOIN]>_ ${username} ENTROU na sala ${roomCode}`);

            // Obtém os jogadores da sala (supondo que o primeiro seja jogador1 e o segundo seja jogador2)
            let jogador1 = rooms[roomCode][0];
            let jogador2 = rooms[roomCode][1];

            // Cria a sala (rota) com os nomes corretos
            const nomeSala = criar_sala(jogador1, jogador2, roomCode);

            novo_namespace(`${roomCode}`);

            // Envia evento para o socket atual (jogador que entrou)
            socket.emit('entrar', { im: jogador2, nomeSala });

            // Envia evento para os demais sockets na sala (ou seja, o outro jogador)
            socket.to(roomCode).emit('entrar', { im: jogador1, nomeSala });
        }
    });

    // ------------------------------------------------------ game/chat ------------------------------------------------------
    socket.on('key', ({ key, roomCode, jogador }) => {
        socket.to(roomCode).emit('key', `${jogador} pressionou ${key}`);
    });

    socket.on('disconnect', () => {
        console.log("Jogador desconectado");
    });
});

server.listen(3000, () => {
    console.log("Servidor rodando na porta http://localhost:3000/");
}); 
