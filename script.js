import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================
   FIREBASE
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyAwywIKk97Ro_NHutu4T7zeL_uCdZ2juM8",
  authDomain: "cuidado-juntos.firebaseapp.com",
  projectId: "cuidado-juntos",
  storageBucket: "cuidado-juntos.firebasestorage.app",
  messagingSenderId: "453583954077",
  appId: "1:453583954077:web:c55a6fd18f107a0c447474"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);


/* =========================
   CONFIGURAÇÕES
========================= */

const CHAVE_USUARIO =
  "cuidadoJuntos_nomeUsuario";

const CHAVE_NOTIFICACAO =
  "cuidadoJuntos_notificacoes";

let nomeUsuario =
  localStorage.getItem(CHAVE_USUARIO) || "";

let registros = {};

let horarioSelecionado = null;

let notificacaoAtiva =
  localStorage.getItem(CHAVE_NOTIFICACAO) === "true";

let ultimoAviso =
  localStorage.getItem("cuidadoJuntos_ultimoAviso") || "";


/* =========================
   ELEMENTOS
========================= */

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


/* =========================
   DATA DO CICLO
========================= */

function obterDataHoje() {

  const agora = new Date();

  /*
   * Antes das 06:00 pertence ao ciclo do dia anterior.
   */

  if (agora.getHours() < 6) {
    agora.setDate(agora.getDate() - 1);
  }

  const ano =
    agora.getFullYear();

  const mes =
    String(agora.getMonth() + 1)
      .padStart(2, "0");

  const dia =
    String(agora.getDate())
      .padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}


/* =========================
   NOME DO USUÁRIO
========================= */

function salvarNome(nome) {

  nomeUsuario = nome;

  localStorage.setItem(
    CHAVE_USUARIO,
    nome
  );
}


/* =========================
   MOSTRAR APP
========================= */

function mostrarAplicativo() {

  telaLogin.classList.add("escondido");

  telaApp.classList.remove("escondido");

  nomeExibido.textContent =
    nomeUsuario;

  atualizarTela();

  atualizarBotaoNotificacao();

  carregarRegistrosHoje();
}


/* =========================
   MOSTRAR LOGIN
========================= */

function mostrarLogin() {

  telaLogin.classList.remove("escondido");

  telaApp.classList.add("escondido");
}


/* =========================
   ENTRAR
========================= */

botaoEntrar.addEventListener(
  "click",
  function () {

    const nomeDigitado =
      nomeInput.value.trim();

    if (nomeDigitado === "") {

      erroLogin.textContent =
        "Digite seu primeiro nome para entrar.";

      nomeInput.focus();

      return;
    }

    erroLogin.textContent = "";

    salvarNome(nomeDigitado);

    mostrarAplicativo();
  }
);


/* =========================
   ENTER NO CAMPO
========================= */

nomeInput.addEventListener(
  "keydown",
  function (evento) {

    if (evento.key === "Enter") {
      botaoEntrar.click();
    }

  }
);


/* =========================
   SAIR
========================= */

botaoSair.addEventListener(
  "click",
  function () {

    const confirmarSaida =
      confirm(
        "Deseja sair e trocar o familiar deste aparelho?"
      );

    if (confirmarSaida) {

      localStorage.removeItem(
        CHAVE_USUARIO
      );

      nomeUsuario = "";

      nomeInput.value = "";

      mostrarLogin();
    }

  }
);


/* =========================
   FIREBASE - CARREGAR
========================= */

function carregarRegistrosHoje() {

  const dataHoje =
    obterDataHoje();

  console.log(
    "Ciclo atual:",
    dataHoje
  );

  const registrosRef =
    collection(
      db,
      "registros"
    );

  const consulta =
    query(
      registrosRef,
      where(
        "dataISO",
        "==",
        dataHoje
      )
    );

  onSnapshot(
    consulta,
    function (snapshot) {

      registros = {};

      snapshot.forEach(
        function (documento) {

          const dados =
            documento.data();

          registros[dados.horario] =
            dados;
        }
      );

      atualizarTela();

      atualizarHistorico();

    },
    function (erro) {

      console.error(
        "Erro ao carregar Firestore:",
        erro
      );

      alert(
        "Não foi possível carregar os registros do Firebase."
      );
    }
  );
}


/* =========================
   MODAL
========================= */

function abrirModal(horario) {

  horarioSelecionado =
    horario;

  textoConfirmacao.textContent =
    "Você está registrando o medicamento das " +
    horario +
    ". Confirma que ele foi dado?";

  modalConfirmacao.classList.remove(
    "escondido"
  );
}


function fecharModal() {

  horarioSelecionado = null;

  modalConfirmacao.classList.add(
    "escondido"
  );
}


botaoCancelar.addEventListener(
  "click",
  fecharModal
);


/* =========================
   CONFIRMAR MEDICAMENTO
========================= */

botaoConfirmar.addEventListener(
  "click",
  async function () {

    if (!horarioSelecionado) {
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

      nome: nomeUsuario,

      horaRegistro: horaRegistro,

      dataRegistro: dataRegistro,

      dataISO: dataISO,

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


      fecharModal();


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


/* =========================
   ATUALIZAR TELA
========================= */

function atualizarTela() {

  const cartoes =
    document.querySelectorAll(
      ".medicamento"
    );

  const total =
    cartoes.length;

  const dados =
    Object.keys(registros).length;

  const pendentes =
    Math.max(
      total - dados,
      0
    );


  totalMedicamentos.textContent =
    total;

  totalDados.textContent =
    dados;

  totalPendentes.textContent =
    pendentes;


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

        botaoDar.textContent =
          "Registrado ✓";

        botaoDar.disabled =
          true;

        botaoDar.classList.add(
          "registrado"
        );

        status.textContent =
          "Dado por " +
          registro.nome +
          " às " +
          registro.horaRegistro +
          " em " +
          registro.dataRegistro;

        cartao.classList.add(
          "medicamento-dado"
        );

      } else {

        botaoDar.textContent =
          "Dar";

        botaoDar.disabled =
          false;

        botaoDar.classList.remove(
          "registrado"
        );

        status.textContent =
          "Aguardando registro";

        cartao.classList.remove(
          "medicamento-dado"
        );
      }

    }
  );
}


/* =========================
   ATUALIZAR HISTÓRICO
========================= */

function atualizarHistorico() {

  if (!listaHistorico) {
    return;
  }

  const lista =
    Object.values(registros)
      .sort(
        function (a, b) {
          return a.horario.localeCompare(
            b.horario
          );
        }
      );

  if (lista.length === 0) {

    listaHistorico.innerHTML = `
      <div class="historico-vazio">
        <span>🕘</span>
        <p>Nenhum medicamento registrado ainda.</p>
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
              <strong>${registro.horario}</strong>
              <span>Horário</span>
            </div>

            <div class="historico-detalhes">
              <strong>Medicamento administrado</strong>

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


/* =========================
   BOTÕES DAR
========================= */

const botoesDar =
  document.querySelectorAll(
    ".btn-dar"
  );


botoesDar.forEach(
  function (botao) {

    botao.addEventListener(
      "click",
      function () {

        if (botao.disabled) {
          return;
        }

        const cartao =
          botao.closest(
            ".medicamento"
          );

        const horario =
          cartao.getAttribute(
            "data-horario"
          );

        abrirModal(horario);

      }
    );

  }
);


/* ==================================================
   SISTEMA DE NOTIFICAÇÕES
================================================== */


/* =========================
   ATUALIZAR BOTÃO
========================= */

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


/* =========================
   ATIVAR NOTIFICAÇÕES
========================= */

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


    if (permissao === "granted") {

      notificacaoAtiva =
        true;

      localStorage.setItem(
        CHAVE_NOTIFICACAO,
        "true"
      );

      atualizarBotaoNotificacao();


      new Notification(
        "Cuidado Juntos ❤️",
        {
          body:
            "Notificações ativadas! Você receberá os lembretes dos medicamentos.",
          icon:
            "img/notificacao.png"
        }
      );


      console.log(
        "Notificações ativadas."
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
        "A permissão para notificações não foi concedida."
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


/* =========================
   BOTÃO NOTIFICAÇÃO
========================= */

if (botaoNotificacao) {

  botaoNotificacao.addEventListener(
    "click",
    function () {

      if (
        Notification.permission ===
        "granted"
      ) {

        notificacaoAtiva =
          !notificacaoAtiva;

        localStorage.setItem(
          CHAVE_NOTIFICACAO,
          String(notificacaoAtiva)
        );

        atualizarBotaoNotificacao();


        if (notificacaoAtiva) {

          new Notification(
            "Cuidado Juntos ❤️",
            {
              body:
                "Lembretes de medicamentos ativados.",
              icon:
                "img/notificacao.png"
            }
          );

        }

        return;
      }


      ativarNotificacoes();

    }
  );

}


/* =========================
   ENVIAR LEMBRETE
========================= */

function enviarNotificacao(horario) {

  if (!notificacaoAtiva) {
    return;
  }

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


  const dataHoje =
    obterDataHoje();

  const chaveAviso =
    `${dataHoje}_${horario}`;


  if (
    ultimoAviso === chaveAviso
  ) {
    return;
  }


  if (registros[horario]) {
    return;
  }


  ultimoAviso =
    chaveAviso;


  localStorage.setItem(
    "cuidadoJuntos_ultimoAviso",
    chaveAviso
  );


  new Notification(
    "💊 Hora do medicamento",
    {
      body:
        "Está na hora do medicamento das " +
        horario +
        ".",
      icon:
        "img/notificacao.png",
      tag:
        "medicamento-" +
        horario
    }
  );

}


/* =========================
   VERIFICAR HORÁRIOS
========================= */

function verificarHorarios() {

  if (!notificacaoAtiva) {
    return;
  }

  const agora =
    new Date();

  const hora =
    String(
      agora.getHours()
    ).padStart(2, "0");

  const minuto =
    String(
      agora.getMinutes()
    ).padStart(2, "0");


  const horarioAtual =
    `${hora}:${minuto}`;


  const cartao =
    document.querySelector(
      `.medicamento[data-horario="${horarioAtual}"]`
    );


  if (!cartao) {
    return;
  }


  enviarNotificacao(
    horarioAtual
  );
}


/* =========================
   VERIFICAR A CADA 10 SEGUNDOS
========================= */

setInterval(
  verificarHorarios,
  10000
);


/* =========================
   FIREBASE AUTH
========================= */

onAuthStateChanged(
  auth,
  function (usuario) {

    if (usuario) {

      console.log(
        "Firebase conectado.",
        usuario.uid
      );

    }

  }
);


/* =========================
   LOGIN ANÔNIMO
========================= */

signInAnonymously(auth)

  .then(
    function () {

      console.log(
        "Autenticação anônima realizada."
      );

    }
  )

  .catch(
    function (erro) {

      console.error(
        "Erro na autenticação:",
        erro
      );

      alert(
        "Não foi possível conectar ao Firebase. " +
        "Verifique se o login anônimo está ativado."
      );

    }
  );


/* =========================
   INICIALIZAÇÃO
========================= */

atualizarBotaoNotificacao();


if (nomeUsuario !== "") {

  mostrarAplicativo();

} else {

  mostrarLogin();

    }
