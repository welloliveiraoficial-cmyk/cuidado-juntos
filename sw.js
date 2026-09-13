/* =========================================================
   CUIDADO JUNTOS
   SERVICE WORKER (PWA)
   Guarda em cache os arquivos do app para ele abrir rápido
   e funcionar mesmo com internet fraca. Nunca guarda em
   cache dados do Firebase/Firestore — esses sempre vêm
   direto da rede, para não mostrar informação desatualizada
   sobre quem já tomou o remédio.
========================================================= */

const CACHE_NAME = "cuidado-juntos-v3";

const ARQUIVOS_ESSENCIAIS = [
  "./",
  "./index.html",
  "./style.css?v=15",
  "./script.js?v=15",
  "./native-notifications.js?v=15",
  "./manifest.json",
  "./img/logo.png",
  "./img/icone-notificacao.png"
];

/* =========================================================
   INSTALAÇÃO — guarda os arquivos essenciais em cache
========================================================= */

self.addEventListener("install", function (evento) {

  evento.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(ARQUIVOS_ESSENCIAIS);
      })
      .catch(function (erro) {
        console.error("Erro ao preparar cache do app:", erro);
      })
  );

  self.skipWaiting();

});

/* =========================================================
   ATIVAÇÃO — remove caches de versões antigas
========================================================= */

self.addEventListener("activate", function (evento) {

  evento.waitUntil(
    caches.keys().then(function (nomesCache) {

      return Promise.all(
        nomesCache
          .filter(function (nome) {
            return nome !== CACHE_NAME;
          })
          .map(function (nome) {
            return caches.delete(nome);
          })
      );

    })
  );

  self.clients.claim();

});

/* =========================================================
   FETCH — cache-first para o app, sempre rede para o
   Firebase/Firestore/Google (dados ao vivo dos remédios)
========================================================= */

self.addEventListener("fetch", function (evento) {

  const url = new URL(evento.request.url);

  /* Só cuidamos de pedidos do próprio site (GET). */

  if (evento.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  evento.respondWith(
    caches.match(evento.request).then(function (respostaCache) {

      const buscaNaRede = fetch(evento.request)
        .then(function (respostaRede) {

          if (respostaRede && respostaRede.status === 200) {

            const copia = respostaRede.clone();

            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(evento.request, copia);
            });

          }

          return respostaRede;

        })
        .catch(function () {
          return respostaCache;
        });

      return respostaCache || buscaNaRede;

    })
  );

});
