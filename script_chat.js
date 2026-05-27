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

// Robust chunked reader to support pause/resume reliably across browsers
let readingChunks = [];
let readingIndex = 0;
let isPaused = false;
let isReading = false;

function splitIntoChunks(text, maxLen = 1200) {
  text = text.replace(/\s+/g, ' ').trim();
  if (text.length <= maxLen) return [text];
  const parts = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxLen, text.length);
    if (end < text.length) {
      // try to cut at last sentence end or space
      const sub = text.slice(start, end + 100);
      const m = sub.match(/([\.\!\?])[^\.\!\?]*$/);
      if (m && m.index) {
        end = start + m.index + 1;
      } else {
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start) end = lastSpace;
      }
    }
    parts.push(text.slice(start, end).trim());
    start = end;
  }
  return parts;
}

function speakNextChunk() {
  if (!('speechSynthesis' in window)) return;
  if (readingIndex >= readingChunks.length) {
    // finished
    isReading = false;
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) { pauseBtn.disabled = true; pauseBtn.textContent = '⏸ Pausar lectura'; }
    return;
  }
  const chunk = readingChunks[readingIndex];
  const u = new SpeechSynthesisUtterance(chunk);
  u.rate = 0.92;
  u.lang = 'es-ES';
  const voices = speechSynthesis.getVoices();
  const pref = voices.find(v => v.lang.startsWith('es')) || voices[0];
  if (pref) u.voice = pref;
  u.onend = () => {
    readingIndex++;
    if (!isPaused) speakNextChunk();
    else isReading = false;
  };
  u.onerror = () => {
    readingIndex++;
    if (!isPaused) speakNextChunk();
  };
  isReading = true;
  const pauseBtn = document.getElementById('btn-pause');
  if (pauseBtn) { pauseBtn.disabled = false; pauseBtn.textContent = '⏸ Pausar lectura'; }
  speechSynthesis.speak(u);
}

function hablar(text) {
  if (!('speechSynthesis' in window)) return;
  stopReading();
  readingChunks = splitIntoChunks(text, 1200);
  readingIndex = 0;
  isPaused = false;
  speakNextChunk();
}

function togglePause() {
  if (!('speechSynthesis' in window)) return;
  const pauseBtn = document.getElementById('btn-pause');
  if (isReading && !isPaused) {
    // Try native pause; if not supported, cancel and keep index
    try { speechSynthesis.pause(); } catch(e) { speechSynthesis.cancel(); }
    isPaused = true;
    if (pauseBtn) pauseBtn.textContent = '▶ Continuar lectura';
  } else if (isPaused) {
    // resume
    try { speechSynthesis.resume(); } catch(e) {
      // If resume not supported, continue from current index
      isPaused = false;
      speakNextChunk();
    }
    isPaused = false;
    if (pauseBtn) pauseBtn.textContent = '⏸ Pausar lectura';
  }
}

function stopReading() {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  readingChunks = [];
  readingIndex = 0;
  isPaused = false;
  isReading = false;
  const pauseBtn = document.getElementById('btn-pause');
  if (pauseBtn) { pauseBtn.disabled = true; pauseBtn.textContent = '⏸ Pausar lectura'; }
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
    payload.pdfText = window._lastExtractedText.length > 20000
      ? window._lastExtractedText.slice(0, 20000)
      : window._lastExtractedText;
  }
  if (window._lastExtractedFile) {
    payload.filename = window._lastExtractedFile;
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
    // store the filename for server-side caching
    window._lastExtractedFile = archivo;
    // send extracted text to server to cache (best-effort)
    try {
      fetch('cache_pdf.php', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({filename: archivo, text: window._lastExtractedText})
      }).then(r => r.json()).then(j=>{
        if (j && j.ok) mostrarMensajeSistema('Texto guardado en caché en servidor.');
      }).catch(()=>{});
    } catch(e) {
      // ignore caching errors
    }
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