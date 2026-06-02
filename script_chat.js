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

// Simple, reliable speech synthesis with pause/resume
let currentUtterance = null;
let isSpeaking = false;

function hablar(text) {
  if (!('speechSynthesis' in window)) {
    alert('Tu navegador no soporta síntesis de voz');
    return;
  }
  
  // Cancelar lectura anterior
  speechSynthesis.cancel();
  isSpeaking = false;
  
  // Crear nueva utterance
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = 0.92;
  currentUtterance.lang = 'es-ES';
  
  // Seleccionar voz en español si existe
  const voices = speechSynthesis.getVoices();
  const prefVoice = voices.find(v => v.lang.startsWith('es')) || voices[0];
  if (prefVoice) currentUtterance.voice = prefVoice;
  
  // Eventos
  currentUtterance.onstart = () => {
    isSpeaking = true;
    const btn = document.getElementById('btn-pause');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⏸ Pausar lectura';
    }
  };
  
  currentUtterance.onend = () => {
    isSpeaking = false;
    const btn = document.getElementById('btn-pause');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏸ Pausar lectura';
    }
  };
  
  currentUtterance.onerror = () => {
    isSpeaking = false;
    const btn = document.getElementById('btn-pause');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏸ Pausar lectura';
    }
  };
  
  // Iniciar lectura
  speechSynthesis.speak(currentUtterance);
}

function togglePause() {
  if (!('speechSynthesis' in window)) return;
  
  const btn = document.getElementById('btn-pause');
  if (!btn) return;
  
  // Si está hablando y no en pausa
  if (speechSynthesis.speaking && !speechSynthesis.paused) {
    speechSynthesis.pause();
    btn.textContent = '▶ Continuar lectura';
  } 
  // Si está en pausa
  else if (speechSynthesis.paused) {
    speechSynthesis.resume();
    btn.textContent = '⏸ Pausar lectura';
  }
}

function stopReading() {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  isSpeaking = false;
  currentUtterance = null;
  const btn = document.getElementById('btn-pause');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏸ Pausar lectura';
  }
}

function mostrarCargando(texto) {
  const indicador = document.getElementById('loading-indicator');
  if (indicador) indicador.textContent = texto;
}

function ocultarCargando() {
  mostrarCargando('');
}

let speechQueue = [];
let speechActive = false;
let speechStreamBuffer = '';

function resetSpeechStream() {
  speechQueue = [];
  speechActive = false;
  speechStreamBuffer = '';
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
}

function speakNextQueuedText() {
  if (!speechQueue.length) {
    speechActive = false;
    return;
  }
  speechActive = true;
  const text = speechQueue.shift();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'es-ES';
  const voces = speechSynthesis.getVoices();
  const voz = voces.find(v => v.lang.startsWith('es')) || voces[0];
  if (voz) utter.voice = voz;
  utter.rate = 0.92;
  utter.onend = speakNextQueuedText;
  speechSynthesis.speak(utter);
}

function enqueueSpeech(text) {
  if (!text || !('speechSynthesis' in window)) return;
  if (!document.getElementById('voice-toggle').checked) return;
  speechQueue.push(text);
  if (!speechActive) {
    speakNextQueuedText();
  }
}

function handleStreamDelta(delta) {
  speechStreamBuffer += delta;
  const sentences = speechStreamBuffer.match(/[^\.\!\?]+[\.\!\?]+[\])'"“”’]*|.+$/g);
  if (!sentences) return;

  let complete = sentences;
  if (!/[\.\!\?]$/.test(sentences[sentences.length - 1].trim())) {
    complete = sentences.slice(0, -1);
    speechStreamBuffer = sentences[sentences.length - 1];
  } else {
    speechStreamBuffer = '';
  }

  complete.forEach(part => {
    const text = part.trim();
    if (text) {
      enqueueSpeech(text);
    }
  });
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

  const divBot = document.createElement('div'); divBot.textContent = 'Asistente: '; divBot.style.margin='8px 0'; divBot.style.fontWeight='bold'; mensajes.appendChild(divBot);
  mensajes.scrollTop = mensajes.scrollHeight;

  resetSpeechStream();
  mostrarCargando('Conectando a OpenAI en vivo...');

  try {
    const res = await fetch('api_chat_stream.php', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error('Error del servidor: ' + errorText);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completeText = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop();

      for (const part of parts) {
        if (!part.trim()) continue;
        const line = part.trim();
        if (!line.startsWith('data: ')) continue;
        const payloadText = line.slice(6);
        let payloadData;
        try {
          payloadData = JSON.parse(payloadText);
        } catch (e) {
          continue;
        }

        if (payloadData.event === 'message') {
          completeText += payloadData.text;
          divBot.textContent = 'Asistente: ' + completeText;
          mensajes.scrollTop = mensajes.scrollHeight;
          handleStreamDelta(payloadData.text);
        }
        if (payloadData.event === 'error') {
          throw new Error(payloadData.message || 'Error en la transmisión');
        }
      }
    }

    if (buffer.trim().startsWith('data: ')) {
      const payloadText = buffer.trim().slice(6);
      let payloadData = JSON.parse(payloadText);
      if (payloadData.event === 'message') {
        completeText += payloadData.text;
        divBot.textContent = 'Asistente: ' + completeText;
        handleStreamDelta(payloadData.text);
      }
    }
  } catch (err) {
    const errorDiv = document.createElement('div');
    errorDiv.textContent = 'Error: ' + (err.message || 'Error desconocido');
    errorDiv.style.margin = '8px 0';
    errorDiv.style.color = '#f87171';
    mensajes.appendChild(errorDiv);
    mensajes.scrollTop = mensajes.scrollHeight;
  } finally {
    ocultarCargando();
  }
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