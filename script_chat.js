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

function cargarPdfJs() {
  if (window.pdfjsLib) return Promise.resolve();
  const sources = [
    'pdfjs/pdf.min.js',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.min.js'
  ];
  return new Promise((resolve, reject) => {
    let index = 0;
    function cargarSiguiente() {
      if (index >= sources.length) {
        reject(new Error('No se pudo cargar la librería pdf.js desde los orígenes disponibles'));
        return;
      }
      const script = document.createElement('script');
      script.src = sources[index++];
      script.onload = () => {
        if (window.pdfjsLib) {
          resolve();
        } else {
          cargarSiguiente();
        }
      };
      script.onerror = () => cargarSiguiente();
      document.head.appendChild(script);
    }
    cargarSiguiente();
  });
}

async function extraerTextoPDF(url) {
  await cargarPdfJs();
  if (!window.pdfjsLib) {
    throw new Error('pdf.js no está cargado');
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.worker.min.js';
  const loadingTask = pdfjsLib.getDocument(url);
  const pdf = await loadingTask.promise;
  let texto = '';
  const maxPages = Math.min(pdf.numPages, 20);
  for (let i = 1; i <= maxPages; i++) {
    mostrarMensajeSistema(`Extrayendo página ${i} de ${pdf.numPages}...`);
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    texto += strings.join(' ') + '\n\n';
  }
  if (pdf.numPages > maxPages) {
    mostrarMensajeSistema(`PDF grande: se extrajeron las primeras ${maxPages} páginas para cargar rápido.`);
    texto += '\n\n[El PDF completo no se extrajo para mantener el tiempo de carga rápido.]';
  }
  return texto;
}

let currentUtterance = null;
let isPaused = false;
let pausedText = '';
let pausedOffset = 0;

function hablar(text) {
  if (!('speechSynthesis' in window)) return;
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  isPaused = false;
  pausedText = text;
  pausedOffset = 0;
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = 0.92;
  currentUtterance.lang = 'es-ES';
  const voices = speechSynthesis.getVoices();
  const pref = voices.find(v => v.lang.startsWith('es')) || voices[0];
  if (pref) currentUtterance.voice = pref;
  currentUtterance.onend = () => {
    document.getElementById('btn-pause').textContent = '⏸ Pausar lectura';
    document.getElementById('btn-pause').disabled = true;
    currentUtterance = null;
    isPaused = false;
    pausedOffset = 0;
  };
  currentUtterance.onboundary = (event) => {
    if (event.name === 'word') {
      pausedOffset = event.charIndex;
    }
  };
  speechSynthesis.speak(currentUtterance);
}

function togglePause() {
  if (!('speechSynthesis' in window)) return;
  const pauseBtn = document.getElementById('btn-pause');
  if (speechSynthesis.speaking && !speechSynthesis.paused) {
    speechSynthesis.pause();
    isPaused = true;
    pauseBtn.textContent = '▶ Continuar lectura';
  } else if (speechSynthesis.paused) {
    speechSynthesis.resume();
    isPaused = false;
    pauseBtn.textContent = '⏸ Pausar lectura';
  }
}

function stopReading() {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  currentUtterance = null;
  isPaused = false;
  pausedOffset = 0;
  document.getElementById('btn-pause').textContent = '⏸ Pausar lectura';
}

function mostrarCargando(texto) {
  const indicador = document.getElementById('loading-indicator');
  if (indicador) indicador.textContent = texto;
}

function ocultarCargando() {
  mostrarCargando('');
}

async function enviarChat(message, system="Eres un asistente que ayuda a leer y resumir libros PDF en español."){
  const mensajes = document.getElementById('mensajes');
  const divUser = document.createElement('div'); divUser.textContent = 'Tú: ' + message; divUser.style.margin='8px 0'; mensajes.appendChild(divUser);
  mensajes.scrollTop = mensajes.scrollHeight;

  const payload = {message, system};
  if (window._lastExtractedText) {
    payload.pdfText = window._lastExtractedText.length > 11000
      ? window._lastExtractedText.slice(0, 11000)
      : window._lastExtractedText;
  }

  const res = await fetch('api_chat.php', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = { error: 'Respuesta inválida del servidor: ' + err.message };
  }

  let content = '';
  if (data && data.choices && data.choices[0] && data.choices[0].message) {
    content = data.choices[0].message.content;
  } else if (data && data.error) {
    const errorValue = typeof data.error === 'object' ? JSON.stringify(data.error) : data.error;
    content = 'Error: ' + errorValue;
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
  mostrarCargando('Por favor espera, la carga puede tardar unos segundos.');
  document.getElementById('btn-leer').disabled = true;
  document.getElementById('btn-chatgpt').disabled = true;
  document.getElementById('btn-resumen-rapido').disabled = true;
  document.getElementById('btn-pause').disabled = true;
  const url = 'libros/' + encodeURIComponent(archivo);
  try {
    window._lastExtractedText = await extraerTextoPDF(url);
    document.getElementById('btn-leer').disabled = false;
    document.getElementById('btn-chatgpt').disabled = false;
    document.getElementById('btn-resumen-rapido').disabled = false;
    document.getElementById('btn-pause').disabled = false;
    mostrarMensajeSistema('PDF cargado y listo para leer. Puedes usar Leer en voz alta, Resumen rápido o Resumir PDF cargado.');
    if (window._lastExtractedText.length > 200) {
      mostrarMensajeSistema('Texto extraído: ' + window._lastExtractedText.slice(0,200) + '...');
    } else {
      mostrarMensajeSistema('Texto extraído: ' + window._lastExtractedText);
    }
  } catch (error) {
    const mensajeError = 'No se pudo cargar el PDF: ' + (error.message || error);
    mostrarMensajeSistema(mensajeError);
    alert(mensajeError);
    document.getElementById('btn-leer').disabled = true;
    document.getElementById('btn-chatgpt').disabled = true;
  } finally {
    ocultarCargando();
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
    document.getElementById('btn-pause').disabled = false;
  });

  document.getElementById('btn-pause').addEventListener('click', ()=>{
    togglePause();
  });

  document.getElementById('btn-chatgpt').addEventListener('click', async ()=>{
    if (!window._lastExtractedText) return alert('Cargue el libro primero');
    const prompt = 'Resume en español el contenido del libro cargado. Usa la información del PDF extraído para crear un resumen claro, breve y ordenado.';
    await enviarChat(prompt);
  });

  document.getElementById('btn-resumen-rapido').addEventListener('click', async ()=>{
    if (!window._lastExtractedText) return alert('Cargue el libro primero');
    const prompt = 'Genera un resumen rápido en español del libro cargado. Resume en pocas frases los puntos más importantes del contenido.';
    await enviarChat(prompt);
  });

  document.getElementById('send-chat').addEventListener('click', async ()=>{
    const msg = document.getElementById('input-chat').value.trim();
    if (!msg) return;
    await enviarChat(msg);
    document.getElementById('input-chat').value = '';
  });

});