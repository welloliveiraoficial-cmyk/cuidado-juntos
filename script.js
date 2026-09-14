/* =========================================================
   CUIDADO JUNTOS
   SCRIPT PRINCIPAL
   VERSÃO PREMIUM (v18 — push instantâneo via Vercel)
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
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getMessaging,
  getToken
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";


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

/*
 * IMPORTANTE: troque pela sua chave gerada em
 * Firebase Console → Configurações do projeto →
 * Cloud Messaging → "Certificados push da Web" →
 * Gerar par de chaves.
 */

const VAPID_KEY = "BFVSP3o_fL9b9qYzNwaHR3-DytRPRlmsPMoaBdbwT0uZOcUMd8ZCkUrfpVaZu9SS2jTtQf6c9NnaJAEUIIH8X_8";

/*
 * IMPORTANTE: troque pela URL do seu projeto na Vercel
 * (ex: https://cuidado-juntos-api.vercel.app/api/notificar-registro)
 * e pela mesma chave que você colocar na variável de
 * ambiente API_SECRET na Vercel.
 */

const URL_NOTIFICAR_PUSH =
  "https://cuidado-juntos-api.vercel.app/api/notificar-registro";

const CHAVE_API_PUSH = "050619Well@";


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

let primeiraCargaRegistrosHoje = true;

let timerFecharSucesso = null;

let meuTokenPush = null;


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
  "00:00",
  "23:58"
];


/* =========================================================
   REMÉDIOS POR HORÁRIO
   (só aparece ao clicar em "Dar" — a lista principal
   mostra apenas o horário, de propósito)
========================================================= */

const MEDICAMENTOS = {
  "08:00": ["Sertralina", "Levetiracetam"],
  "09:00": ["Losartana", "Quetiapina"],
  "10:00": ["Clopidogrel"],
  "12:00": ["Rivaroxabana"],
  "16:00": ["Levetiracetam"],
  "20:00": ["Atorvastatina"],
  "21:00": ["Losartana", "Quetiapina"],
  "22:00": ["Clonazepam"],
  "00:00": ["Levetiracetam"],
  "23:58": ["Teste"]
};


/* =========================================================
   PERÍODO DO DIA POR HORÁRIO
   (usado como cor/etiqueta quando o horário não está
   "Tomado", "Próximo", "Agora" nem "Atrasado")
========================================================= */

const PERIODOS = {
  "08:00": { rotulo: "Manhã", classe: "periodo-manha" },
  "09:00": { rotulo: "Manhã", classe: "periodo-manha" },
  "10:00": { rotulo: "Manhã", classe: "periodo-manha" },
  "12:00": { rotulo: "Almoço", classe: "periodo-almoco" },
  "16:00": { rotulo: "Tarde", classe: "periodo-tarde" },
  "20:00": { rotulo: "Noturno", classe: "periodo-noite" },
  "21:00": { rotulo: "Noturno", classe: "periodo-noite" },
  "22:00": { rotulo: "Noturno", classe: "periodo-noite" },
  "00:00": { rotulo: "Madrugada", classe: "periodo-madrugada" },
  "23:58": { rotulo: "Teste", classe: "periodo-madrugada" }
};

const TODAS_CLASSES_BADGE = [
  "badge-tomado",
  "badge-proximo",
  "badge-agora",
  "badge-atrasado",
  "periodo-manha",
  "periodo-almoco",
  "periodo-tarde",
  "periodo-noite",
  "periodo-madrugada"
];

const MESES_POR_EXTENSO = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

/* Perímetro da circunferência do anel (r=42 -> 2*pi*42) */
const PERIMETRO_ANEL = 263.9;


/* =========================================================
   ELEMENTOS DA PÁGINA
========================================================= */

const telaSplash =
  document.getElementById("tela-splash");

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

const modalSair =
  document.getElementById("modal-sair");

const botaoCancelarSair =
  document.getElementById("btn-cancelar-sair");

const botaoConfirmarSair =
  document.getElementById("btn-confirmar-sair");

const botaoNotificacao =
  document.getElementById("btn-notificacao");

const botaoInstalar =
  document.getElementById("btn-instalar");

const modalConfirmacao =
  document.getElementById("modal-confirmacao");

const modalPassoConfirmar =
  document.getElementById("modal-passo-confirmar");

const modalPassoSucesso =
  document.getElementById("modal-passo-sucesso");

const modalBadge =
  document.getElementById("modal-badge");

const modalTituloRemedios =
  document.getElementById("modal-titulo-remedios");

const textoConfirmacao =
  document.getElementById("texto-confirmacao");

const modalDadoPor =
  document.getElementById("modal-dadopor");

const botaoCancelar =
  document.getElementById("btn-cancelar");

const botaoConfirmar =
  document.getElementById("btn-confirmar");

const sucessoRemedios =
  document.getElementById("sucesso-remedios");

const sucessoHorario =
  document.getElementById("sucesso-horario");

const sucessoDadoPor =
  document.getElementById("sucesso-dadopor");

const botaoFecharSucesso =
  document.getElementById("btn-fechar-sucesso");

const dataAtualEl =
  document.getElementById("data-atual");

const resumoMensagemEl =
  document.getElementById("resumo-mensagem");

const anelBarra =
  document.getElementById("anel-barra");

const anelPercentual =
  document.getElementById("anel-percentual");

const contadorTotal =
  document.getElementById("contador-total");

const listaHistorico =
  document.getElementById("lista-historico");

const dataHistorico =
  document.getElementById("data-historico");

const historicoTotal =
  document.getElementById("historico-total");

const historicoAnelBarra =
  document.getElementById("historico-anel-barra");

const historicoAnelPercentual =
  document.getElementById("historico-anel-percentual");

const paginaMedicamentos =
  document.getElementById("pagina-medicamentos");

const paginaHistorico =
  document.getElementById("pagina-historico");

const botaoPaginaMedicamentos =
  document.getElementById("btn-pagina-medicamentos");

const botaoPaginaHistorico =
  document.getElementById("btn-pagina-historico");

const botaoVoltarMedicamentos =
  document.getElementById("btn-voltar-medicamentos");


/* =========================================================
   DATA DO CICLO
========================================================= */

function obterDataHoje() {

  const agora = new Date();

  /*
   * Antes das 06:00 pertence ao dia anterior.
   */

  if (agora.getHours() < 6) {
    agora.setDate(agora.getDate() - 1);
  }

  const ano = agora.getFullYear();

  const mes = String(agora.getMonth() + 1).padStart(2, "0");

  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;

}


/* =========================================================
   DATA POR EXTENSO
========================================================= */

function formatarDataPorExtenso(dataISO) {

  if (!dataISO) {
    return "Hoje";
  }

  const partes = dataISO.split("-");

  if (partes.length !== 3) {
    return "Hoje";
  }

  const dia = parseInt(partes[2], 10);

  const mes = MESES_POR_EXTENSO[parseInt(partes[1], 10) - 1] || "";

  const ano = partes[0];

  return `Hoje, ${dia} de ${mes} de ${ano}`;

}


/* =========================================================
   PRÓXIMA OCORRÊNCIA DE UM HORÁRIO
   (usada só para calcular contagem regressiva/atraso
   visual — não interfere na gravação no Firestore)
========================================================= */

function proximaOcorrencia(horario, agora) {

  const [hora, minuto] = horario.split(":").map(Number);

  const data = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
    hora,
    minuto,
    0,
    0
  );

  /*
   * Se o horário já passou há mais de 12 horas,
   * assume-se que é o de amanhã.
   */

  if (data.getTime() < agora.getTime() - 12 * 60 * 60 * 1000) {
    data.setDate(data.getDate() + 1);
  }

  return data;

}


/* =========================================================
   HORÁRIO DE TESTE
   O horário "23:58" (Teste) some sozinho da lista de
   "Tomado" depois de alguns minutos, para permitir repetir
   o teste de notificação quantas vezes for preciso, sem
   precisar apagar nada manualmente no Firestore.
========================================================= */

const HORARIO_TESTE = "23:58";

const EXPIRACAO_TESTE_MS = 1 * 60 * 1000; // 1 minuto

let avisoAtrasoTesteEnviado = false;

function obterRegistroAtivo(horario, agora) {

  const registro = registros[horario];

  if (!registro) {
    return null;
  }

  if (horario === HORARIO_TESTE) {

    const registradoEm = new Date(registro.dataCompleta).getTime();

    if (agora.getTime() - registradoEm > EXPIRACAO_TESTE_MS) {
      return null;
    }

  }

  return registro;

}


/* =========================================================
   BADGE (STATUS) DE CADA HORÁRIO
========================================================= */

function calcularProximoPendente(agora) {

  let horarioMaisProximo = null;

  let menorDiferenca = Infinity;

  HORARIOS.forEach(function (horario) {

    if (obterRegistroAtivo(horario, agora)) {
      return;
    }

    const ocorrencia = proximaOcorrencia(horario, agora);

    const diferenca = (ocorrencia.getTime() - agora.getTime()) / 60000;

    if (diferenca >= 0 && diferenca < menorDiferenca) {

      menorDiferenca = diferenca;

      horarioMaisProximo = horario;

    }

  });

  return horarioMaisProximo;

}

function calcularBadge(horario, agora, proximoPendente) {

  if (obterRegistroAtivo(horario, agora)) {

    return { rotulo: "Tomado", classe: "badge-tomado" };

  }

  const ocorrencia = proximaOcorrencia(horario, agora);

  const diferencaMin = Math.round(
    (ocorrencia.getTime() - agora.getTime()) / 60000
  );

  if (diferencaMin < 0) {

    return { rotulo: "Atrasado", classe: "badge-atrasado" };

  }

  /*
   * Só o horário mais urgente (o "proximoPendente") pode virar
   * cartão em destaque (Agora/Próximo). Isso evita que dois
   * horários próximos um do outro (ex.: o de teste "23:58" e
   * o "00:00") virem dois cartões gigantes pulsando ao mesmo
   * tempo, brigando pela atenção na tela.
   */

  if (horario === proximoPendente) {

    if (diferencaMin <= 30) {

      return { rotulo: "Agora", classe: "badge-agora" };

    }

    return { rotulo: "Próximo", classe: "badge-proximo" };

  }

  const periodo = PERIODOS[horario] || { rotulo: "Pendente", classe: "" };

  return { rotulo: periodo.rotulo, classe: periodo.classe };

}


/* =========================================================
   TEXTO DE APOIO (CONTAGEM / ATRASO / DADO POR)
========================================================= */

function formatarDuracao(minutos) {

  const minutosAbsolutos = Math.abs(minutos);

  const horas = Math.floor(minutosAbsolutos / 60);

  const min = minutosAbsolutos % 60;

  if (horas === 0) {

    return `${min} min`;

  }

  if (min === 0) {

    return `${horas}h`;

  }

  return `${horas}h ${min}min`;

}

function calcularTextoStatus(horario, agora) {

  const registro = obterRegistroAtivo(horario, agora);

  if (registro) {

    return `Dado por ${registro.nome} às ${registro.horaRegistro}`;

  }

  const ocorrencia = proximaOcorrencia(horario, agora);

  const diferencaMin = Math.round(
    (ocorrencia.getTime() - agora.getTime()) / 60000
  );

  if (diferencaMin < 0) {

    return `Atrasado ${formatarDuracao(diferencaMin)}`;

  }

  if (diferencaMin === 0) {

    return "É agora";

  }

  return `Falta ${formatarDuracao(diferencaMin)}`;

}


/* =========================================================
   MENSAGEM MOTIVACIONAL
========================================================= */

function calcularMensagemMotivacional(dados, total) {

  if (total === 0) {

    return "Vamos cuidar dos horários de hoje.";

  }

  if (dados === 0) {

    return "Vamos começar o dia! 💪";

  }

  if (dados === total) {

    return "Dia concluído! 🎉 Parabéns pelo cuidado.";

  }

  if (dados / total >= 0.5) {

    return "Quase lá! Falta pouco.";

  }

  return "Você está indo muito bem!";

}


/* =========================================================
   SALVAR NOME
========================================================= */

function salvarNome(nome) {

  nomeUsuario = nome.trim();

  localStorage.setItem(CHAVE_USUARIO, nomeUsuario);

}


/* =========================================================
   MOSTRAR APLICATIVO
========================================================= */

function mostrarAplicativo() {

  if (!telaLogin || !telaApp) {
    console.error("Elementos da tela não encontrados.");
    return;
  }

  telaLogin.style.display = "none";

  telaApp.style.display = "";


  if (nomeExibido) {

    nomeExibido.textContent = nomeUsuario;

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

  telaLogin.style.display = "";

  telaApp.style.display = "none";

}


/* =========================================================
   LOGIN
========================================================= */

function realizarLogin() {

  const nomeDigitado = nomeInput ? nomeInput.value.trim() : "";

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

    erroLogin.textContent = "";

  }


  salvarNome(nomeDigitado);


  mostrarAplicativo();


  if (firebaseAutenticado) {

    carregarRegistrosHoje();

  }

}


if (botaoEntrar) {

  botaoEntrar.addEventListener("click", realizarLogin);

}


if (nomeInput) {

  nomeInput.addEventListener("keydown", function (evento) {

    if (evento.key === "Enter") {

      evento.preventDefault();

      realizarLogin();

    }

  });

}


/* =========================================================
   NAVEGAÇÃO
========================================================= */

function mostrarPaginaMedicamentos() {

  if (!paginaMedicamentos || !paginaHistorico) {
    return;
  }

  paginaMedicamentos.style.display = "";

  paginaHistorico.style.display = "none";


  if (botaoPaginaMedicamentos) {

    botaoPaginaMedicamentos.classList.add("ativo");

  }

  if (botaoPaginaHistorico) {

    botaoPaginaHistorico.classList.remove("ativo");

  }


  window.scrollTo({ top: 0, behavior: "smooth" });

}


function mostrarPaginaHistorico() {

  if (!paginaMedicamentos || !paginaHistorico) {
    return;
  }

  paginaMedicamentos.style.display = "none";

  paginaHistorico.style.display = "";


  if (botaoPaginaMedicamentos) {

    botaoPaginaMedicamentos.classList.remove("ativo");

  }

  if (botaoPaginaHistorico) {

    botaoPaginaHistorico.classList.add("ativo");

  }


  definirDataHistorico();


  if (firebaseAutenticado && dataHistorico) {

    carregarHistorico(dataHistorico.value);

  }


  window.scrollTo({ top: 0, behavior: "smooth" });

}


if (botaoPaginaMedicamentos) {

  botaoPaginaMedicamentos.addEventListener("click", mostrarPaginaMedicamentos);

}

if (botaoPaginaHistorico) {

  botaoPaginaHistorico.addEventListener("click", mostrarPaginaHistorico);

}

if (botaoVoltarMedicamentos) {

  botaoVoltarMedicamentos.addEventListener("click", mostrarPaginaMedicamentos);

}


/* =========================================================
   DATA DO HISTÓRICO
========================================================= */

function definirDataHistorico() {

  if (dataHistorico && !dataHistorico.value) {

    dataHistorico.value = obterDataHoje();

  }

}


if (dataHistorico) {

  dataHistorico.addEventListener("change", function () {

    const dataSelecionada = dataHistorico.value;

    if (!dataSelecionada) {
      return;
    }

    if (firebaseAutenticado) {

      carregarHistorico(dataSelecionada);

    }

  });

}


/* =========================================================
   SAIR
========================================================= */

if (botaoSair) {

  botaoSair.addEventListener("click", function () {

    if (modalSair) {

      modalSair.style.display = "flex";

    }

  });

}


if (botaoCancelarSair) {

  botaoCancelarSair.addEventListener("click", function () {

    if (modalSair) {

      modalSair.style.display = "none";

    }

  });

}


if (botaoConfirmarSair) {

  botaoConfirmarSair.addEventListener("click", function () {

    if (modalSair) {

      modalSair.style.display = "none";

    }


    localStorage.removeItem(CHAVE_USUARIO);


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

  });

}


/* =========================================================
   MODAL — ETAPA 1: CONFIRMAR
========================================================= */

function abrirModal(horario) {

  horarioSelecionado = horario;


  const nomesRemedios =
    (MEDICAMENTOS[horario] || []).join(" + ") || "Medicamento";

  const registroExistente = obterRegistroAtivo(horario, new Date());


  if (modalTituloRemedios) {

    modalTituloRemedios.textContent = nomesRemedios;

  }

  if (textoConfirmacao) {

    textoConfirmacao.textContent =
      `Confirma que o medicamento das ${horario} foi dado agora?`;

  }

  if (modalDadoPor) {

    modalDadoPor.textContent = registroExistente
      ? `Já registrado por: ${registroExistente.nome}`
      : "Dado por: —";

  }

  if (modalBadge) {

    const agora = new Date();

    const proximoPendente = calcularProximoPendente(agora);

    const badge = calcularBadge(horario, agora, proximoPendente);

    modalBadge.textContent = badge.rotulo;

  }


  if (modalPassoConfirmar) {

    modalPassoConfirmar.style.display = "";

  }

  if (modalPassoSucesso) {

    modalPassoSucesso.style.display = "none";

  }


  if (modalConfirmacao) {

    modalConfirmacao.style.display = "flex";

  }

}


function fecharModal() {

  horarioSelecionado = null;


  if (timerFecharSucesso) {

    clearTimeout(timerFecharSucesso);

    timerFecharSucesso = null;

  }


  if (modalConfirmacao) {

    modalConfirmacao.style.display = "none";

  }

}


if (botaoCancelar) {

  botaoCancelar.addEventListener("click", fecharModal);

}

if (botaoFecharSucesso) {

  botaoFecharSucesso.addEventListener("click", fecharModal);

}


/* =========================================================
   BOTÕES DAR / CLIQUE NO CARTÃO
========================================================= */

function configurarBotoesDar() {

  const cartoes = document.querySelectorAll(".medicamento-card");

  cartoes.forEach(function (cartao) {

    if (cartao.dataset.eventoConfigurado === "true") {
      return;
    }

    cartao.dataset.eventoConfigurado = "true";


    cartao.addEventListener("click", function (evento) {

      const botao = cartao.querySelector(".btn-dar");

      if (botao && botao.disabled) {
        return;
      }

      const horario = cartao.getAttribute("data-horario");

      if (!horario) {

        console.error("Horário não encontrado.");

        return;

      }

      abrirModal(horario);

    });

  });

}


/* =========================================================
   CONFIRMAR MEDICAMENTO
========================================================= */

if (botaoConfirmar) {

  botaoConfirmar.addEventListener("click", async function () {

    if (!horarioSelecionado) {
      return;
    }


    if (!firebaseAutenticado || !db) {

      window.alert("Aguarde a conexão com o aplicativo.");

      return;

    }


    const horario = horarioSelecionado;


    const agora = new Date();


    const dataISO = obterDataHoje();


    const horaRegistro = agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });


    const dataRegistro = agora.toLocaleDateString("pt-BR");


    const idRegistro =
      `${dataISO}_${horario.replace(":", "-")}`;


    const registro = {
      horario: horario,
      nome: nomeUsuario || "Familiar",
      horaRegistro: horaRegistro,
      dataRegistro: dataRegistro,
      dataISO: dataISO,
      dataCompleta: agora.toISOString()
    };


    try {

      botaoConfirmar.disabled = true;

      botaoConfirmar.textContent = "Salvando...";


      await setDoc(
        doc(db, "registros", idRegistro),
        registro
      );


      registros[horario] = registro;


      if (horario === HORARIO_TESTE) {

        avisoAtrasoTesteEnviado = false;

      }


      notificarPushInstantaneo(registro);


      atualizarTela();


      mostrarSucesso(horario, registro);


      if (dataHistorico && dataHistorico.value === dataISO) {

        carregarHistorico(dataISO);

      }

    } catch (erro) {

      console.error("Erro ao salvar registro:", erro);

      window.alert("Não foi possível salvar o registro.");

    } finally {

      botaoConfirmar.disabled = false;

      botaoConfirmar.textContent = "Confirmar";

    }

  });

}


/* =========================================================
   MODAL — ETAPA 2: SUCESSO
========================================================= */

function mostrarSucesso(horario, registro) {

  const nomesRemedios =
    (MEDICAMENTOS[horario] || []).join(" + ") || "Medicamento";

  if (sucessoRemedios) {

    sucessoRemedios.textContent = nomesRemedios;

  }

  if (sucessoHorario) {

    sucessoHorario.textContent =
      `Horário: ${horario} · registrado às ${registro.horaRegistro}`;

  }

  if (sucessoDadoPor) {

    sucessoDadoPor.textContent = `Dado por: ${registro.nome}`;

  }


  if (modalPassoConfirmar) {

    modalPassoConfirmar.style.display = "none";

  }

  if (modalPassoSucesso) {

    modalPassoSucesso.style.display = "";

  }


  if (modalConfirmacao) {

    modalConfirmacao.style.display = "flex";

  }


  if (timerFecharSucesso) {

    clearTimeout(timerFecharSucesso);

  }

  timerFecharSucesso = setTimeout(fecharModal, 3200);

}


/* =========================================================
   ATUALIZAR BOTÃO DE NOTIFICAÇÃO
========================================================= */

function atualizarBotaoNotificacao() {

  if (!botaoNotificacao) {
    return;
  }

  if (notificacaoAtiva) {

    botaoNotificacao.classList.add("ativo");

    botaoNotificacao.setAttribute("aria-label", "Notificações ativadas");

  } else {

    botaoNotificacao.classList.remove("ativo");

    botaoNotificacao.setAttribute("aria-label", "Ativar notificações");

  }

}


/* =========================================================
   AVISAR FAMÍLIA SOBRE REGISTROS
   Dispara um aviso quando OUTRA pessoa (não quem está
   usando este aparelho agora) registra um medicamento.
   Só funciona enquanto o app estiver aberto (em primeiro
   ou segundo plano) neste navegador — não é um push de
   verdade vindo de um servidor, pois o projeto não usa
   Firebase Cloud Messaging.
========================================================= */

function avisarFamiliaSobreRegistro(registro) {

  if (!registro || !registro.horario) {
    return;
  }

  /* Quem acabou de registrar já viu a confirmação na tela. */

  if (registro.nome && registro.nome === nomeUsuario) {
    return;
  }

  if (!notificacaoAtiva) {
    return;
  }

  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const titulo = "Cuidado Juntos";

  const corpo = `${registro.nome || "Alguém"} deu o remédio das ${registro.horario}.`;

  mostrarNotificacaoLocal(titulo, corpo);

}

/* =========================================================
   REGISTRAR NOTIFICAÇÃO PUSH DE VERDADE (FCM)
   Salva no Firestore o "endereço" deste aparelho, para
   que a Cloud Function consiga mandar notificação pra ele
   mesmo com o app fechado.
========================================================= */

async function registrarTokenPush() {

  if (!notificacaoAtiva) {
    return;
  }

  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  if (!("serviceWorker" in navigator)) {
    return;
  }

  if (!VAPID_KEY || VAPID_KEY === "SUBSTITUA_PELA_SUA_CHAVE_VAPID") {

    console.warn(
      "Notificação push não configurada: defina VAPID_KEY em script.js."
    );

    return;

  }

  try {

    const registroSW = await navigator.serviceWorker.ready;

    const messaging = getMessaging(firebaseApp);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registroSW
    });

    if (!token) {
      return;
    }

    meuTokenPush = token;

    await setDoc(
      doc(db, "dispositivos", token),
      {
        nome: nomeUsuario || "Família",
        atualizadoEm: serverTimestamp()
      },
      { merge: true }
    );

  } catch (erro) {

    console.error("Erro ao registrar notificação push:", erro);

  }

}


/* =========================================================
   DISPARAR NOTIFICAÇÃO PUSH INSTANTÂNEA (via Vercel)
   Chamado logo depois de salvar um registro no Firestore.
   Quem está registrando já está com o app aberto, então o
   aviso sai na mesma hora — sem precisar de Cloud Functions
   nem do plano Blaze. Se a chamada falhar (ex: sem internet
   por um instante), o registro em si já foi salvo antes e
   não é afetado — só o aviso extra que não sai.
========================================================= */

function notificarPushInstantaneo(registro) {

  if (!URL_NOTIFICAR_PUSH || URL_NOTIFICAR_PUSH.indexOf("SEU-PROJETO") !== -1) {
    return;
  }

  if (!CHAVE_API_PUSH || CHAVE_API_PUSH === "SUBSTITUA_PELA_SUA_CHAVE_SECRETA") {
    return;
  }

  fetch(URL_NOTIFICAR_PUSH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CHAVE_API_PUSH
    },
    body: JSON.stringify({
      horario: registro.horario,
      nome: registro.nome,
      tokenRemetente: meuTokenPush
    })
  }).catch(function (erro) {

    console.log("Aviso push instantâneo não enviado:", erro);

  });

}


function mostrarNotificacaoLocal(titulo, corpo) {

  const opcoes = {
    body: corpo,
    icon: "img/logo.png",
    badge: "img/icone-notificacao.png",
    tag: "cuidado-juntos-registro"
  };

  if ("serviceWorker" in navigator) {

    navigator.serviceWorker.ready
      .then(function (registro) {
        return registro.showNotification(titulo, opcoes);
      })
      .catch(function () {

        try {
          new Notification(titulo, opcoes);
        } catch (erro) {
          console.log("Notificação não exibida:", erro);
        }

      });

  } else {

    try {
      new Notification(titulo, opcoes);
    } catch (erro) {
      console.log("Notificação não exibida:", erro);
    }

  }

}


/* =========================================================
   NOTIFICAÇÕES
========================================================= */

if (botaoNotificacao) {

  botaoNotificacao.addEventListener("click", async function () {

    if (!("Notification" in window)) {

      window.alert("Este navegador não oferece suporte a notificações.");

      return;

    }


    try {

      if (Notification.permission === "default") {

        const permissao = await Notification.requestPermission();

        if (permissao !== "granted") {

          notificacaoAtiva = false;

          localStorage.setItem(CHAVE_NOTIFICACAO, "false");

          atualizarBotaoNotificacao();

          return;

        }

      }


      if (Notification.permission === "granted") {

        notificacaoAtiva = !notificacaoAtiva;

        localStorage.setItem(
          CHAVE_NOTIFICACAO,
          String(notificacaoAtiva)
        );

        atualizarBotaoNotificacao();


        if (notificacaoAtiva) {

          try {

            new Notification("Cuidado Juntos", {
              body: "As notificações foram ativadas.",
              icon: "img/logo.png",
              badge: "img/icone-notificacao.png"
            });

          } catch (erro) {

            console.log("Notificação não exibida:", erro);

          }

          registrarTokenPush();

        }

      }

    } catch (erro) {

      console.error("Erro nas notificações:", erro);

    }

  });

}


/* =========================================================
   ATUALIZAR TELA
========================================================= */

function atualizarTela() {

  const agora = new Date();

  const proximoPendente = calcularProximoPendente(agora);

  const cartoes = document.querySelectorAll(".medicamento-card");

  const total = HORARIOS.length;

  const dados = Object.keys(registros).length;

  const pendentes = Math.max(total - dados, 0);


  /*
   * Card de resumo do dia.
   */

  if (dataAtualEl) {

    dataAtualEl.textContent = formatarDataPorExtenso(obterDataHoje());

  }

  if (resumoMensagemEl) {

    resumoMensagemEl.textContent =
      calcularMensagemMotivacional(dados, total);

  }

  if (contadorTotal) {

    contadorTotal.textContent = `${dados}/${total}`;

  }

  const percentual =
    total > 0 ? Math.round((dados / total) * 100) : 0;

  if (anelBarra) {

    const offset =
      PERIMETRO_ANEL - (PERIMETRO_ANEL * percentual) / 100;

    anelBarra.style.strokeDashoffset = String(offset);

    anelBarra.style.stroke =
      percentual === 100 ? "#16a34a" : "#1fb8db";

  }

  if (anelPercentual) {

    anelPercentual.textContent = `${percentual}%`;

  }


  /*
   * TESTE: AVISO DE ATRASO
   * Só para o horário de teste (23:58) — dispara uma
   * notificação local 1 minuto depois do horário passar,
   * caso ainda não tenha sido registrado. Serve para testar
   * o alerta de atraso sem precisar esperar um horário real.
   * Zera sozinho quando o teste é registrado de novo.
   */

  if (!obterRegistroAtivo(HORARIO_TESTE, agora)) {

    const ocorrenciaTeste = proximaOcorrencia(HORARIO_TESTE, agora);

    const diferencaTeste = Math.round(
      (ocorrenciaTeste.getTime() - agora.getTime()) / 60000
    );

    if (diferencaTeste <= -1 && !avisoAtrasoTesteEnviado) {

      avisoAtrasoTesteEnviado = true;

      if (
        notificacaoAtiva &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {

        mostrarNotificacaoLocal(
          "Cuidado Juntos 🧪",
          "Teste: o medicamento das 23:58 ficou atrasado."
        );

      }

    }

  }


  /*
   * Cartões de cada horário.
   */

  cartoes.forEach(function (cartao) {

    const horario = cartao.getAttribute("data-horario");

    if (!horario) {
      return;
    }

    const registro = obterRegistroAtivo(horario, agora);

    const badgeEl = cartao.querySelector("[data-badge]");

    const statusEl = cartao.querySelector("[data-status]");

    const botaoDar = cartao.querySelector(".btn-dar");

    const badge = calcularBadge(horario, agora, proximoPendente);


    cartao.classList.remove(...TODAS_CLASSES_BADGE);

    if (badge.classe) {

      cartao.classList.add(badge.classe);

    }


    if (badgeEl) {

      badgeEl.textContent = badge.rotulo;

      badgeEl.classList.remove(...TODAS_CLASSES_BADGE);

      if (badge.classe) {

        badgeEl.classList.add(badge.classe);

      }

    }


    if (statusEl) {

      statusEl.textContent = calcularTextoStatus(horario, agora);

    }


    if (registro) {

      cartao.classList.add("registrado");

      if (botaoDar) {

        botaoDar.disabled = true;

        botaoDar.textContent = "Registrado";

      }

    } else {

      cartao.classList.remove("registrado");

      if (botaoDar) {

        botaoDar.disabled = false;

        botaoDar.textContent = "Dar";

      }

    }

  });

}


/*
 * Liga os cliques dos cartões assim que a
 * página carrega, já que os cartões
 * existem no HTML desde o início.
 */

configurarBotoesDar();


/*
 * Atualiza os badges/contagens regressivas
 * mesmo sem novos registros — o tempo passa.
 */

setInterval(atualizarTela, 30000);


/* =========================================================
   CARREGAR REGISTROS DE HOJE (TEMPO REAL)
========================================================= */

function carregarRegistrosHoje() {

  if (!db) {
    return;
  }

  if (unsubscribeHoje) {

    unsubscribeHoje();

    unsubscribeHoje = null;

  }

  primeiraCargaRegistrosHoje = true;

  const dataISO = obterDataHoje();

  const consulta = query(
    collection(db, "registros"),
    where("dataISO", "==", dataISO)
  );

  unsubscribeHoje = onSnapshot(
    consulta,
    function (snapshot) {

      const registrosAnteriores = registros;

      const registrosNovos = {};

      snapshot.forEach(function (docSnap) {

        const dado = docSnap.data();

        if (dado && dado.horario) {

          registrosNovos[dado.horario] = dado;

        }

      });

      /*
       * O aviso de "fulano deu o remédio" já é enviado pelo
       * push de verdade (notificarPushInstantaneo → Vercel →
       * Firebase Cloud Messaging → sw.js), que funciona mesmo
       * com o app fechado e mostra o ícone certo do app. Por
       * isso NÃO chamamos mais avisarFamiliaSobreRegistro()
       * aqui — evita a notificação duplicada (a segunda, com
       * o sininho genérico, que só aparecia com o app aberto).
       */

      primeiraCargaRegistrosHoje = false;

      registros = registrosNovos;

      atualizarTela();

    },
    function (erro) {

      console.error("Erro ao carregar registros de hoje:", erro);

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

    unsubscribeHistorico = null;

  }

  const consulta = query(
    collection(db, "registros"),
    where("dataISO", "==", dataSelecionada)
  );

  unsubscribeHistorico = onSnapshot(
    consulta,
    function (snapshot) {

      registrosHistorico = {};

      snapshot.forEach(function (docSnap) {

        const dado = docSnap.data();

        if (dado && dado.horario) {

          registrosHistorico[dado.horario] = dado;

        }

      });

      renderizarHistorico();

    },
    function (erro) {

      console.error("Erro ao carregar histórico:", erro);

    }
  );

}


const ICONES_HORARIO = {
  "08:00": "☀️",
  "09:00": "🌤️",
  "10:00": "🌞",
  "12:00": "🍽️",
  "16:00": "🌤️",
  "20:00": "🌙",
  "21:00": "🌙",
  "22:00": "🌙",
  "00:00": "🌌",
  "23:58": "🧪"
};


function renderizarHistorico() {

  if (!listaHistorico) {
    return;
  }

  const quantidadeRegistrada = HORARIOS.filter(function (horario) {

    return Boolean(registrosHistorico[horario]);

  }).length;


  if (historicoTotal) {

    historicoTotal.textContent =
      quantidadeRegistrada +
      (quantidadeRegistrada === 1 ? " registro" : " registros");

  }

  const percentual = Math.round(
    (quantidadeRegistrada / HORARIOS.length) * 100
  );

  if (historicoAnelBarra) {

    const offset =
      PERIMETRO_ANEL - (PERIMETRO_ANEL * percentual) / 100;

    historicoAnelBarra.style.strokeDashoffset = String(offset);

    historicoAnelBarra.style.stroke =
      percentual === 100 ? "#16a34a" : "#1fb8db";

  }

  if (historicoAnelPercentual) {

    historicoAnelPercentual.textContent = `${percentual}%`;

  }


  listaHistorico.innerHTML = "";

  HORARIOS.forEach(function (horario) {

    const registro = registrosHistorico[horario];

    const icone = ICONES_HORARIO[horario] || "💊";

    const item = document.createElement("div");

    item.className = registro
      ? "historico-item tomado"
      : "historico-item nao-registrado";

    const detalhe = registro
      ? `Dado por ${registro.nome} às ${registro.horaRegistro}`
      : "Ainda não registrado";

    item.innerHTML = `
      <div class="icone-medicamento">${icone}</div>
      <div class="historico-item-detalhes">
        <strong>${horario}</strong>
        <span>${detalhe}</span>
      </div>
      <span class="historico-status-chip">
        ${registro ? "Tomado" : "Pendente"}
      </span>
    `;

    listaHistorico.appendChild(item);

  });

}


/* =========================================================
   INICIALIZAÇÃO DO FIREBASE
   (acontece em paralelo, sem travar o login)
========================================================= */

const firebaseApp = initializeApp(firebaseConfig);

auth = getAuth(firebaseApp);

db = getFirestore(firebaseApp);

signInAnonymously(auth)
  .then(function () {

    firebaseAutenticado = true;

    registrarTokenPush();

    const appVisivel =
      telaApp && telaApp.style.display !== "none";

    if (appVisivel) {

      carregarRegistrosHoje();

      const historicoVisivel =
        paginaHistorico && paginaHistorico.style.display !== "none";

      if (historicoVisivel && dataHistorico) {

        carregarHistorico(dataHistorico.value);

      }

    }

  })
  .catch(function (erro) {

    console.error("Erro ao conectar ao Firebase:", erro);

  });


/* =========================================================
   INSTALAR APLICATIVO (PWA)
   O navegador dispara "beforeinstallprompt" quando o app
   cumpre os requisitos (manifest + service worker + https).
   Guardamos o evento e só mostramos o botão nesse momento.
========================================================= */

let eventoInstalacaoAdiado = null;

window.addEventListener("beforeinstallprompt", function (evento) {

  evento.preventDefault();

  eventoInstalacaoAdiado = evento;

  if (botaoInstalar) {

    botaoInstalar.style.display = "inline-flex";

  }

});

if (botaoInstalar) {

  botaoInstalar.addEventListener("click", async function () {

    if (!eventoInstalacaoAdiado) {
      return;
    }

    botaoInstalar.style.display = "none";

    eventoInstalacaoAdiado.prompt();

    await eventoInstalacaoAdiado.userChoice;

    eventoInstalacaoAdiado = null;

  });

}

window.addEventListener("appinstalled", function () {

  if (botaoInstalar) {

    botaoInstalar.style.display = "none";

  }

  eventoInstalacaoAdiado = null;

});


/* =========================================================
   TELA INICIAL (COM SPLASH)
========================================================= */

function iniciarAposSplash() {

  if (nomeUsuario) {

    mostrarAplicativo();

  } else {

    mostrarLogin();

  }

}

setTimeout(function () {

  if (telaSplash) {

    telaSplash.style.opacity = "0";

    setTimeout(function () {

      telaSplash.style.display = "none";

    }, 400);

  }

  iniciarAposSplash();

}, 1400);
