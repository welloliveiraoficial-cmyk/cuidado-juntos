/* =========================================================
   CUIDADO JUNTOS
   BUILD PARA O CAPACITOR
   Antes, o script "build" só imprimia uma mensagem e não
   criava nada — por isso o Capacitor não tinha o que
   empacotar no APK. Este script copia os arquivos do site
   para a pasta "www", que é o "webDir" configurado no
   capacitor.config.json.
========================================================= */

const fs = require("fs");
const path = require("path");

const PASTA_SAIDA = path.join(__dirname, "www");

const ARQUIVOS = [
  "index.html",
  "style.css",
  "script.js",
  "native-notifications.js",
  "manifest.json",
  "sw.js"
];

const PASTAS = ["img"];

function copiarPasta(origem, destino) {

  fs.mkdirSync(destino, { recursive: true });

  for (const item of fs.readdirSync(origem)) {

    const caminhoOrigem = path.join(origem, item);
    const caminhoDestino = path.join(destino, item);

    if (fs.statSync(caminhoOrigem).isDirectory()) {
      copiarPasta(caminhoOrigem, caminhoDestino);
    } else {
      fs.copyFileSync(caminhoOrigem, caminhoDestino);
    }

  }

}

fs.rmSync(PASTA_SAIDA, { recursive: true, force: true });
fs.mkdirSync(PASTA_SAIDA, { recursive: true });

for (const arquivo of ARQUIVOS) {

  const origem = path.join(__dirname, arquivo);

  if (fs.existsSync(origem)) {
    fs.copyFileSync(origem, path.join(PASTA_SAIDA, arquivo));
  } else {
    console.warn(`Aviso: "${arquivo}" não encontrado na raiz do projeto.`);
  }

}

for (const pasta of PASTAS) {

  const origem = path.join(__dirname, pasta);

  if (fs.existsSync(origem)) {
    copiarPasta(origem, path.join(PASTA_SAIDA, pasta));
  } else {
    console.warn(`Aviso: pasta "${pasta}" não encontrada na raiz do projeto.`);
  }

}

console.log(`Build concluído: arquivos copiados para ${PASTA_SAIDA}`);
