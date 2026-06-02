<?php include('conexion.php'); ?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ChatGPT con Voz - Audiolibros</title>
<link rel="stylesheet" href="estilos.css">
</head>
<body>
<header>
<h1>Chat con Voz — Lectura de PDFs</h1>
<nav>
<a href="index.php">Volver a la biblioteca</a>
</nav>
</header>
<main class="chat-layout">
<section class="chat-panel">
  <div class="chat-panel-top">
    <div class="chat-panel-row">
      <label for="select-libro">Selecciona un libro PDF:</label>
      <select id="select-libro"></select>
      <button id="btn-cargar" class="primary">Cargar</button>
    </div>

    <div class="chat-panel-row">
      <button id="btn-leer" disabled>🔊 Leer en voz alta</button>
      <button id="btn-pause" disabled>⏸ Pausar lectura</button>
      <button id="btn-chatgpt" disabled>💬 Resumir PDF</button>
      <button id="btn-resumen-rapido" disabled>⚡ Resumen rápido</button>
      <label class="checkbox-inline"><input type="checkbox" id="voice-toggle" checked> Activar modo voz</label>
    </div>

    <div class="chat-description">
      <p>Pide a la IA que lea, resuma o explique el libro seleccionado. Usa el botón de voz para dictar tu solicitud, o escribe directamente en el campo de texto.</p>
    </div>

    <div class="chat-quick-prompts">
      <button id="btn-ask-read" type="button">📚 Léeme el libro</button>
      <button id="btn-ask-summary" type="button">📝 Dame un resumen</button>
      <button id="btn-ask-structure" type="button">🔎 Explica el contenido</button>
    </div>

    <div id="loading-indicator" class="chat-note">Listo para interactuar. Selecciona un libro y presiona Cargar.</div>
    <div id="realtime-status" class="chat-status">Chat en vivo conectado a OpenAI streaming.</div>
  </div>

  <div id="chat" class="chat-window">
    <div id="mensajes" class="chat-messages"></div>
    <div class="chat-input-row">
      <input id="input-chat" placeholder="Escribe un mensaje o pide que resuma/lea el PDF">
      <button id="btn-voz-chat" type="button">🎙️ Hablar</button>
      <button id="send-chat" type="button" class="primary">Enviar</button>
    </div>
    <div id="voice-status" class="chat-note">Presiona 🎙️ para dictar tu mensaje por voz.</div>
  </div>
</section>
</main>

<script src="script_chat.js"></script>
</body>
</html>