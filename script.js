/* =========================================================
   CUIDADO JUNTOS
   SCRIPT PRINCIPAL
   VERSÃO CORRIGIDA
========================================================= */


/* =========================================================
   FIREBASE
========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================================
   CONFIGURAÇÃO FIREBASE
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyAwywIKk97Ro_NHutu4T7zeL_uCdZ2juM8",
  authDomain: "cuidado-juntos.firebaseapp.com",
  projectId: "cuidado-juntos",
  storageBucket: "cuidado-juntos.firebasestorage.app",
  messagingSenderId: "453583954077",
  appId: "1:453583954077:web:c55a6fd18f107a0c447474"
};


/* =========================================================
   VARIÁVEIS
========================================================= */

let db = null;
let auth = null;

let firebaseAutenticado = false;

let unsubscribeHoje = null;
let unsubscribeHistorico = null;

let registros = {};
let registrosHistorico = {};

let horarioSelecionado = null;


/* =========================================================
   LOCAL STORAGE
========================================================= */

const CHAVE_USUARIO =
  "cuidadoJuntos_nomeUsuario";

const CHAVE_NOTIFICACAO =
  "cuidadoJuntos_notificacoes";

const CHAVE_ULTIMO_AVISO =
  "cuidadoJuntos_ultimoAviso";


/* =========================================================
   ESTADO
========================================================= */

let nomeUsuario =
  localStorage.getItem(CHAVE_USUARIO) || "";

let notificacaoAtiva =
  localStorage.getItem(CHAVE_NOTIFICACAO) === "true";

let ultimoAviso =
  localStorage.getItem(CHAVE_ULTIMO_AVISO) || "";


/* =========================================================
   HORÁRIOS DOS MEDICAMENTOS
========================================================= */

const HORARIOS = [
  "08:00",
  "09:00",
  "10:00",
  "12:00",
  "16:00",
  "20:00",
  "21:00",
  "22:00",
  "00:00"
];


/* =========================================================
   ELEMENTOS DA PÁGINA
========================================================= */

const telaLogin =
  document.getElementById("tela-login");

const telaApp =
  document.getElementById("tela-app");

const nomeInput =
  document.getElementById("nome-usuario");

const botaoEntrar =
  document.getElementById("btn-entrar");

const erroLogin =
  document.getElementById("erro-login");

const nomeExibido =
  document.getElementById("nome-exibido");

const botaoSair =
  document.getElementById("btn-sair");

const botaoNotificacao =
  document.getElementById("btn-notificacao");

const modalConfirmacao =
  document.getElementById("modal-confirmacao");

const textoConfirmacao =
  document.getElementById("texto-confirmacao");

const botaoCancelar =
  document.getElementById("btn-cancelar");

const botaoConfirmar =
  document.getElementById("btn-confirmar");

const totalMedicamentos =
  document.getElementById("total-medicamentos");

const totalDados =
  document.getElementById("total-dados");

const totalPendentes =
  document.getElementById("total-pendentes");

const listaHistorico =
  document.getElementById("lista-historico");

const dataHistorico =
  document.getElementById("data-historico");

const historicoTotal =
  document.getElementById("historico-total");

const paginaMedicamentos =
  document.getElementById("pagina-medicamentos");

const paginaHistorico =
  document.getElementById("pagina-historico");

const botaoPaginaMedicamentos =
  document.getElementById(
    "btn-pagina-medicamentos"
  );

const botaoPaginaHistorico =
  document.getElementById(
    "btn-pagina-historico"
  );

const botaoVoltarMedicamentos =
  document.getElementById(
    "btn-voltar-medicamentos"
  );


/* =========================================================
   DATA DO CICLO
========================================================= */

function obterDataHoje() {

  const agora = new Date();

  /*
   * Antes das 06:00 pertence ao dia anterior.
   */

  if (agora.getHours() < 6) {
    agora.setDate(
      agora.getDate() - 1
    );
  }

  const ano =
    agora.getFullYear();

  const mes =
    String(
      agora.getMonth() + 1
    ).padStart(2, "0");

  const dia =
    String(
      agora.getDate()
    ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}


/* =========================================================
   DATA BONITA
========================================================= */

function formatarDataBonita(dataISO) {

  if (!dataISO) {
    return "";
  }

  const partes =
    dataISO.split("-");

  if (partes.length !== 3) {
    return dataISO;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


/* =========================================================
   SALVAR NOME
========================================================= */

function salvarNome(nome) {

  nomeUsuario =
    nome.trim();

  localStorage.setItem(
    CHAVE_USUARIO,
    nomeUsuario
  );

}


/* =========================================================
   MOSTRAR APLICATIVO
========================================================= */

function mostrarAplicativo() {

  if (!telaLogin || !telaApp) {
    console.error(
      "Elementos da tela não encontrados."
    );

    return;
  }

  telaLogin.classList.add(
    "escondido"
  );

  telaApp.classList.remove(
    "escondido"
  );

  /*
   * Garante que o aplicativo fique visível
   * mesmo se o CSS usar display.
   */

  telaApp.style.display = "";


  if (nomeExibido) {

    nomeExibido.textContent =
      nomeUsuario;

  }


  atualizarTela();

  atualizarBotaoNotificacao();

  definirDataHistorico();

  mostrarPaginaMedicamentos();


  /*
   * Se o Firebase já estiver conectado,
   * carrega os registros imediatamente.
   */

  if (firebaseAutenticado) {

    carregarRegistrosHoje();

  }

}


/* =========================================================
   MOSTRAR LOGIN
========================================================= */

function mostrarLogin() {

  if (!telaLogin || !telaApp) {
    return;
  }

  telaLogin.classList.remove(
    "escondido"
  );

  telaApp.classList.add(
    "escondido"
  );

  telaApp.style.display =
    "none";

}


/* =========================================================
   LOGIN
========================================================= */

function realizarLogin() {

  const nomeDigitado =
    nomeInput
      ? nomeInput.value.trim()
      : "";


  if (!nomeDigitado) {

    if (erroLogin) {

      erroLogin.textContent =
        "Digite seu primeiro nome para entrar.";

    }

    if (nomeInput) {

      nomeInput.focus();

    }

    return;

  }


  /*
   * Remove mensagem de erro.
   */

  if (erroLogin) {

    erroLogin.textContent =
      "";

  }


  /*
   * Salva o nome imediatamente.
   */

  salvarNome(
    nomeDigitado
  );


  /*
   * Entra no aplicativo SEM esperar
   * o Firebase.
   */

  mostrarAplicativo();


  /*
   * Se o Firebase já estiver pronto,
   * carrega os registros.
   */

  if (firebaseAutenticado) {

    carregarRegistrosHoje();

  }

}


/*
 * Botão Entrar
 */

if (botaoEntrar) {

  botaoEntrar.addEventListener(
    "click",
    realizarLogin
  );

}


/*
 * Enter no campo de nome
 */

if (nomeInput) {

  nomeInput.addEventListener(
    "keydown",
    function (evento) {

      if (evento.key === "Enter") {

        evento.preventDefault();

        realizarLogin();

      }

    }
  );

}


/* =========================================================
   NAVEGAÇÃO
========================================================= */

function mostrarPaginaMedicamentos() {

  if (
    !paginaMedicamentos ||
    !paginaHistorico
  ) {
    return;
  }


  paginaMedicamentos.classList.remove(
    "escondido"
  );

  paginaHistorico.classList.add(
    "escondido"
  );


  if (botaoPaginaMedicamentos) {

    botaoPaginaMedicamentos.classList.add(
      "ativo"
    );

  }


  if (botaoPaginaHistorico) {

    botaoPaginaHistorico.classList.remove(
      "ativo"
    );

  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


function mostrarPaginaHistorico() {

  if (
    !paginaMedicamentos ||
    !paginaHistorico
  ) {
    return;
  }


  paginaMedicamentos.classList.add(
    "escondido"
  );

  paginaHistorico.classList.remove(
    "escondido"
  );


  if (botaoPaginaMedicamentos) {

    botaoPaginaMedicamentos.classList.remove(
      "ativo"
    );

  }


  if (botaoPaginaHistorico) {

    botaoPaginaHistorico.classList.add(
      "ativo"
    );

  }


  definirDataHistorico();


  if (
    firebaseAutenticado &&
    dataHistorico
  ) {

    carregarHistorico(
      dataHistorico.value
    );

  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


if (botaoPaginaMedicamentos) {

  botaoPaginaMedicamentos.addEventListener(
    "click",
    mostrarPaginaMedicamentos
  );

}


if (botaoPaginaHistorico) {

  botaoPaginaHistorico.addEventListener(
    "click",
    mostrarPaginaHistorico
  );

}


if (botaoVoltarMedicamentos) {

  botaoVoltarMedicamentos.addEventListener(
    "click",
    mostrarPaginaMedicamentos
  );

}


/* =========================================================
   DATA DO HISTÓRICO
========================================================= */

function definirDataHistorico() {

  if (
    dataHistorico &&
    !dataHistorico.value
  ) {

    dataHistorico.value =
      obterDataHoje();

  }

}


if (dataHistorico) {

  dataHistorico.addEventListener(
    "change",
    function () {

      const dataSelecionada =
        dataHistorico.value;

      if (!dataSelecionada) {
        return;
      }

      if (firebaseAutenticado) {

        carregarHistorico(
          dataSelecionada
        );

      }

    }
  );

}


/* =========================================================
   SAIR
========================================================= */

if (botaoSair) {

  botaoSair.addEventListener(
    "click",
    function () {

      const confirmarSaida =
        window.confirm(
          "Deseja sair e trocar o familiar deste aparelho?"
        );


      if (!confirmarSaida) {
        return;
      }


      localStorage.removeItem(
        CHAVE_USUARIO
      );


      nomeUsuario =
        "";


      if (nomeInput) {

        nomeInput.value =
          "";

      }


      if (unsubscribeHoje) {

        unsubscribeHoje();

        unsubscribeHoje =
          null;

      }


      if (unsubscribeHistorico) {

        unsubscribeHistorico();

        unsubscribeHistorico =
          null;

      }


      registros = {};

      registrosHistorico = {};


      mostrarLogin();

    }
  );

}


/* =========================================================
   MODAL
========================================================= */

function abrirModal(horario) {

  horarioSelecionado =
    horario;


  if (textoConfirmacao) {

    textoConfirmacao.textContent =
      "Você está registrando o medicamento das " +
      horario +
      ". Confirma que ele foi dado?";

  }


  if (modalConfirmacao) {

    modalConfirmacao.classList.remove(
      "escondido"
    );

    modalConfirmacao.style.display =
      "flex";

  }

}


function fecharModal() {

  horarioSelecionado =
    null;


  if (modalConfirmacao) {

    modalConfirmacao.classList.add(
      "escondido"
    );

    modalConfirmacao.style.display =
      "none";

  }

}


if (botaoCancelar) {

  botaoCancelar.addEventListener(
    "click",
    fecharModal
  );

}


/* =========================================================
   BOTÕES DAR
========================================================= */

function configurarBotoesDar() {

  const botoes =
    document.querySelectorAll(
      ".btn-dar"
    );


  botoes.forEach(
    function (botao) {

      if (
        botao.dataset.eventoConfigurado ===
        "true"
      ) {
        return;
      }


      botao.dataset.eventoConfigurado =
        "true";


      botao.addEventListener(
        "click",
        function () {

          if (botao.disabled) {
            return;
          }


          const cartao =
            botao.closest(
              ".medicamento-card"
            );


          if (!cartao) {

            console.error(
              "Cartão do medicamento não encontrado."
            );

            return;

          }


          const horario =
            cartao.getAttribute(
              "data-horario"
            );


          if (!horario) {

            console.error(
              "Horário não encontrado."
            );

            return;

          }


          abrirModal(
            horario
          );

        }
      );

    }
  );

}


/* =========================================================
   CONFIRMAR MEDICAMENTO
========================================================= */

if (botaoConfirmar) {

  botaoConfirmar.addEventListener(
    "click",
    async function () {

      if (!horarioSelecionado) {
        return;
      }


      if (!firebaseAutenticado || !db) {

        window.alert(
          "Aguarde a conexão com o aplicativo."
        );

        return;

      }


      const horario =
        horarioSelecionado;


      const agora =
        new Date();


      const dataISO =
        obterDataHoje();


      const horaRegistro =
        agora.toLocaleTimeString(
          "pt-BR",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );


      const dataRegistro =
        agora.toLocaleDateString(
          "pt-BR"
        );


      const idRegistro =
        `${dataISO}_${horario.replace(
          ":",
          "-"
        )}`;


      const registro = {

        horario:
          horario,

        nome:
          nomeUsuario ||
          "Familiar",

        horaRegistro:
          horaRegistro,

        dataRegistro:
          dataRegistro,

        dataISO:
          dataISO,

        dataCompleta:
          agora.toISOString()

      };


      try {

        botaoConfirmar.disabled =
          true;

        botaoConfirmar.textContent =
          "Salvando...";


        await setDoc(
          doc(
            db,
            "registros",
            idRegistro
          ),
          registro
        );


        /*
         * Atualização imediata.
         */

        registros[horario] =
          registro;


        atualizarTela();

        fecharModal();


        mostrarAvisoRegistro(
          horario
        );


        /*
         * Atualiza histórico.
         */

        if (
          dataHistorico &&
          dataHistorico.value === dataISO
        ) {

          carregarHistorico(
            dataISO
          );

        }

      } catch (erro) {

        console.error(
          "Erro ao salvar registro:",
          erro
        );


        window.alert(
          "Não foi possível salvar o registro."
        );

      } finally {

        botaoConfirmar.disabled =
          false;

        botaoConfirmar.textContent =
          "Confirmar";

      }

    }
  );

}


/* =========================================================
   AVISO DE REGISTRO
========================================================= */

function mostrarAvisoRegistro(horario) {

  const antigo =
    document.getElementById(
      "aviso-registro"
    );


  if (antigo) {
    antigo.remove();
  }


  const aviso =
    document.createElement(
      "div"
    );


  aviso.id =
    "aviso-registro";


  aviso.innerHTML = `
    <strong>✓ Medicamento registrado!</strong>
    <span>Horário: ${horario}</span>
    <span>Dado por: ${nomeUsuario}</span>
  `;


  aviso.style.position =
    "fixed";

  aviso.style.left =
    "50%";

  aviso.style.bottom =
    "24px";

  aviso.style.transform =
    "translateX(-50%)";

  aviso.style.zIndex =
    "99999";

  aviso.style.width =
    "calc(100% - 32px)";

  aviso.style.maxWidth =
    "420px";

  aviso.style.padding =
    "18px";

  aviso.style.borderRadius =
    "18px";

  aviso.style.background =
    "#16a34a";

  aviso.style.color =
    "#ffffff";

  aviso.style.boxShadow =
    "0 12px 35px rgba(0,0,0,.25)";

  aviso.style.display =
    "flex";

  aviso.style.flexDirection =
    "column";

  aviso.style.gap =
    "5px";

  aviso.style.textAlign =
    "center";

  aviso.style.fontFamily =
    "Arial, sans-serif";


  document.body.appendChild(
    aviso
  );


  setTimeout(
    function () {

      aviso.style.opacity =
        "0";

      aviso.style.transition =
        "opacity .3s ease";


      setTimeout(
        function () {

          if (aviso) {
            aviso.remove();
          }

        },
        350
      );

    },
    3500
  );

}


/* =========================================================
   ATUALIZAR BOTÃO DE NOTIFICAÇÃO
========================================================= */

function atualizarBotaoNotificacao() {

  if (!botaoNotificacao) {
    return;
  }


  if (notificacaoAtiva) {

    botaoNotificacao.classList.add(
      "ativo"
    );


    botaoNotificacao.setAttribute(
      "aria-label",
      "Notificações ativadas"
    );

  } else {

    botaoNotificacao.classList.remove(
      "ativo"
    );


    botaoNotificacao.setAttribute(
      "aria-label",
      "Ativar notificações"
    );

  }

}


/* =========================================================
   NOTIFICAÇÕES
========================================================= */

if (botaoNotificacao) {

  botaoNotificacao.addEventListener(
    "click",
    async function () {

      if (
        !("Notification" in window)
      ) {

        window.alert(
          "Este navegador não oferece suporte a notificações."
        );

        return;

      }


      try {

        if (
          Notification.permission ===
          "default"
        ) {

          const permissao =
            await Notification.requestPermission();

          if (
            permissao !==
            "granted"
          ) {

            notificacaoAtiva =
              false;

            localStorage.setItem(
              CHAVE_NOTIFICACAO,
              "false"
            );

            atualizarBotaoNotificacao();

            return;

          }

        }


        if (
          Notification.permission ===
          "granted"
        ) {

          notificacaoAtiva =
            !notificacaoAtiva;


          localStorage.setItem(
            CHAVE_NOTIFICACAO,
            String(
              notificacaoAtiva
            )
          );


          atualizarBotaoNotificacao();


          if (notificacaoAtiva) {

            try {

              new Notification(
                "Cuidado Juntos",
                {
                  body:
                    "As notificações foram ativadas."
                }
              );

            } catch (erro) {

              console.log(
                "Notificação não exibida:",
                erro
              );

            }

          }

        }

      } catch (erro) {

        console.error(
          "Erro nas notificações:",
          erro
        );

      }

    }
  );

}


/* =========================================================
   ATUALIZAR TELA
========================================================= */

function atualizarTela() {

  const cartoes =
    document.querySelectorAll(
      ".medicamento-card"
    );


  const total =
    cartoes.length;


  const dados =
    Object.keys(
      registros
    ).length;


  const pendentes =
    Math.max(
      total - dados,
      0
    );


  if (totalMedicamentos) {

    totalMedicamentos.textContent =
      total;

         }


  if (totalDados) {

    totalDados.textContent =
      dados;

  }


  if (totalPendentes) {

    totalPendentes.textContent =
      pendentes;

  }


  cartoes.forEach(
    function (cartao) {

      const horario =
        cartao.getAttribute(
          "data-horario"
        );

      if (!horario) {
        return;
      }

      const registro =
        registros[horario];

      const statusEl =
        cartao.querySelector(
          ".status"
        );

      const botaoDar =
        cartao.querySelector(
          ".btn-dar"
        );

      let dadoPorEl =
        cartao.querySelector(
          ".dado-por"
        );

      if (registro) {

        cartao.classList.add(
          "registrado"
        );

        if (statusEl) {

          statusEl.textContent =
            "Registrado ✓";

        }

        if (botaoDar) {

          botaoDar.disabled =
            true;

          botaoDar.textContent =
            "Registrado";

        }

        if (!dadoPorEl) {

          dadoPorEl =
            document.createElement(
              "span"
            );

          dadoPorEl.className =
            "dado-por";

          const detalhes =
            cartao.querySelector(
              ".medicamento-detalhes"
            );

          if (detalhes) {

            detalhes.appendChild(
              dadoPorEl
            );

          }

        }

        dadoPorEl.textContent =
          `Dado por ${registro.nome} às ${registro.horaRegistro} em ${registro.dataRegistro}`;

      } else {

        cartao.classList.remove(
          "registrado"
        );

        if (statusEl) {

          statusEl.textContent =
            "Pendente";

        }

        if (botaoDar) {

          botaoDar.disabled =
            false;

          botaoDar.textContent =
            "Dar";

        }

        if (dadoPorEl) {

          dadoPorEl.remove();

        }

      }

    }
  );

}


/*
 * Liga os botões "Dar" assim que a
 * página carrega, já que os cartões
 * existem no HTML desde o início.
 */

configurarBotoesDar();


/* =========================================================
   CARREGAR REGISTROS DE HOJE (TEMPO REAL)
========================================================= */

function carregarRegistrosHoje() {

  if (!db) {
    return;
  }

  if (unsubscribeHoje) {

    unsubscribeHoje();

    unsubscribeHoje =
      null;

  }

  const dataISO =
    obterDataHoje();

  const consulta =
    query(
      collection(
        db,
        "registros"
      ),
      where(
        "dataISO",
        "==",
        dataISO
      )
    );

  unsubscribeHoje =
    onSnapshot(
      consulta,
      function (snapshot) {

        registros = {};

        snapshot.forEach(
          function (docSnap) {

            const dado =
              docSnap.data();

            if (dado && dado.horario) {

              registros[dado.horario] =
                dado;

            }

          }
        );

        atualizarTela();

      },
      function (erro) {

        console.error(
          "Erro ao carregar registros de hoje:",
          erro
        );

      }
    );

}


/* =========================================================
   CARREGAR HISTÓRICO
========================================================= */

function carregarHistorico(dataSelecionada) {

  if (!db || !dataSelecionada) {
    return;
  }

  if (unsubscribeHistorico) {

    unsubscribeHistorico();

    unsubscribeHistorico =
      null;

  }

  const consulta =
    query(
      collection(
        db,
        "registros"
      ),
      where(
        "dataISO",
        "==",
        dataSelecionada
      )
    );

  unsubscribeHistorico =
    onSnapshot(
      consulta,
      function (snapshot) {

        registrosHistorico = {};

        snapshot.forEach(
          function (docSnap) {

            const dado =
              docSnap.data();

            if (dado && dado.horario) {

              registrosHistorico[dado.horario] =
                dado;

            }

          }
        );

        renderizarHistorico();

      },
      function (erro) {

        console.error(
          "Erro ao carregar histórico:",
          erro
        );

      }
    );

}


function renderizarHistorico() {

  if (!listaHistorico) {
    return;
  }

  const horariosComRegistro =
    HORARIOS.filter(
      function (horario) {

        return Boolean(
          registrosHistorico[horario]
        );

      }
    );

  if (historicoTotal) {

    const quantidade =
      horariosComRegistro.length;

    historicoTotal.textContent =
      quantidade +
      (quantidade === 1
        ? " registro"
        : " registros");

  }

  if (horariosComRegistro.length === 0) {

    listaHistorico.innerHTML =
      '<p class="historico-vazio">Nenhum medicamento registrado nesta data.</p>';

    return;

  }

  listaHistorico.innerHTML =
    "";

  horariosComRegistro.forEach(
    function (horario) {

      const registro =
        registrosHistorico[horario];

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "historico-item";

      item.innerHTML =
        "<strong>" + horario + "</strong>" +
        "<span>Dado por " + registro.nome +
        " às " + registro.horaRegistro + "</span>";

      listaHistorico.appendChild(
        item
      );

    }
  );

}


/* =========================================================
   INICIALIZAÇÃO DO FIREBASE
   (acontece em paralelo, sem travar o login)
========================================================= */

const firebaseApp =
  initializeApp(firebaseConfig);

auth =
  getAuth(firebaseApp);

db =
  getFirestore(firebaseApp);

signInAnonymously(auth)
  .then(
    function () {

      firebaseAutenticado =
        true;

      const appVisivel =
        telaApp &&
        telaApp.style.display !== "none";

      if (appVisivel) {

        carregarRegistrosHoje();

        const historicoVisivel =
          paginaHistorico &&
          !paginaHistorico.classList.contains(
            "escondido"
          );

        if (historicoVisivel && dataHistorico) {

          carregarHistorico(
            dataHistorico.value
          );

        }

      }

    }
  )
  .catch(
    function (erro) {

      console.error(
        "Erro ao conectar ao Firebase:",
        erro
      );

    }
  );


/* =========================================================
   TELA INICIAL
========================================================= */

if (nomeUsuario) {

  mostrarAplicativo();

} else {

  mostrarLogin();

}
