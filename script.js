// ==========================================
// CUIDADO JUNTOS
// Código compatível com o seu index.html
// ==========================================

const CHAVE_USUARIO = "cuidadoJuntos_nomeUsuario";
const CHAVE_REGISTROS = "cuidadoJuntos_registros";

let nomeUsuario = localStorage.getItem(CHAVE_USUARIO) || "";
let registros = carregarRegistros();
let horarioSelecionado = null;

// ==========================================
// CARREGAR E SALVAR DADOS
// ==========================================

function carregarRegistros() {
  try {
    const dados = localStorage.getItem(CHAVE_REGISTROS);
    return dados ? JSON.parse(dados) : {};
  } catch (erro) {
    console.error("Erro ao carregar registros:", erro);
    return {};
  }
}

function salvarRegistros() {
  localStorage.setItem(
    CHAVE_REGISTROS,
    JSON.stringify(registros)
  );
}

function salvarNome(nome) {
  nomeUsuario = nome;
  localStorage.setItem(CHAVE_USUARIO, nome);
}

// ==========================================
// ELEMENTOS DO HTML
// ==========================================

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

// ==========================================
// MOSTRAR TELAS
// ==========================================

function mostrarAplicativo() {
  telaLogin.classList.add("escondido");
  telaApp.classList.remove("escondido");

  nomeExibido.textContent = nomeUsuario;

  atualizarTela();
}

function mostrarLogin() {
  telaLogin.classList.remove("escondido");
  telaApp.classList.add("escondido");
}

// ==========================================
// ENTRAR NO APP
// ==========================================

botaoEntrar.addEventListener("click", function () {
  const nomeDigitado = nomeInput.value.trim();

  if (nomeDigitado === "") {
    erroLogin.textContent = "Digite seu primeiro nome para entrar.";
    nomeInput.focus();
    return;
  }

  erroLogin.textContent = "";

  salvarNome(nomeDigitado);
  mostrarAplicativo();
});

// Permite entrar apertando Enter no teclado
nomeInput.addEventListener("keydown", function (evento) {
  if (evento.key === "Enter") {
    botaoEntrar.click();
  }
});

// ==========================================
// SAIR
// ==========================================

botaoSair.addEventListener("click", function () {
  const confirmarSaida = confirm(
    "Deseja sair e trocar o familiar deste aparelho?"
  );

  if (confirmarSaida) {
    localStorage.removeItem(CHAVE_USUARIO);
    nomeUsuario = "";
    nomeInput.value = "";
    mostrarLogin();
  }
});

// ==========================================
// ABRIR E FECHAR MODAL
// ==========================================

function abrirModal(horario) {
  horarioSelecionado = horario;

  textoConfirmacao.textContent =
    "Você está registrando o medicamento das " +
    horario +
    ". Confirma que ele foi dado?";

  modalConfirmacao.classList.remove("escondido");
}

function fecharModal() {
  horarioSelecionado = null;
  modalConfirmacao.classList.add("escondido");
}

botaoCancelar.addEventListener("click", fecharModal);

// ==========================================
// CONFIRMAR MEDICAMENTO
// ==========================================

botaoConfirmar.addEventListener("click", function () {
  if (!horarioSelecionado) {
    return;
  }

  const agora = new Date();

  registros[horarioSelecionado] = {
    horario: horarioSelecionado,
    nome: nomeUsuario,
    horaRegistro: agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }),
    dataRegistro: agora.toLocaleDateString("pt-BR"),
    dataCompleta: agora.toISOString()
  };

  salvarRegistros();
  fecharModal();
  atualizarTela();

  alert(
    "Medicamento registrado!\n\n" +
    "Horário: " +
    horarioSelecionado +
    "\n" +
    "Dado por: " +
    nomeUsuario +
    "\n" +
    "Registrado às: " +
    registros[horarioSelecionado].horaRegistro
  );
});

// ==========================================
// ATUALIZAR MEDICAMENTOS
// ==========================================

function atualizarTela() {
  const cartoes = document.querySelectorAll(".medicamento");

  const total = cartoes.length;
  const dados = Object.keys(registros).length;
  const pendentes = Math.max(total - dados, 0);

  totalMedicamentos.textContent = total;
  totalDados.textContent = dados;
  totalPendentes.textContent = pendentes;

  cartoes.forEach(function (cartao) {
    const horario = cartao.getAttribute("data-horario");
    const botaoDar = cartao.querySelector(".btn-dar");
    const status = cartao.querySelector(".status");
    const registro = registros[horario];

    if (registro) {
      botaoDar.textContent = "Registrado ✓";
      botaoDar.disabled = true;
      botaoDar.classList.add("registrado");

      status.textContent =
        "Dado por " +
        registro.nome +
        " às " +
        registro.horaRegistro +
        " em " +
        registro.dataRegistro;

      cartao.classList.add("medicamento-dado");
    } else {
      botaoDar.textContent = "Dar";
      botaoDar.disabled = false;
      botaoDar.classList.remove("registrado");

      status.textContent = "Aguardando registro";
      cartao.classList.remove("medicamento-dado");
    }
  });
}

// ==========================================
// BOTÕES DAR
// ==========================================

const botoesDar = document.querySelectorAll(".btn-dar");

botoesDar.forEach(function (botao) {
  botao.addEventListener("click", function () {
    if (botao.disabled) {
      return;
    }

    const cartao = botao.closest(".medicamento");
    const horario = cartao.getAttribute("data-horario");

    abrirModal(horario);
  });
});

// ==========================================
// INICIAR O APP
// ==========================================

if (nomeUsuario !== "") {
  mostrarAplicativo();
} else {
  mostrarLogin();
                                           }
