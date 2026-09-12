import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

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


// ======================================================
// CONFIGURAÇÃO DO FIREBASE
// ======================================================

const firebaseConfig = {
  apiKey: "AIzaSyAwywIKk97Ro_NHutu4T7zeL_uCdZ2juM8",
  authDomain: "cuidado-juntos.firebaseapp.com",
  projectId: "cuidado-juntos",
  storageBucket: "cuidado-juntos.firebasestorage.app",
  messagingSenderId: "453583954077",
  appId: "1:453583954077:web:c55a6fd18f107a0c447474"
};


// ======================================================
// INICIALIZAÇÃO
// ======================================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// ======================================================
// VARIÁVEIS
// ======================================================

const CHAVE_USUARIO = "cuidadoJuntos_nomeUsuario";

let nomeUsuario = localStorage.getItem(CHAVE_USUARIO) || "";
let registros = {};
let horarioSelecionado = null;


// ======================================================
// ELEMENTOS DA TELA
// ======================================================

const telaLogin = document.getElementById("tela-login");
const telaApp = document.getElementById("tela-app");

const nomeInput = document.getElementById("nome-usuario");
const botaoEntrar = document.getElementById("btn-entrar");
const erroLogin = document.getElementById("erro-login");

const nomeExibido = document.getElementById("nome-exibido");
const botaoSair = document.getElementById("btn-sair");

const modalConfirmacao = document.getElementById("modal-confirmacao");
const textoConfirmacao = document.getElementById("texto-confirmacao");

const botaoCancelar = document.getElementById("btn-cancelar");
const botaoConfirmar = document.getElementById("btn-confirmar");

const totalMedicamentos = document.getElementById("total-medicamentos");
const totalDados = document.getElementById("total-dados");
const totalPendentes = document.getElementById("total-pendentes");


// ======================================================
// DATA DO CICLO
// ======================================================
//
// O "dia" do aplicativo começa às 06:00.
//
// 06:00 até 23:59 = ciclo do dia atual
// 00:00 até 05:59 = ainda pertence ao ciclo anterior
//
// Exemplo:
// 13/09 às 05:30 -> ciclo 12/09
// 13/09 às 06:00 -> ciclo 13/09
//
// ======================================================

function obterDataHoje() {

  const agora = new Date();

  // Antes das 06:00, ainda estamos no ciclo do dia anterior
  if (agora.getHours() < 6) {
    agora.setDate(agora.getDate() - 1);
  }

  const ano = agora.getFullYear();

  const mes = String(
    agora.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    agora.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}


// ======================================================
// FORMATAR DATA
// ======================================================

function formatarData(dataISO) {

  const partes = dataISO.split("-");

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


// ======================================================
// SALVAR NOME DO FAMILIAR
// ======================================================

function salvarNome(nome) {

  nomeUsuario = nome;

  localStorage.setItem(
    CHAVE_USUARIO,
    nome
  );
}


// ======================================================
// MOSTRAR APLICATIVO
// ======================================================

function mostrarAplicativo() {

  telaLogin.classList.add("escondido");

  telaApp.classList.remove("escondido");

  nomeExibido.textContent = nomeUsuario;

  atualizarTela();
}


// ======================================================
// MOSTRAR LOGIN
// ======================================================

function mostrarLogin() {

  telaLogin.classList.remove("escondido");

  telaApp.classList.add("escondido");
}


// ======================================================
// LOGIN
// ======================================================

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

    carregarRegistrosHoje();
  }
);


// ======================================================
// ENTER NO CAMPO DO NOME
// ======================================================

nomeInput.addEventListener(
  "keydown",
  function (evento) {

    if (evento.key === "Enter") {

      botaoEntrar.click();
    }
  }
);


// ======================================================
// SAIR
// ======================================================

botaoSair.addEventListener(
  "click",
  function () {

    const confirmarSaida = confirm(
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


// ======================================================
// CARREGAR REGISTROS DO CICLO ATUAL
// ======================================================

function carregarRegistrosHoje() {

  const dataHoje = obterDataHoje();

  console.log(
    "Ciclo atual do aplicativo:",
    dataHoje
  );

  const registrosRef =
    collection(db, "registros");

  const consulta = query(
    registrosRef,
    where("dataISO", "==", dataHoje)
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


// ======================================================
// ABRIR MODAL
// ======================================================

function abrirModal(horario) {

  horarioSelecionado = horario;

  textoConfirmacao.textContent =
    "Você está registrando o medicamento das " +
    horario +
    ". Confirma que ele foi dado?";

  modalConfirmacao.classList.remove(
    "escondido"
  );
}


// ======================================================
// FECHAR MODAL
// ======================================================

function fecharModal() {

  horarioSelecionado = null;

  modalConfirmacao.classList.add(
    "escondido"
  );
}


// ======================================================
// BOTÃO CANCELAR
// ======================================================

botaoCancelar.addEventListener(
  "click",
  fecharModal
);


// ======================================================
// CONFIRMAR MEDICAMENTO
// ======================================================

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

    // IMPORTANTE:
    // Usa o ciclo que começa às 06:00
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


    // O ID contém a data do ciclo
    // e o horário do medicamento.
    //
    // Portanto, o mesmo medicamento
    // poderá ser registrado novamente
    // no próximo ciclo às 06:00.

    const idRegistro =
      `${dataISO}_${horario.replace(":", "-")}`;


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

      botaoConfirmar.disabled = true;

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


      alert(
        "Medicamento registrado!\n\n" +

        "Horário: " +
        horario +

        "\nDado por: " +
        nomeUsuario +

        "\nRegistrado às: " +
        horaRegistro
      );


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


// ======================================================
// ATUALIZAR TELA
// ======================================================

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


// ======================================================
// BOTÕES "DAR"
// ======================================================

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


// ======================================================
// FIREBASE AUTHENTICATION
// ======================================================

onAuthStateChanged(
  auth,
  function (usuario) {

    if (usuario) {

      console.log(
        "Firebase conectado.",
        usuario.uid
      );

      if (nomeUsuario !== "") {

        mostrarAplicativo();

        carregarRegistrosHoje();
      }
    }
  }
);


// ======================================================
// LOGIN ANÔNIMO NO FIREBASE
// ======================================================

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


// ======================================================
// INICIALIZAÇÃO DA TELA
// ======================================================

if (nomeUsuario !== "") {

  mostrarAplicativo();

} else {

  mostrarLogin();
}
