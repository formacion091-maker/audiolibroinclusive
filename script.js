let idiomaActual = 'es-ES';

function hablar(texto) {
    if (!('speechSynthesis' in window)) {
        return;
    }
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = idiomaActual;
    const voces = speechSynthesis.getVoices();
    const vozSeleccionada = voces.find(v => v.lang.startsWith('es')) || voces[0];
    if (vozSeleccionada) utter.voice = vozSeleccionada;
    utter.rate = 0.92;
    speechSynthesis.speak(utter);
}

function hablarBienvenida(){
    const mensaje = 'Bienvenido a la plataforma inclusiva de audiolibros. ' +
        'Por favor, elige el libro que deseas escuchar y presiona el botón Leer PDF. ' +
        'También puedes buscar por voz usando el botón que dice Buscar por Voz.';
    actualizarMensajeInteractivo('Seleccione el libro que desea escuchar y presione Leer PDF.');
    hablar(mensaje);
}

function leerPagina(){
    const texto = document.body.innerText;
    actualizarMensajeInteractivo('Se está leyendo el contenido visible de la página.');
    hablar(texto);
}

function activarModoOscuro(){
    document.body.classList.toggle('dark');
}

function actualizarMensajeInteractivo(texto) {
    const mensaje = document.getElementById('mensaje-interactivo');
    if (mensaje) {
        mensaje.innerText = texto;
    }
}

function pedirLibro(){
    const mensaje = '¿Qué libro deseas leer hoy? Selecciona un PDF y pulsa el botón Leer PDF para que la página comience a leerlo en voz alta.';
    actualizarMensajeInteractivo('¿Qué libro desea leer? Seleccione un PDF y pulse Leer PDF.');
    hablar(mensaje);
}

function cambiarIdioma(idioma){
    idiomaActual = idioma;
    const mensaje = new SpeechSynthesisUtterance('Idioma cambiado');
    mensaje.lang = idioma;
    speechSynthesis.speak(mensaje);
}

function actualizarEstadoComandoVoz(mensaje) {
    const status = document.getElementById('voice-command-status');
    if (status) {
        status.innerText = mensaje;
    }
}

function activarBusquedaVoz(){
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const resultados = document.getElementById('resultados');

    if (!SpeechRecognition) {
        alert('Tu navegador no soporta búsqueda por voz. Usa el teclado para buscar.');
        return;
    }

    const reconocimiento = new SpeechRecognition();
    reconocimiento.lang = idiomaActual;
    reconocimiento.interimResults = false;
    reconocimiento.maxAlternatives = 1;
    reconocimiento.continuous = false;

    if (resultados) resultados.innerHTML = '<p>Escuchando tu voz... por favor habla ahora.</p>';
    reconocimiento.start();

    reconocimiento.onresult = function(event){
        const texto = event.results[0][0].transcript;
        const input = document.getElementById('busqueda');
        if (input) input.value = texto;
        buscarLibrosLocal();
    };

    reconocimiento.onerror = function(event){
        if (resultados) resultados.innerHTML = '<p>No se pudo reconocer la voz. Verifica el micrófono y permite el acceso.</p>';
        console.error('Speech recognition error:', event.error);
    };

    reconocimiento.onend = function(){
        if (resultados && !document.getElementById('busqueda').value.trim()) {
            resultados.innerHTML = '<p>La búsqueda por voz terminó. Escribe o vuelve a intentar con el botón.</p>';
        }
    };
}

function activarComandoVoz() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    actualizarEstadoComandoVoz('Preparado para recibir una instrucción. Habla ahora.');

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = idiomaActual;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.start();

        recognition.onresult = function(event) {
            const texto = event.results[0][0].transcript;
            procesarComandoVoz(texto);
        };

        recognition.onerror = function(event) {
            actualizarEstadoComandoVoz('No se pudo reconocer la voz. Intenta de nuevo.');
            console.error('Speech recognition error:', event.error);
        };

        recognition.onend = function() {
            if (!document.getElementById('busqueda').value.trim()) {
                actualizarEstadoComandoVoz('Presiona 🗣️ Orden por Voz para intentarlo de nuevo.');
            }
        };
        return;
    }

    if (!navigator.mediaDevices || !window.MediaRecorder) {
        alert('Tu navegador no soporta reconocimiento de voz ni grabación de audio. Usa el teclado para escribir la instrucción.');
        return;
    }

    grabarAudioComando();
}

async function grabarAudioComando() {
    actualizarEstadoComandoVoz('Solicitando permiso de micrófono...');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.ondataavailable = event => {
            if (event.data && event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        recorder.onstop = async () => {
            stream.getTracks().forEach(track => track.stop());
            if (!chunks.length) {
                actualizarEstadoComandoVoz('No se detectó audio. Intenta nuevamente.');
                return;
            }
            actualizarEstadoComandoVoz('Transcribiendo tu orden...');
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio', blob, 'voz.webm');
            try {
                const response = await fetch('voice_transcribe.php', { method: 'POST', body: formData });
                const data = await response.json();
                if (response.ok && data.transcript) {
                    procesarComandoVoz(data.transcript);
                } else {
                    actualizarEstadoComandoVoz(data.error || 'No se pudo transcribir la orden.');
                }
            } catch (error) {
                actualizarEstadoComandoVoz('Error enviando el audio al servidor.');
                console.error('transcription error', error);
            }
        };

        recorder.onerror = event => {
            actualizarEstadoComandoVoz('Error de grabación de audio.');
            console.error('recorder error', event.error);
        };

        recorder.start();
        actualizarEstadoComandoVoz('Grabando tu instrucción. Habla ahora.');
        setTimeout(() => {
            if (recorder.state === 'recording') {
                recorder.stop();
            }
        }, 7000);
    } catch (error) {
        actualizarEstadoComandoVoz('No se pudo acceder al micrófono. Verifica permisos.');
        console.error('microphone error', error);
    }
}

function procesarComandoVoz(texto) {
    if (!texto) {
        actualizarEstadoComandoVoz('No se reconoció ninguna instrucción. Intenta de nuevo.');
        return;
    }

    const comando = texto.toLowerCase();
    actualizarEstadoComandoVoz('Instrucción recibida: "' + texto + '"');

    const buscarMatch = comando.match(/buscar|encuentra|muestra|muéstrame/);
    const leerMatch = comando.match(/leer|lee|abre|abre el libro|quiero leer/);
    const pdfMatch = comando.match(/pdf|libro|texto/);

    if (buscarMatch && comando.includes('libro')) {
        const query = comando.replace(/^(buscar|encuentra|muestra|muéstrame)\s*/i, '').trim();
        const input = document.getElementById('busqueda');
        if (input) input.value = query;
        buscarLibrosLocal();
        actualizarEstadoComandoVoz('Buscando: ' + query);
        return;
    }

    if (leerMatch && pdfMatch) {
        const libro = encontrarLibroPorComando(comando);
        if (libro) {
            const url = libro.dataset.pdf;
            if (url) {
                actualizarEstadoComandoVoz('Orden recibida. Leyendo el libro ahora.');
                leerPdf(url);
                return;
            }
        }
        actualizarEstadoComandoVoz('No encontré el libro en la instrucción. Dime el nombre exacto o usa "Buscar" primero.');
        return;
    }

    if (buscarMatch) {
        const query = comando.replace(/^(buscar|encuentra|muestra|muéstrame)\s*/i, '').trim();
        const input = document.getElementById('busqueda');
        if (input) input.value = query;
        buscarLibrosLocal();
        actualizarEstadoComandoVoz('Buscando: ' + query);
        return;
    }

    actualizarEstadoComandoVoz('No entendí la instrucción. Di algo como "Buscar libro de cuentos" o "Leer el libro de inclusión".');
}

function encontrarLibroPorComando(comando) {
    const libros = document.querySelectorAll('.libro-pdf');
    let mejorCoincidencia = null;
    let mayorPuntaje = 0;

    libros.forEach(libro => {
        const titulo = (libro.dataset.titulo || '').toLowerCase();
        const descripcion = (libro.dataset.descripcion || '').toLowerCase();
        let puntaje = 0;
        if (!titulo) return;
        if (comando.includes(titulo)) puntaje += 10;
        if (titulo.split(' ').some(palabra => comando.includes(palabra))) puntaje += 3;
        if (descripcion && descripcion.split(' ').some(palabra => comando.includes(palabra))) puntaje += 1;
        if (puntaje > mayorPuntaje) {
            mayorPuntaje = puntaje;
            mejorCoincidencia = libro;
        }
    });

    return mayorPuntaje >= 3 ? mejorCoincidencia : null;
}

function buscarLibrosLocal(){
    const input = document.getElementById('busqueda');
    const consulta = input ? input.value.trim().toLowerCase() : '';
    const resultados = document.getElementById('resultados');
    const libros = document.querySelectorAll('.contenedor-libros .libro');

    if (!libros.length) return;

    let encontrados = 0;

    libros.forEach(libro => {
        const titulo = (libro.dataset.titulo || '').toLowerCase();
        const autor = (libro.dataset.autor || '').toLowerCase();
        const descripcion = (libro.dataset.descripcion || '').toLowerCase();
        const coincide = !consulta || titulo.includes(consulta) || autor.includes(consulta) || descripcion.includes(consulta);

        libro.style.display = coincide ? 'block' : 'none';
        if (coincide) encontrados += 1;
    });

    if (resultados) {
        if (!consulta) {
            resultados.innerHTML = '<p>Mostrando todos los libros disponibles en la biblioteca.</p>';
        } else if (encontrados === 0) {
            resultados.innerHTML = '<p>No se encontraron libros con ese nombre. Prueba otra búsqueda o usa la sección sin conexión.</p>';
        } else {
            resultados.innerHTML = `<p>Se encontraron ${encontrados} libro(s) que coinciden con "${consulta}".</p>`;
        }
    }
}

function mostrarOffline(){
    const offlineSection = document.querySelector('.offline-biblioteca');
    if (offlineSection) {
        offlineSection.scrollIntoView({ behavior: 'smooth' });
    }
}

async function extraerTextoPdf(url) {
    if (!window.pdfjsLib) {
        throw new Error('pdf.js no está cargado');
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.172/pdf.worker.min.js';
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    let texto = '';
    for (let pagina = 1; pagina <= pdf.numPages; pagina++) {
        const page = await pdf.getPage(pagina);
        const content = await page.getTextContent();
        const items = content.items.map(item => item.str);
        texto += items.join(' ') + '\n\n';
    }
    return texto.trim();
}

function hablarTexto(texto) {
    if (!('speechSynthesis' in window)) {
        alert('El navegador no soporta síntesis de voz.');
        return;
    }
    speechSynthesis.cancel();
    const partes = texto.match(/[^\.\!\?]+[\.\!\?]+[\])'"“”’]*|.+$/g) || [texto];
    let indice = 0;

    const voz = () => {
        if (indice >= partes.length) return;
        const mensaje = new SpeechSynthesisUtterance(partes[indice].trim());
        mensaje.lang = idiomaActual;
        const voces = speechSynthesis.getVoices();
        const seleccion = voces.find(v => v.lang.startsWith('es')) || voces[0];
        if (seleccion) mensaje.voice = seleccion;
        mensaje.rate = 0.92;
        mensaje.onend = () => {
            indice += 1;
            if (indice < partes.length) {
                voz();
            }
        };
        speechSynthesis.speak(mensaje);
    };
    voz();
}

async function leerPdf(url) {
    return (async () => {
        try {
            const boton = document.activeElement;
            if (boton && boton.tagName === 'BUTTON') boton.disabled = true;
            actualizarMensajeInteractivo('Cargando PDF y preparando la lectura. Por favor espera.');
            hablar('Cargando el libro. Por favor espera un momento.');
            const texto = await extraerTextoPdf(url);
            if (!texto) {
                const mensajeError = 'No se pudo extraer texto del PDF.';
                actualizarMensajeInteractivo(mensajeError);
                hablar(mensajeError);
                if (boton && boton.tagName === 'BUTTON') boton.disabled = false;
                return;
            }
            hablarTexto(texto);
            if (boton && boton.tagName === 'BUTTON') boton.disabled = false;
        } catch (error) {
            const mensajeError = 'Error leyendo PDF: ' + error.message;
            actualizarMensajeInteractivo(mensajeError);
            hablar(mensajeError);
            console.error(error);
            const boton = document.activeElement;
            if (boton && boton.tagName === 'BUTTON') boton.disabled = false;
        }
    })();
}

function cargarVoces() {
    const voces = speechSynthesis.getVoices();
    if (!voces.length) {
        speechSynthesis.addEventListener('voiceschanged', () => {
            hablar('Voz disponible. Listo para leer el PDF.');
        }, { once: true });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    cargarVoces();
    const input = document.getElementById('busqueda');
    if (input) {
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                buscarLibrosLocal();
            }
        });
    }
    buscarLibrosLocal();
    hablarBienvenida();
});