/* =========================================================
   CUIDADO JUNTOS
   SCRIPT PRINCIPAL
========================================================= */


/* =========================================================
   CONFIGURAÇÕES FIREBASE
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
   VARIÁVEIS FIREBASE
========================================================= */

let db = null;
let auth = null;

let firebaseAutenticado = false;

let firebaseFunctions = null;

let unsubscribeHoje = null;
let unsubscribeHistorico = null;


/* =========================================================
   CONFIGURAÇÕES DO APLICATIVO
========================================================= */

const CHAVE_USUARIO =
  "cuidadoJuntos_nomeUsuario";

const CHAVE_NOTIFICACAO =
  "cuidadoJuntos_notificacoes";

const CHAVE_ULTIMO_AVISO =
  "cuidadoJuntos_ultimoAviso";


/* =========================================================
   ESTADO DO APLICATIVO
========================================================= */

let nomeUsuario =
  localStorage.getItem(CHAVE_USUARIO) || "";

let registros = {};

let registrosHistorico = {};

let horarioSelecionado = null;

let notificacaoAtiva =
  localStorage.getItem(CHAVE_NOTIFICACAO) === "true";

let ultimoAviso =
  localStorage.getItem(CHAVE_ULTIMO_AVISO) || "";


/* =========================================================
   HORÁRIOS
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
   DATA ATUAL
========================================================= */

function obterDataHoje() {

  const agora = new Date();

  /*
   * Antes das 06:00 pertence ao ciclo
   * do dia anterior.
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
   FORMATAR DATA
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

  nomeUsuario = nome;

  localStorage.setItem(
    CHAVE_USUARIO,
    nome
  );

}


/* =========================================================
   MOSTRAR APLICATIVO
========================================================= */

function mostrarAplicativo() {

  if (!telaLogin || !telaApp) {
    return;
  }

  telaLogin.classList.add(
    "escondido"
  );

  telaApp.classList.remove(
    "escondido"
  );

  telaApp.style.display = "";

  if (nomeExibido) {

    nomeExibido.textContent =
      nomeUsuario;

  }

  atualizarTela();

  atualizarBotaoNotificacao();

  definirDataHistorico();

  mostrarPaginaMedicamentos();

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

  telaApp.style.display = "none";

}


/* =========================================================
   LOGIN
========================================================= */

if (botaoEntrar) {

  botaoEntrar.addEventListener(
    "click",
    function () {

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

      if (erroLogin) {

        erroLogin.textContent =
          "";

      }

      salvarNome(
        nomeDigitado
      );

      mostrarAplicativo();

      if (firebaseAutenticado) {

        carregarRegistrosHoje();

      }

    }
  );

}


/* =========================================================
   ENTER NO CAMPO DE NOME
========================================================= */

if (nomeInput) {

  nomeInput.addEventListener(
    "keydown",
    function (evento) {

      if (
        evento.key === "Enter"
      ) {

        evento.preventDefault();

        if (botaoEntrar) {

          botaoEntrar.click();

        }

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
        confirm(
          "Deseja sair e trocar o familiar deste aparelho?"
        );

      if (!confirmarSaida) {
        return;
      }

      localStorage.removeItem(
        CHAVE_USUARIO
      );

      nomeUsuario = "";

      if (nomeInput) {
        nomeInput.value = "";
      }

      if (unsubscribeHoje) {

        unsubscribeHoje();

        unsubscribeHoje = null;

      }

      if (unsubscribeHistorico) {

        unsubscribeHistorico();

        unsubscribeHistorico = null;

      }

      registros = {};

      registrosHistorico = {};

      mostrarLogin();

    }
  );

}


/* =========================================================
   MODAL DE CONFIRMAÇÃO
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

    modalConfirmacao.style.display = "flex";

  }

}


function fecharModal() {

  horarioSelecionado =
    null;

  if (modalConfirmacao) {

    modalConfirmacao.classList.add(
      "escondido"
    );

    modalConfirmacao.style.display = "none";

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

  const botoesDar =
    document.querySelectorAll(
      ".btn-dar"
    );

  botoesDar.forEach(
    function (botao) {

      /*
       * Evita adicionar o evento mais de uma vez.
       */

      if (
        botao.dataset.eventoConfigurado === "true"
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

          /*
           * A classe correta dos cartões
           * da interface atual é:
           *
           * .medicamento-card
           */

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
              "Horário do medicamento não encontrado."
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


/*
 * Configura os botões imediatamente.
 */

configurarBotoesDar();


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

      if (!firebaseAutenticado) {

        alert(
          "Aguarde a conexão com o Firebase."
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

        horario: horario,

        nome:
          nomeUsuario || "Familiar",

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

        await firebaseFunctions.setDoc(

          firebaseFunctions.doc(
            db,
            "registros",
            idRegistro
          ),

          registro

        );

        /*
         * Atualiza imediatamente a tela,
         * sem precisar esperar o Firebase.
         */

        registros[horario] =
          registro;

        atualizarTela();

        fecharModal();

        /*
         * Pequena confirmação visual.
         */

        mostrarAvisoRegistro(
          horario
        );

        /*
         * Atualiza o histórico se ele estiver aberto.
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

        alert(
          "Não foi possível salvar o registro no Firebase."
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

function mostrarAvisoRegistro(
  horario
) {

  const avisoExistente =
    document.getElementById(
      "aviso-registro"
    );

  if (avisoExistente) {

    avisoExistente.remove();

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

  /*
   * Estilo diretamente no aviso para
   * funcionar mesmo sem alterar o CSS.
   */

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

  aviso.style.animation =
    "aparecerAviso .3s ease";

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

          aviso.remove();

        },
        350
      );

    },
    3500
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

      const botaoDar =
        cartao.querySelector(
          ".btn-dar"
        );

      const status =
        cartao.querySelector(
          ".status"
        );

      const registro =
        registros[horario];

      if (registro) {

        if (botaoDar) {

          botaoDar.textContent =
            "Registrado ✓";

          botaoDar.disabled =
            true;

          botaoDar.classList.add(
            "registrado"
          );

        }

        if (status) {

          status.textContent =
            "Dado por " +
            registro.nome +
            " às " +
            registro.horaRegistro +
            " em " +
            registro.dataRegistro;

        }

        cartao.classList.add(
          "medicamento-dado"
        );

      } else {

        if (botaoDar) {

          botaoDar.textContent =
            "Dar";

          botaoDar.disabled =
            false;

          botaoDar.classList.remove(
            "registrado"
          );

        }

        if (status) {

          status.textContent =
            "Aguardando registro";

        }

        cartao.classList.remove(
          "medicamento-dado"
        );

      }

    }
  );

  /*
   * Garante que os botões continuem funcionando
   * mesmo depois de qualquer atualização da tela.
   */

  configurarBotoesDar();

}


/* =========================================================
   ATUALIZAR HISTÓRICO
========================================================= */

function atualizarHistorico() {

  if (!listaHistorico) {
    return;
  }

  const lista =
    Object.values(
      registrosHistorico
    ).sort(
      function (a, b) {

        return a.horario.localeCompare(
          b.horario
        );

      }
    );

  if (historicoTotal) {

    historicoTotal.textContent =
      lista.length;

  }

  if (lista.length === 0) {

    listaHistorico.innerHTML = `
      <div class="historico-vazio">

        <span>
          🕘
        </span>

        <p>
          Nenhum medicamento registrado nesta data.
        </p>

      </div>
    `;

    return;

  }

  listaHistorico.innerHTML =
    lista.map(
      function (registro) {

        return `
          <div class="item-historico">

            <div class="historico-horario">

              <strong>
                ${registro.horario}
              </strong>

              <span>
                Horário
              </span>

            </div>

            <div class="historico-detalhes">

              <strong>
                Medicamento administrado
              </strong>

              <p>
                Dado por
                <b>${registro.nome}</b>
                às
                <b>${registro.horaRegistro}</b>
              </p>

              <small>
                ${registro.dataRegistro}
              </small>

            </div>

            <div class="historico-check">
              ✓
            </div>

          </div>
        `;

      }
    )
    .join("");

}


/* =========================================================
   NOTIFICAÇÕES
========================================================= */

function atualizarBotaoNotificacao() {

  if (!botaoNotificacao) {
    return;
  }

  if (notificacaoAtiva) {

    botaoNotificacao.classList.add(
      "ativa"
    );

    botaoNotificacao.title =
      "Notificações ativadas";

  } else {

    botaoNotificacao.classList.remove(
      "ativa"
    );

    botaoNotificacao.title =
      "Ativar notificações";

  }

}


/* =========================================================
   ATIVAR NOTIFICAÇÕES
========================================================= */

async function ativarNotificacoes() {

  if (
    !("Notification" in window)
  ) {

    alert(
      "Este navegador não oferece suporte a notificações."
    );

    return;

  }

  try {

    const permissao =
      await Notification.requestPermission();

    if (
      permissao === "granted"
    ) {

      notificacaoAtiva =
        true;

      localStorage.setItem(
        CHAVE_NOTIFICACAO,
        "true"
      );

      atualizarBotaoNotificacao();

      enviarNotificacao(
        "💊 Cuidado Juntos",
        "As notificações foram ativadas."
      );

    } else {

      notificacaoAtiva =
        false;

      localStorage.setItem(
        CHAVE_NOTIFICACAO,
        "false"
      );

      atualizarBotaoNotificacao();

      alert(
        "As notificações não foram autorizadas."
      );

    }

  } catch (erro) {

    console.error(
      "Erro nas notificações:",
      erro
    );

    alert(
      "Não foi possível ativar as notificações."
    );

  }

}


/* =========================================================
   ENVIAR NOTIFICAÇÃO
========================================================= */

function enviarNotificacao(
  titulo,
  mensagem
) {

  if (
    !("Notification" in window)
  ) {
    return;
  }

  if (
    Notification.permission !==
    "granted"
  ) {
    return;
  }

  try {

    new Notification(
      titulo,
      {
        body: mensagem,
        icon: "img/notificacao.png"
      }
    );

  } catch (erro) {

    console.error(
      "Erro ao enviar notificação:",
      erro
    );

  }

}


/* =========================================================
   BOTÃO DE NOTIFICAÇÃO
========================================================= */

if (botaoNotificacao) {

  botaoNotificacao.addEventListener(
    "click",
    function () {

      ativarNotificacoes();

    }
  );

}


/* =========================================================
   VERIFICAR HORÁRIO DOS MEDICAMENTOS
========================================================= */

function verificarHorarioMedicamento() {

  const agora =
    new Date();

  const horaAtual =
    String(
      agora.getHours()
    ).padStart(2, "0") +
    ":" +
    String(
      agora.getMinutes()
    ).padStart(2, "0");

  /*
   * Verifica somente os horários cadastrados.
   */

  HORARIOS.forEach(
    function (horario) {

      if (
        horario === horaAtual &&
        ultimoAviso !==
          `${obterDataHoje()}_${horario}`
      ) {

        /*
         * Não avisa se já foi registrado.
         */

        if (!registros[horario]) {

          enviarNotificacao(
            "💊 Hora do medicamento",
            `Está na hora do medicamento das ${horario}.`
          );

        }

        ultimoAviso =
          `${obterDataHoje()}_${horario}`;

        localStorage.setItem(
          CHAVE_ULTIMO_AVISO,
          ultimoAviso
        );

      }

    }
  );

}


/*
 * Verifica a cada 30 segundos.
 */

setInterval(
  verificarHorarioMedicamento,
  30000
);


/* =========================================================
   FIREBASE
========================================================= */

async function inicializarFirebase() {

  try {

    const appModule =
      await import(
        "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js"
      );

    const authModule =
      await import(
        "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js"
      );

    const firestoreModule =
      await import(
        "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js"
      );

    const app =
      appModule.initializeApp(
        firebaseConfig
      );

    auth =
      authModule.getAuth(
        app
      );

    db =
      firestoreModule.getFirestore(
        app
      );

    firebaseFunctions = {

      setDoc:
        firestoreModule.setDoc,

      doc:
        firestoreModule.doc,

      collection:
        firestoreModule.collection,

      query:
        firestoreModule.query,

      where:
        firestoreModule.where,

      onSnapshot:
        firestoreModule.onSnapshot,

      orderBy:
        firestoreModule.orderBy

    };

    /*
     * Login anônimo no Firebase.
     */

    await authModule.signInAnonymously(
      auth
    );

    firebaseAutenticado =
      true;

    console.log(
      "Firebase conectado com sucesso."
    );

    /*
     * Carrega os registros do dia.
     */

    if (nomeUsuario) {

      carregarRegistrosHoje();

    }

  } catch (erro) {

    console.error(
      "Erro ao inicializar Firebase:",
      erro
    );

    firebaseAutenticado =
      false;

  }

}


/* =========================================================
   CARREGAR REGISTROS DE HOJE
========================================================= */

function carregarRegistrosHoje() {

  if (
    !firebaseAutenticado ||
    !db ||
    !firebaseFunctions
  ) {

    return;

  }

  if (unsubscribeHoje) {

    unsubscribeHoje();

    unsubscribeHoje = null;

  }

  const dataISO =
    obterDataHoje();

  const colecao =
    firebaseFunctions.collection(
      db,
      "registros"
    );

  const consulta =
    firebaseFunctions.query(
      colecao,
      firebaseFunctions.where(
        "dataISO",
        "==",
        dataISO
      )
    );

  unsubscribeHoje =
    firebaseFunctions.onSnapshot(
      consulta,
      function (snapshot) {

        registros = {};

        snapshot.forEach(
          function (documento) {

            const registro =
              documento.data();

            if (registro.horario) {

              registros[
                registro.horario
              ] = registro;

            }

          }
        );

        atualizarTela();

      },
      function (erro) {

        console.error(
          "Erro ao carregar registros:",
          erro
        );

      }
    );

}


/* =========================================================
   CARREGAR HISTÓRICO
========================================================= */

function carregarHistorico(
  dataISO
) {

  if (
    !firebaseAutenticado ||
    !db ||
    !firebaseFunctions ||
    !dataISO
  ) {

    return;

  }

  if (unsubscribeHistorico) {

    unsubscribeHistorico();

    unsubscribeHistorico = null;

  }

  const colecao =
    firebaseFunctions.collection(
      db,
      "registros"
    );

  const consulta =
    firebaseFunctions.query(
      colecao,
      firebaseFunctions.where(
        "dataISO",
        "==",
        dataISO
      )
    );

  unsubscribeHistorico =
    firebaseFunctions.onSnapshot(
      consulta,
      function (snapshot) {

        registrosHistorico = {};

        snapshot.forEach(
          function (documento) {

            const registro =
              documento.data();

            if (registro.horario) {

              registrosHistorico[
                registro.horario
              ] = registro;

            }

          }
        );

        atualizarHistorico();

      },
      function (erro) {

        console.error(
          "Erro ao carregar histórico:",
          erro
        );

        if (listaHistorico) {

          listaHistorico.innerHTML = `
            <div class="historico-vazio">
              <span>⚠️</span>
              <p>
                Não foi possível carregar o histórico.
              </p>
            </div>
          `;

        }

      }
    );

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    /*
     * Configura novamente os botões
     * depois que todo o HTML estiver carregado.
     */

    configurarBotoesDar();

    definirDataHistorico();

    atualizarTela();

    atualizarBotaoNotificacao();

    /*
     * Se já existe um nome salvo,
     * entra automaticamente no aplicativo.
     */

    if (nomeUsuario) {

      mostrarAplicativo();

    } else {

      mostrarLogin();

    }

    /*
     * Firebase é inicializado
     * sem bloquear a interface.
     */

    inicializarFirebase();

  }
);
