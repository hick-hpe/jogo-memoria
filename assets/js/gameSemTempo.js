const inputJogador1 = document.querySelector("#jogador1");
const inputJogador2 = document.querySelector("#jogador2");
const inputRoomCode = document.querySelector("#roomCode");
const divCartasJogador1 = document.querySelector("#cartasJogador1");
const divCartasJogador2 = document.querySelector("#cartasJogador2");
const divVezDoJogador = document.querySelector("#vez-do-jogador");
const divAvisoPrevio = document.querySelector("#aviso-previo");
const btnJogarNovamente = document.querySelector("#jogar-novamente");
btnJogarNovamente.style.display = "none";

let im = localStorage.getItem("im");
// Verificar permissão
const URL_ACCESS = `/keyAccess?im=${im}`;

let socket;

fetch(URL_ACCESS)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro: ${response.status}`);
        }
        return response.json(); // Extrai os dados JSON corretamente
    })
    .then(data => {
        console.log('dados retornados');
        console.log(data);

        console.log(`/${roomCode.value}`);
        socket = io(`/${roomCode.value}`);
        console.log('connect to game!!!!');
        habilitar();

        // alert('ESPEREEE');
    }) // Exibe os dados retornados
    .catch(err => {
        window.location.href = '/';
    });


// console.log(`/${roomCode.value}`);
// socket = io(`/${roomCode.value}`);
// console.log('connect to game!!!!');

// ######################################################## DADOS ########################################################

let flashcards;
let STATES = { 0: 'init', 1: 'play', 2: 'ended' };
let stateGame = STATES[0];
let executandoEfeito = false;
let data_vezDoJogador = '';

// ######################################################## SOCKET ########################################################
function habilitar(){
    socket.on('startGame', ({ frutas_id, emojis, vezDoJogador }) => {
        data_vezDoJogador = vezDoJogador;
        board.innerHTML = '';
        for (let id of Object.keys(frutas_id)) {
            const content = `
            <div class="flashcard">
                <div class="flashcard-inner" id="flashcard-${id}" onclick="escolher_flashcard(event)">
                    <div class="flashcard-front" id="ff-${id}">${frutas_id[id]}</div>
                    <div class="flashcard-back" id="fb-${id}"></div>  
                </div>
            </div>
        `;
            board.innerHTML += content;

            // Adiciona imagem na parte de trás da carta
            const fb = document.querySelector(`#fb-${id}`);
            const emoji = emojis[frutas_id[id]];
            fb.innerHTML = emoji;
        }
    });

    socket.on('flip-flashcard', (id) => {
        console.log('[flip-flashcard] virar o receiveed');
        const flashcard = document.querySelector(`#flashcard-${id}`);
        flashcard.classList.toggle('flip');
    });

    socket.on('vez-jogador', (vezDoJogador) => {
        data_vezDoJogador = vezDoJogador;
        divVezDoJogador.textContent = vezDoJogador;
    });

    socket.on('cartas-acertadas', ({ cartas_corretas_jogador1, cartas_corretas_jogador2, total }) => {
        divCartasJogador1.textContent = cartas_corretas_jogador1;
        divCartasJogador2.textContent = cartas_corretas_jogador2;

        if (total == cartas_corretas_jogador1 + cartas_corretas_jogador2) {
            stateGame = STATES[2];
            fim_de_jogo();

            let conteudo = '';
            if (cartas_corretas_jogador1 > cartas_corretas_jogador2) {
                if (im === inputJogador1.value) {
                    conteudo = 'VOCÊ VENCEU!!!';
                } else {
                    conteudo = 'VOCÊ PERDEU :(';
                }
            } else {
                if (im === inputJogador2.value) {
                    conteudo = 'VOCÊ VENCEU!!!';
                } else {
                    conteudo = 'VOCÊ PERDEU :(';
                }
            }

            const MENSAGEM = `
            FIM DE JOGO!!!! 
            ${conteudo}
        `;
            alert(MENSAGEM);

            btnJogarNovamente.style.display = "flex";
        }
    });

    socket.on('flip-two', ({ f1, f2 }) => {
        console.log('Ambos jogadores viraram cartas');
        const fc1 = document.querySelector(`#flashcard-${f1}`);
        const fc2 = document.querySelector(`#flashcard-${f2}`);
        fc1.classList.toggle('flip');
        fc2.classList.toggle('flip');
    });

    socket.on('received-invite', () => {
        btnJogarNovamente.innerHTML = `Você foi convidado para jogar novamente!`;
    });

    socket.on('to-default', () => {
        console.log('BUTTON');
        btnJogarNovamente.innerHTML = 'Jogar Novamente';
        btnJogarNovamente.disabled = false;
        btnJogarNovamente.style.display = 'none';

        divCartasJogador1.textContent = 0;
        divCartasJogador2.textContent = 0;

        data_vezDoJogador = inputJogador1.value;
        divVezDoJogador = inputJogador1.value;
    });

    socket.on('ply-disconnect', () => {
        window.location.href = '/';
    });
}


// ######################################################## FUNÇÕES ########################################################
function formatar_tempo() {
    return `0${parseInt(segundos / 60)}:${segundos % 60 < 10 ? '0' : ''}${segundos % 60}`;
}

function escolher_flashcard(e) {
    if (im == data_vezDoJogador) {
        const flashcard = e.target.closest('.flashcard-inner');
        const id = parseInt(flashcard.id.replace('flashcard-', ''));
        if (!flashcard.className.includes('flip')) {
            // se nao estiver virada, vire
            flashcard.classList.toggle('flip');
            console.log('[enviando] ' + JSON.stringify({ id, im }));
            socket.emit('flip-flashcard', { id, im });
        }
    } else {
        alert('Escolha do outro jogador');
    }
}

function fim_de_jogo() {
    console.log('Fim de jogo!');
}

function exibir_aviso_previo() {
    // let i = 4;
    let i = 0;

    console.log('preparando...');
    let thisinterval = setInterval(() => {
        divAvisoPrevio.innerHTML = `Começando em ${i}...`;
        i--;
        if (i < 0) {
            clearInterval(thisinterval);
            console.log('iniciar jogo!');
            divAvisoPrevio.innerHTML = 'JOGAR!!!';
        }
    }, 1000);

}

function jogo_rodando() {
    console.log('Jogo rodando...');
}

function iniciar_jogo() {
    exibir_aviso_previo();
    setTimeout(() => {
        jogo_rodando();
    }, 1000);
}
iniciar_jogo()

btnJogarNovamente.onclick = () => {
    if (btnJogarNovamente.innerHTML === 'Jogar Novamente') {
        const jogador = im === inputJogador1.value ? inputJogador2.value : inputJogador1.value;
        btnJogarNovamente.disabled = true;
        btnJogarNovamente.innerHTML = `
            <img src="/img/loading.gif" alt="carregando"> <i>Esperando ${jogador} aceitar</i>
        `;
        socket.emit('invite-play-again', im);
    } else {
        socket.emit('acept-play-again', im);
    }
}


// ######################################################## MODAL ########################################################

// Exibir modal específico
function showModal(tipo) {
    const modal = document.getElementById(tipo);
    modal.style.display = "flex";
}

// Fechar modal
function fecharModal(tipo) {
    document.getElementById(tipo).style.display = "none";
}
