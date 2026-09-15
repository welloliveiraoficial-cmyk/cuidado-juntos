/*
 * IMPORTANTE: este arquivo é carregado como <script> comum
 * (sem type="module"), então NÃO pode usar "import". Dentro
 * do APK nativo, o próprio Capacitor injeta automaticamente
 * "window.Capacitor" com os plugins prontos em
 * "window.Capacitor.Plugins". No GitHub Pages (PWA no
 * navegador), "window.Capacitor" simplesmente não existe, e
 * o código abaixo sai sem fazer nada.
 */

const HORARIOS = [
  ["08:00", 8, 0],
  ["09:00", 9, 0],
  ["10:00", 10, 0],
  ["12:00", 12, 0],
  ["16:00", 16, 0],
  ["20:00", 20, 0],
  ["21:00", 21, 0],
  ["22:00", 22, 0],
  ["00:00", 0, 0]
];

const CHANNEL_ID = "medicamentos";
const CHANNEL_AVISOS_FAMILIA = "avisos_familia";

async function configurarNotificacoesNativas() {
  // No GitHub Pages continua funcionando normalmente.
  // Este código só será executado dentro do APK.
  if (
    typeof window.Capacitor === "undefined" ||
    !window.Capacitor.isNativePlatform ||
    !window.Capacitor.isNativePlatform()
  ) {
    return;
  }

  const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;

  if (!LocalNotifications) {
    console.error("Plugin LocalNotifications não está disponível.");
    return;
  }

  try {
    // Verifica a permissão atual
    const permissao = await LocalNotifications.checkPermissions();

    // Solicita automaticamente a permissão na primeira utilização
    if (
      permissao.display === "prompt" ||
      permissao.display === "prompt-with-rationale"
    ) {
      const resultado = await LocalNotifications.requestPermissions();

      if (resultado.display !== "granted") {
        console.log("Permissão para notificações não concedida.");
        return;
      }
    }

    // Se a permissão já foi negada, não fica solicitando repetidamente.
    if (permissao.display === "denied") {
      console.log("Notificações estão bloqueadas.");
      return;
    }

    // Cria o canal de notificações do Android (horários fixos)
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: "Medicamentos",
      description: "Lembretes dos horários dos medicamentos",
      importance: 4,
      visibility: 1,
      vibration: true
    });

    // Cria o canal usado pelo aviso "fulano registrou o remédio"
    // e pelo aviso de atraso (push da família via FCM nativo).
    await LocalNotifications.createChannel({
      id: CHANNEL_AVISOS_FAMILIA,
      name: "Avisos da família",
      description: "Avisos de registro e atraso de medicamentos",
      importance: 4,
      visibility: 1,
      vibration: true
    });

    // Remove agendamentos anteriores para evitar notificações duplicadas
    await LocalNotifications.cancelAll();

    // Agenda os 9 horários diariamente
    await LocalNotifications.schedule({
      notifications: HORARIOS.map(([horario, hora, minuto], indice) => ({
        id: 1000 + indice,
        title: "Cuidado Juntos ❤️",
        body: `Está na hora do medicamento das ${horario}.`,
        channelId: CHANNEL_ID,
        smallIcon: "notificacao",
        schedule: {
          on: {
            hour: hora,
            minute: minuto
          },
          allowWhileIdle: true
        },
        autoCancel: true
      }))
    });

    console.log("Notificações dos medicamentos configuradas com sucesso.");

  } catch (erro) {
    console.error(
      "Erro ao configurar notificações nativas:",
      erro
    );
  }
}

// Executa quando o aplicativo estiver pronto
window.addEventListener(
  "DOMContentLoaded",
  configurarNotificacoesNativas
);
