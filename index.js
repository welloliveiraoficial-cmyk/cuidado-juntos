/* =========================================================
   CUIDADO JUNTOS
   CLOUD FUNCTIONS
   1) avisarRegistro   — dispara na hora que alguém registra
      um medicamento no Firestore.
   2) verificarAtrasos — roda a cada 5 minutos e avisa se
      algum horário passou do ponto sem ninguém registrar.
========================================================= */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

const db = getFirestore();

const URL_ICONE =
  "https://welloliveiraoficial-cmyk.github.io/cuidado-juntos/img/logo.png";

const URL_BADGE =
  "https://welloliveiraoficial-cmyk.github.io/cuidado-juntos/img/icone-notificacao.png";

const HORARIOS = [
  "08:00", "09:00", "10:00", "12:00",
  "16:00", "20:00", "21:00", "22:00", "00:00"
];

const MEDICAMENTOS = {
  "08:00": ["Sertralina", "Levetiracetam"],
  "09:00": ["Losartana", "Quetiapina"],
  "10:00": ["Clopidogrel"],
  "12:00": ["Rivaroxabana"],
  "16:00": ["Levetiracetam"],
  "20:00": ["Atorvastatina"],
  "21:00": ["Losartana", "Quetiapina"],
  "22:00": ["Clonazepam"],
  "00:00": ["Levetiracetam"]
};

/* Minutos de atraso a partir dos quais avisamos (igual ao "Atrasado" da tela). */
const LIMIAR_ATRASO_MINUTOS = 30;


/* =========================================================
   ENVIAR PARA TODOS OS APARELHOS REGISTRADOS
========================================================= */

async function enviarParaTodos(titulo, corpo) {

  const dispositivosSnap = await db.collection("dispositivos").get();

  const tokens = dispositivosSnap.docs.map((d) => d.id).filter(Boolean);

  if (tokens.length === 0) {
    console.log("Nenhum dispositivo registrado para notificar.");
    return;
  }

  const resposta = await getMessaging().sendEachForMulticast({
    tokens,
    notification: {
      title: titulo,
      body: corpo
    },
    webpush: {
      notification: {
        icon: URL_ICONE,
        badge: URL_BADGE
      }
    }
  });

  /* Remove do Firestore qualquer token que não é mais válido
     (app desinstalado, permissão revogada, etc). */

  const tokensParaRemover = [];

  resposta.responses.forEach((r, indice) => {

    if (!r.success) {

      const codigo = r.error && r.error.code;

      if (codigo === "messaging/registration-token-not-registered") {
        tokensParaRemover.push(tokens[indice]);
      }

    }

  });

  await Promise.all(
    tokensParaRemover.map((token) =>
      db.collection("dispositivos").doc(token).delete()
    )
  );

}


/* =========================================================
   1) AVISO INSTANTÂNEO — remédio registrado
========================================================= */

exports.avisarRegistro = onDocumentCreated(
  "registros/{id}",
  async (evento) => {

    const dado = evento.data.data();

    if (!dado || !dado.horario) {
      return;
    }

    const remedios = MEDICAMENTOS[dado.horario];

    const listaRemedios =
      Array.isArray(remedios) && remedios.length
        ? remedios.join(", ")
        : "medicamento";

    const titulo = "Cuidado Juntos";

    const corpo =
      `${dado.nome || "Alguém"} registrou ${listaRemedios} das ${dado.horario}.`;

    await enviarParaTodos(titulo, corpo);

  }
);


/* =========================================================
   DATA DO CICLO (mesma regra do app: dia muda às 06:00,
   calculada no horário de Brasília)
========================================================= */

function obterAgoraBrasilia() {
  const agora = new Date();
  return new Date(agora.getTime() - 3 * 60 * 60 * 1000);
}

function obterDataHojeISO(agoraBrasilia) {

  const data = new Date(agoraBrasilia.getTime());

  if (data.getUTCHours() < 6) {
    data.setUTCDate(data.getUTCDate() - 1);
  }

  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;

}


/* =========================================================
   2) AVISO DE ATRASO — roda a cada 5 minutos
========================================================= */

exports.verificarAtrasos = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "America/Sao_Paulo"
  },
  async () => {

    const agoraBrasilia = obterAgoraBrasilia();

    const dataISO = obterDataHojeISO(agoraBrasilia);

    const registrosSnap = await db
      .collection("registros")
      .where("dataISO", "==", dataISO)
      .get();

    const horariosRegistrados = new Set(
      registrosSnap.docs.map((d) => d.data().horario)
    );

    for (const horario of HORARIOS) {

      if (horariosRegistrados.has(horario)) {
        continue;
      }

      const [hora, minuto] = horario.split(":").map(Number);

      const horarioAlvo = new Date(Date.UTC(
        agoraBrasilia.getUTCFullYear(),
        agoraBrasilia.getUTCMonth(),
        agoraBrasilia.getUTCDate(),
        hora,
        minuto
      ));

      let diferencaMinutos =
        (agoraBrasilia.getTime() - horarioAlvo.getTime()) / 60000;

      /* Se a diferença for muito negativa, é porque o horário
         é da madrugada seguinte — ignora aqui, não é atraso. */

      if (diferencaMinutos < -60) {
        continue;
      }

      const atrasado = diferencaMinutos >= LIMIAR_ATRASO_MINUTOS;

      if (!atrasado) {
        continue;
      }

      const avisoId = `${dataISO}_${horario}`;

      const avisoRef = db.collection("avisosAtraso").doc(avisoId);

      const avisoSnap = await avisoRef.get();

      if (avisoSnap.exists) {
        /* Já avisamos esse horário — não repete. */
        continue;
      }

      const remedios = MEDICAMENTOS[horario];

      const listaRemedios =
        Array.isArray(remedios) && remedios.length
          ? remedios.join(", ")
          : "medicamento";

      await enviarParaTodos(
        "Cuidado Juntos ⚠️",
        `O medicamento das ${horario} (${listaRemedios}) ainda não foi registrado.`
      );

      await avisoRef.set({
        enviadoEm: FieldValue.serverTimestamp()
      });

    }

  }
);
