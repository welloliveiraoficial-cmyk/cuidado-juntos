// ==========================================
// CUIDADO JUNTOS
// Salvamento dos registros no celular
// ==========================================

const STORAGE_KEY = "cuidadoJuntosRegistros";
const USER_KEY = "cuidadoJuntosUsuario";

// Elementos da tela
const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");

const loginForm = document.getElementById("loginForm");
const nameInput = document.getElementById("nameInput");

const userNameDisplay = document.getElementById("userName");
const logoutButton = document.getElementById("logoutButton");

const confirmationModal = document.getElementById("confirmationModal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");

const confirmButton = document.getElementById("confirmButton");
const cancelButton = document.getElementById("cancelButton");

// Contadores
const totalCount = document.getElementById("totalCount");
const givenCount = document.getElementById("givenCount");
const pendingCount = document.getElementById("pendingCount");

// Variáveis
let medicamentoSelecionado = null;

// ==========================================
// FUNÇÕES DE SALVAMENTO
// ==========================================

function carregarRegistros() {
  const registrosSalvos = localStorage.getItem(STORAGE_KEY);

  if (!registrosSalvos) {
    return {};
  }

  try {
    return JSON.parse(registrosSalvos);
  } catch (erro) {
    console.error("Erro ao carregar registros:", erro);
    return {};
  }
}

function salvarRegistros(registros) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
}

function obterUsuario() {
  return localStorage.getItem(USER_KEY);
}

function salvarUsuario(nome) {
  localStorage.setItem(USER_KEY, nome);
}

// ==========================================
// LOGIN
// ==========================================

function mostrarAplicativo(nome) {
  if (loginScreen) {
    loginScreen.style.display = "none";
  }

  if (appScreen) {
    appScreen.style.display = "block";
  }

  if (userNameDisplay) {
    userNameDisplay.textContent = nome;
  }

  atualizarTela();
}

function mostrarLogin() {
  if (loginScreen) {
    loginScreen.style.display = "block";
  }

  if (appScreen) {
    appScreen.style.display = "none";
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const nome = nameInput.value.trim();

    if (nome === "") {
      alert("Digite seu primeiro nome.");
      return;
    }

    salvarUsuario(nome);
    mostrarAplicativo(nome);
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", function () {
    localStorage.removeItem(USER_KEY);
    mostrarLogin();
  });
}

// ==========================================
// MODAL DE CONFIRMAÇÃO
// ==========================================

function abrirModal(medicamento) {
  medicamentoSelecionado = medicamento;

  if (modalTitle) {
    modalTitle.textContent = "Confirmar medicamento";
  }

  if (modalText) {
    modalText.textContent =
      "Você confirma que deu " + medicamento + "?";
  }

  if (confirmationModal) {
    confirmationModal.style.display = "flex";
  }
}

function fecharModal() {
  medicamentoSelecionado = null;

  if (confirmationModal) {
    confirmationModal.style.display = "none";
  }
}

if (cancelButton) {
  cancelButton.addEventListener("click", fecharModal);
}

if (confirmButton) {
  confirmButton.addEventListener("click", function () {
    if (!medicamentoSelecionado) {
      return;
    }

    registrarMedicamento(medicamentoSelecionado);
    fecharModal();
  });
}

// ==========================================
// REGISTRAR MEDICAMENTO
// ==========================================

function registrarMedicamento(medicamento) {
  const nomeUsuario = obterUsuario() || "Familiar";

  const agora = new Date();

  const registro = {
    medicamento: medicamento,
    nome: nomeUsuario,
    horario: agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }),
    data: agora.toLocaleDateString("pt-BR"),
    dataCompleta: agora.toISOString()
  };

  const registros = carregarRegistros();

  registros[medicamento] = registro;

  salvarRegistros(registros);

  atualizarTela();

  alert(
    "Registro salvo!\n\n" +
    medicamento +
    "\n" +
    "Dado por: " +
    nomeUsuario +
    "\n" +
    "Horário: " +
    registro.horario
  );
}

// ==========================================
// ATUALIZAR A TELA
// ==========================================

function atualizarTela() {
  const registros = carregarRegistros();

  const botoes = document.querySelectorAll("[data-medicamento]");

  let total = botoes.length;
  let dados = Object.keys(registros).length;
  let pendentes = total - dados;

  if (totalCount) {
    totalCount.textContent = total;
  }

  if (givenCount) {
    givenCount.textContent = dados;
  }

  if (pendingCount) {
    pendingCount.textContent = pendentes < 0 ? 0 : pendentes;
  }

  botoes.forEach(function (botao) {
    const medicamento = botao.getAttribute("data-medicamento");
    const cartao = botao.closest(".medication-card");

    const registro = registros[medicamento];

    if (registro) {
      botao.textContent = "Registrado ✓";
      botao.disabled = true;
      botao.classList.add("registered");

      if (cartao) {
        cartao.classList.add("medication-done");

        let informacao = cartao.querySelector(".registro-info");

        if (!informacao) {
          informacao = document.createElement("p");
          informacao.className = "registro-info";
          cartao.appendChild(informacao);
        }

        informacao.textContent =
          "Dado por " +
          registro.nome +
          " às " +
          registro.horario +
          " do dia " +
          registro.data;
      }
    } else {
      botao.textContent = "Dar";
      botao.disabled = false;
      botao.classList.remove("registered");

      if (cartao) {
        cartao.classList.remove("medication-done");

        const informacao = cartao.querySelector(".registro-info");

        if (informacao) {
          informacao.remove();
        }
      }
    }
  });
}

// ==========================================
// BOTÕES DOS MEDICAMENTOS
// ==========================================

document.addEventListener("click", function (evento) {
  const botao = evento.target.closest("[data-medicamento]");

  if (!botao) {
    return;
  }

  if (botao.disabled) {
    return;
  }

  const medicamento = botao.getAttribute("data-medicamento");

  abrirModal(medicamento);
});

// ==========================================
// INICIAR O APLICATIVO
// ==========================================

const usuarioSalvo = obterUsuario();

if (usuarioSalvo) {
  mostrarAplicativo(usuarioSalvo);
} else {
  mostrarLogin();
}
