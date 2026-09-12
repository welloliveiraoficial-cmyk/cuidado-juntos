// ==========================================
// CUIDADO JUNTOS
// Salvamento permanente no navegador
// ==========================================

const CHAVE_USUARIO = "cuidadoJuntos_nomeUsuario";
const CHAVE_REGISTROS = "cuidadoJuntos_registros";

// Guarda o nome e os registros no navegador
let nomeUsuario = localStorage.getItem(CHAVE_USUARIO) || "";
let registros = carregarRegistros();

function carregarRegistros() {
  try {
    const dados = localStorage.getItem(CHAVE_REGISTROS);

    if (!dados) {
      return {};
    }

    return JSON.parse(dados);
  } catch (erro) {
    console.error("Erro ao carregar registros:", erro);
    return {};
  }
}

function salvarRegistros() {
  localStorage.setItem(CHAVE_REGISTROS, JSON.stringify(registros));
}

function salvarNome(nome) {
  nomeUsuario = nome;
  localStorage.setItem(CHAVE_USUARIO, nome);
}

// ==========================================
// ELEMENTOS DA PÁGINA
// ==========================================

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

let medicamentoSelecionado = null;

// ==========================================
// MOSTRAR TELAS
// ==========================================

function mostrarAplicativo() {
  if (loginScreen) {
    loginScreen.style.display = "none";
  }

  if (appScreen) {
    appScreen.style.display = "block";
  }

  if (userNameDisplay) {
    userNameDisplay.textContent = nomeUsuario;
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

// ==========================================
// PRIMEIRO ACESSO
// ==========================================

if (loginForm) {
  loginForm.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const nomeDigitado = nameInput.value.trim();

    if (nomeDigitado === "") {
      alert("Digite seu primeiro nome.");
      return;
    }

    salvarNome(nomeDigitado);
    mostrarAplicativo();
  });
}

// ==========================================
// SAIR DA CONTA
// ==========================================

if (logoutButton) {
  logoutButton.addEventListener("click", function () {
    const desejaSair = confirm(
      "Deseja trocar de familiar neste aparelho?"
    );

    if (desejaSair) {
      localStorage.removeItem(CHAVE_USUARIO);
      nomeUsuario = "";
      mostrarLogin();
    }
  });
}

// ==========================================
// MODAL
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
  const agora = new Date();

  registros[medicamento] = {
    medicamento: medicamento,
    nome: nomeUsuario || "Familiar",
    horario: agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }),
    data: agora.toLocaleDateString("pt-BR"),
    dataCompleta: agora.toISOString()
  };

  salvarRegistros();
  atualizarTela();

  alert(
    "Registro salvo!\n\n" +
    medicamento +
    "\n" +
    "Dado por: " +
    registros[medicamento].nome +
    "\n" +
    "Horário: " +
    registros[medicamento].horario
  );
}

// ==========================================
// ATUALIZAR OS CARTÕES
// ==========================================

function atualizarTela() {
  const botoes = document.querySelectorAll("[data-medicamento]");

  const total = botoes.length;
  const registrados = Object.keys(registros).length;
  const pendentes = Math.max(total - registrados, 0);

  const totalCount = document.getElementById("totalCount");
  const givenCount = document.getElementById("givenCount");
  const pendingCount = document.getElementById("pendingCount");

  if (totalCount) {
    totalCount.textContent = total;
  }

  if (givenCount) {
    givenCount.textContent = registrados;
  }

  if (pendingCount) {
    pendingCount.textContent = pendentes;
  }

  botoes.forEach(function (botao) {
    const medicamento = botao.getAttribute("data-medicamento");
    const registro = registros[medicamento];

    if (registro) {
      botao.textContent = "Registrado ✓";
      botao.disabled = true;
      botao.classList.add("registered");

      const cartao = botao.closest(".medication-card");

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

      const cartao = botao.closest(".medication-card");

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

  if (!botao || botao.disabled) {
    return;
  }

  const medicamento = botao.getAttribute("data-medicamento");

  abrirModal(medicamento);
});

// ==========================================
// INICIALIZAÇÃO
// ==========================================

if (nomeUsuario) {
  mostrarAplicativo();
} else {
  mostrarLogin();
}
