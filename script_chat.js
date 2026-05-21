// script_chat.js

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function mostrarMensajeSistema(texto) {
  const mensajes = document.getElementById('mensajes');
  const div = document.createElement('div');
  div.textContent = texto;
  div.style.margin = '8px 0';
  div.style.color = '#94a3b8';
  div.style.fontStyle = 'italic';
  mensajes.appendChild(div);
  mensajes.scrollTop = mensajes.scrollHeight;
}

async function listarLibros() {
  const res = await fetch('libros_list.php');
  const libros = await res.json();
  const sel = document.getElementById('select-libro');
  sel.innerHTML = '';
  libros.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.archivo;
    opt.textContent = l.titulo;
    sel.appendChild(opt);
  });
}

async function extraerTextoPDF(url) {
  // usa pdf.js para extraer texto completo
  const loadingTask = pdfjsLib.getDocument(url);
  const pdf = await loadingTask.promise;
  let texto = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    texto += strings.join(' ') + '\n\n';
  }
  return texto;
}

function hablar(text) {
  if (!('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.92;
  utter.lang = 'es-ES';
  // seleccionar voz preferida si existe
  const voices = speechSynthesis.getVoices();
  const pref = voices.find(v => v.lang.startsWith('es')) || voices[0];
  if (pref) utter.voice = pref;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

async function enviarChat(message, system="Eres un asistente que ayuda a leer y resumir libros PDF en español."){
  const mensajes = document.getElementById('mensajes');
  const divUser = document.createElement('div'); divUser.textContent = 'Tú: ' + message; divUser.style.margin='8px 0'; mensajes.appendChild(divUser);
  mensajes.scrollTop = mensajes.scrollHeight;

  const res = await fetch('api_chat.php', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({message, system})
  });
  const data = await res.json();
  let content = '';
  if (data && data.choices && data.choices[0] && data.choices[0].message) {
    content = data.choices[0].message.content;
  } else if (data && data.error) {
    content = 'Error: ' + data.error;
  } else {
    content = JSON.stringify(data);
  }

  const divBot = document.createElement('div'); divBot.textContent = 'Asistente: ' + content; divBot.style.margin='8px 0'; divBot.style.fontWeight='bold'; mensajes.appendChild(divBot);
  mensajes.scrollTop = mensajes.scrollHeight;

  const voiceOn = document.getElementById('voice-toggle').checked;
  if (voiceOn) hablar(content);
}

async function cargarLibroSeleccionado(archivo) {
  if (!archivo) return;
  mostrarMensajeSistema('Cargando el PDF seleccionado...');
  document.getElementById('btn-leer').disabled = true;
  document.getElementById('btn-chatgpt').disabled = true;
  const url = 'libros/' + archivo;
  window._lastExtractedText = await extraerTextoPDF(url);
  document.getElementById('btn-leer').disabled = false;
  document.getElementById('btn-chatgpt').disabled = false;
  mostrarMensajeSistema('PDF cargado y listo para leer. Puedes usar Leer en voz alta o Enviar a ChatGPT.');
  if (window._lastExtractedText.length > 200) {
    mostrarMensajeSistema('Texto extraído: ' + window._lastExtractedText.slice(0,200) + '...');
  } else {
    mostrarMensajeSistema('Texto extraído: ' + window._lastExtractedText);
  }
  return window._lastExtractedText;
}

// Event handlers
window.addEventListener('load', async ()=>{
  await listarLibros();
  const parametroPdf = getQueryParam('pdf');
  if (parametroPdf) {
    const select = document.getElementById('select-libro');
    if ([...select.options].some(o => o.value === parametroPdf)) {
      select.value = parametroPdf;
      await cargarLibroSeleccionado(parametroPdf);
    } else {
      mostrarMensajeSistema('No se encontró el PDF solicitado: ' + parametroPdf);
    }
  }

  document.getElementById('btn-cargar').addEventListener('click', async ()=>{
    const archivo = document.getElementById('select-libro').value;
    if (!archivo) return alert('Selecciona un libro');
    await cargarLibroSeleccionado(archivo);
  });

  document.getElementById('btn-leer').addEventListener('click', ()=>{
    if (!window._lastExtractedText) return alert('Cargue el libro primero');
    hablar(window._lastExtractedText);
  });

  document.getElementById('btn-chatgpt').addEventListener('click', async ()=>{
    if (!window._lastExtractedText) return alert('Cargue el libro primero');
    const textoParaIA = window._lastExtractedText.length > 11000
      ? window._lastExtractedText.slice(0,11000) + '\n\n[Texto truncado para que la IA pueda procesarlo]'
      : window._lastExtractedText;
    const prompt = 'Lee en voz alta o resume el contenido siguiente, mantén un tono claro y pausado:\n\n' + textoParaIA;
    await enviarChat(prompt);
  });

  document.getElementById('send-chat').addEventListener('click', async ()=>{
    const msg = document.getElementById('input-chat').value.trim();
    if (!msg) return;
    await enviarChat(msg);
    document.getElementById('input-chat').value = '';
  });

});