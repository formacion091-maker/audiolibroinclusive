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
    try {
        const boton = document.activeElement;
        if (boton) boton.disabled = true;
        const texto = await extraerTextoPdf(url);
        if (!texto) {
            alert('No se pudo extraer texto del PDF.');
            if (boton) boton.disabled = false;
            return;
        }
        hablarTexto(texto);
        if (boton) boton.disabled = false;
    } catch (error) {
        alert('Error leyendo PDF: ' + error.message);
        console.error(error);
        const boton = document.activeElement;
        if (boton) boton.disabled = false;
    }
}

window.addEventListener('DOMContentLoaded', () => {
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