
/* =========================
   CUIDADO JUNTOS
   Funcionalidades iniciais
   ========================= */

const telaLogin = document.getElementById("tela-login");
const telaApp = document.getElementById("tela-app");

const nomeInput = document.getElementById("nome-usuario");
const btnEntrar = document.getElementById("btn-entrar");
const erroLogin = document.getElementById("erro-login");

const nomeExibido = document.getElementById("nome-exibido");
const btnSair = document.getElementById("btn-sair");

const modal = document.getElementById("modal-confirmacao");
const textoConfirmacao = document.getElementById("texto-confirmacao");
const btnCancelar = document.getElementById("btn-cancelar");
const btnConfirmar = document.getElementById("btn-confirmar");

const totalMedicamentos = document.getElementById(
  "total-medicamentos"
);

const totalDados = document.getElementById(
  "total-dados"
);

const totalPendentes = document.getElementById(
  "total-pendentes"
);

let nomeUsuario = "";
let horarioSelecionado = null;

let registros = {};

/* =========================
   LOGIN
   ========================= */

function entrar() {
  const nome = nomeInput.value.trim();

  if (nome.length < 2) {
    erroLogin.textContent =
      "Digite seu primeiro nome para continuar.";
    return;
  }

  nomeUsuario = nome;

  nomeExibido.textContent = nomeUsuario;

  telaLogin.classList.add("escondido");
  telaApp.classList.remove("escondido");

  erroLogin.textContent = "";

  atualizarResumo();
}

btnEntrar.addEventListener("click", entrar);

nomeInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    entrar();
  }
});

/* =========================
   SAIR
   ========================= */

btnSair.addEventListener("click", function() {
  telaApp.classList.add("escondido");
  telaLogin.classList.remove("escondido");

  nomeInput.value = "";
  nomeUsuario = "";
});

/* =========================
   ABRIR MODAL
   ========================= */

const botoesDar = document.querySelectorAll(".btn-dar");

botoesDar.forEach(function(botao) {
  botao.addEventListener("click", function() {

    horarioSelecionado = botao.dataset.horario;

    textoConfirmacao.textContent =
      "Você está registrando o Medicamento das " +
      horarioSelecionado +
      " para a Josefa.";

    modal.classList.remove("escondido");

  });
});

/* =========================
   CANCELAR
   ========================= */

btnCancelar.addEventListener("click", function() {
  modal.classList.add("escondido");
  horarioSelecionado = null;
});

/* =========================
   CONFIRMAR MEDICAMENTO
   ========================= */

btnConfirmar.addEventListener("click", function() {

  if (!horarioSelecionado) {
    return;
  }

  const agora = new Date();

  const horaRegistro = agora.toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

  registros[horarioSelecionado] = {
    nome: nomeUsuario,
    hora: horaRegistro
  };

  atualizarMedicamentos();
  atualizarResumo();

  modal.classList.add("escondido");

  horarioSelecionado = null;

});

/* =========================
   ATUALIZAR MEDICAMENTOS
   ========================= */

function atualizarMedicamentos() {

  const medicamentos = document.querySelectorAll(
    ".medicamento"
  );

  medicamentos.forEach(function(item) {

    const horario = item.dataset.horario;

    const status = item.querySelector(".status");
    const botao = item.querySelector(".btn-dar");

    if (registros[horario]) {

      const registro = registros[horario];

      item.classList.add("dado");

      status.textContent =
        "✓ Dado por " +
        registro.nome +
        " às " +
        registro.hora;

      botao.textContent = "Registrado";
      botao.disabled = true;

    } else {

      item.classList.remove("dado");

      status.textContent =
        "Aguardando registro";

      botao.textContent = "Dar";
      botao.disabled = false;

    }

  });

}

/* =========================
   ATUALIZAR RESUMO
   ========================= */

function atualizarResumo() {

  const total = document.querySelectorAll(
    ".medicamento"
  ).length;

  const dados = Object.keys(registros).length;

  const pendentes = total - dados;

  totalMedicamentos.textContent = total;
  totalDados.textContent = dados;
  totalPendentes.textContent = pendentes;

}

/* =========================
   INICIALIZAÇÃO
   ========================= */

atualizarResumo();
                                            
