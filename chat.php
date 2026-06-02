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
<main style="padding:20px;">
<section style="max-width:900px;margin:0 auto;">
  <label for="select-libro">Selecciona un libro PDF:</label>
  <select id="select-libro"></select>
  <button id="btn-cargar">Cargar y extraer texto</button>
  <button id="btn-leer" disabled>🔊 Leer en voz alta</button>
  <button id="btn-pause" disabled>⏸ Pausar lectura</button>
  <button id="btn-chatgpt" disabled>💬 Resumir PDF cargado</button>
  <button id="btn-resumen-rapido" disabled>⚡ Resumen rápido</button>
  <label style="margin-left:12px;"><input type="checkbox" id="voice-toggle" checked> Activar modo voz</label>
  <div id="loading-indicator" style="margin-top:12px;color:#f8fafc;font-style:italic;"></div>
  <div id="realtime-status" style="margin-top:8px;color:#a3e635;font-style:italic;">Chat en vivo conectado a OpenAI streaming.</div>

  <div id="chat" style="margin-top:18px;">
    <div id="mensajes" style="background:#0f172a;padding:12px;border-radius:8px;min-height:200px;color:#e6eef8;overflow:auto;"></div>
    <div style="display:flex;margin-top:8px;gap:8px;align-items:center;">
      <input id="input-chat" placeholder="Escribe un mensaje o pide que resuma/lea el PDF" style="flex:1;padding:10px;border-radius:6px;border:1px solid #ccc;">
      <button id="btn-voz-chat" type="button">🎙️ Hablar</button>
      <button id="send-chat" type="button">Enviar</button>
    </div>
    <div id="voice-status" style="margin-top:8px;color:#94a3b8;font-size:0.95rem;">Presiona 🎙️ para dictar tu mensaje por voz.</div>
  </div>
</section>
</main>

<script src="script_chat.js"></script>
</body>
</html>