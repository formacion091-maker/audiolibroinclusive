let idiomaActual = 'es-ES';

function hablarBienvenida(){
    const mensaje = new SpeechSynthesisUtterance('Bienvenido a la plataforma inclusiva de audiolibros');
    mensaje.lang = idiomaActual;
    speechSynthesis.speak(mensaje);
}

function leerPagina(){
    const texto = document.body.innerText;
    const voz = new SpeechSynthesisUtterance(texto);
    voz.lang = idiomaActual;
    speechSynthesis.speak(voz);
}

function activarModoOscuro(){
    document.body.classList.toggle('dark');
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
    const libros = document.querySelectorAll('.local-libros .libro');

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
            resultados.innerHTML = '<p>Mostrando todos los audiolibros disponibles en la página.</p>';
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
});