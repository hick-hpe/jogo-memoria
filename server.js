const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const crypto = require("crypto");
const dataGameHandling = require('./dataGameHandling');
const jogoController = dataGameHandling();

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
    jogoController.set_jogadores(jogador1, jogador2);
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

function novo_namespace(nomeSala) {
    console.log(`[NAMESPACE_${nomeSala}]> Criando namespace ${nomeSala}`);

    io.of(nomeSala).on('connection', (socket) => {
        console.log(`[NAMESPACE_${nomeSala}]>_ ${socket.id} conectou ao namespace ${nomeSala}`);

        // EMBARALHAR AS FRUTAS
        if (!(nomeSala in namespacesCreated) || !namespacesCreated[nomeSala]) {
            namespacesCreated[nomeSala] = false;
            jogoController.embaralhar_frutas();
            namespacesCreated[nomeSala] = true;
        }

        // ENVIAR PRO FRONT-END
        const frutas = jogoController.get_frutas2();
        const emojis = jogoController.get_emojis();
        const frutas_id = jogoController.get_frutas_id();
        console.log("[FRUTAS_ID] ", frutas_id);
        let vezDoJogador = jogoController.get_vez_jogador();
        socket.emit("startGame", { frutas, emojis, vezDoJogador });

        console.log('[ROOM]')
        console.log(jogoController.jogador1, jogoController.jogador2);

        console.log('[VEZ_INICIAL] ' + jogoController.get_vez_jogador());


        socket.on('flip-flashcard', ({ id, im }) => {
            console.log(`[FLIP_FLASHCARD]>_ ${im} virou a carta ${id}`);

            if (jogoController.get_frutas_escolhidas().includes(id)) return;
            jogoController.add_frutas_escolhidas(id);
            console.log('[ADD_FRUTA] ', jogoController.get_frutas_escolhidas());
            socket.broadcast.emit('flip-flashcard', id);

            if (jogoController.get_frutas_escolhidas().length === 2) {
                console.log('[CHECK_FRUTAS]');
                const f1 = jogoController.pop_frutas_escolhidas();
                const f2 = jogoController.pop_frutas_escolhidas();
                console.log(f1, f2);
                console.log(frutas_id[f1], frutas_id[f2]);

                if (frutas_id[f1] === frutas_id[f2]) {
                    console.log('[FRUTAS_IGUAIS]');
                    if (im === jogoController.jogador1) {
                        console.log('[JOGADOR1]>_ + 1 acerto');
                        jogoController.add_cartas_corretas_jogador1(f1);
                        jogoController.add_cartas_corretas_jogador1(f2);
                    } else {
                        console.log('[JOGADOR2]>_ + 1 acerto');
                        jogoController.add_cartas_corretas_jogador2(f1);
                        jogoController.add_cartas_corretas_jogador2(f2);
                    }
                    console.log("[ACERTOS_J1]>_ " + jogoController.get_cartas_corretas_jogador1());
                    console.log("[ACERTOS_J2]>_ " + jogoController.get_cartas_corretas_jogador2());
                    console.log();
                } else {
                    console.log('[FRUTAS_DIFERENTES]');
                    if (im === jogoController.jogador1) {
                        console.log('[JOGADOR1]>_ + 1 erro');
                    } else {
                        console.log('[JOGADOR2]>_ + 1 erro');
                    }
                    setTimeout(() => io.of(nomeSala).emit('flip-two', { f1, f2 }), 1000);
                }
                jogoController.toggle_vez_jogador();
                console.log('[CHANGE_TURN]>_ ' + jogoController.get_vez_jogador());
                io.of(nomeSala).emit('vez-jogador', jogoController.get_vez_jogador());
            }

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

            novo_namespace(`/${roomCode}`);

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
