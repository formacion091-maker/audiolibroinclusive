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
  <button id="btn-chatgpt" disabled>💬 Enviar a ChatGPT</button>
  <label style="margin-left:12px;"><input type="checkbox" id="voice-toggle" checked> Activar modo voz</label>
  <div id="loading-indicator" style="margin-top:12px;color:#f8fafc;font-style:italic;"></div>

  <div id="chat" style="margin-top:18px;">
    <div id="mensajes" style="background:#0f172a;padding:12px;border-radius:8px;min-height:200px;color:#e6eef8;overflow:auto;"></div>
    <div style="display:flex;margin-top:8px;">
      <input id="input-chat" placeholder="Escribe un mensaje o pide que resuma/lea el PDF" style="flex:1;padding:10px;border-radius:6px;border:1px solid #ccc;">
      <button id="send-chat">Enviar</button>
    </div>
  </div>
</section>
</main>

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.172/pdf.min.js"></script>
<script src="script_chat.js"></script>
</body>
</html>