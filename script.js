let idiomaActual = 'es-ES';

function hablarBienvenida(){
    const mensaje = new SpeechSynthesisUtterance(
        'Bienvenido a la plataforma inclusiva de audiolibros'
    );
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
    if (!SpeechRecognition) {
        alert('Tu navegador no soporta búsqueda por voz. Usa el teclado para buscar.');
        return;
    }

    const reconocimiento = new SpeechRecognition();
    reconocimiento.lang = idiomaActual;
    reconocimiento.interimResults = false;
    reconocimiento.maxAlternatives = 1;

    reconocimiento.start();
    reconocimiento.onresult = function(event){
        const texto = event.results[0][0].transcript;
        const input = document.getElementById('busqueda');
        input.value = texto;
        buscarGoogleLibros();
    };
    reconocimiento.onerror = function(){
        alert('No se pudo reconocer la voz. Intenta de nuevo.');
    };
}

async function buscarGoogleLibros(){
    const input = document.getElementById('busqueda');
    const consulta = input ? input.value.trim() : '';
    const resultados = document.getElementById('resultados');

    if (!consulta) {
        if (resultados) resultados.innerHTML = '<p>Escribe el título o autor de un audiolibro para buscar en Google.</p>';
        return;
    }

    if (resultados) resultados.innerHTML = '<p>Buscando audiolibros en Google...</p>';

    try {
        const respuesta = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(consulta + ' audiobook')}&printType=books&maxResults=12`
        );

        if (!respuesta.ok) {
            throw new Error('Error en la búsqueda');
        }

        const datos = await respuesta.json();
        mostrarResultadosGoogle(datos);
    } catch (err) {
        if (resultados) resultados.innerHTML = '<p>No se pudo completar la búsqueda. Revisa tu conexión e inténtalo de nuevo.</p>';
        console.error(err);
    }
}

function mostrarResultadosGoogle(datos){
    const resultados = document.getElementById('resultados');
    if (!resultados) return;

    if (!datos.items || datos.items.length === 0) {
        resultados.innerHTML = '<p>No se encontraron resultados de audiolibros en Google.</p>';
        return;
    }

    resultados.innerHTML = '';
    datos.items.forEach(item => {
        const info = item.volumeInfo || {};
        const titulo = info.title || 'Título no disponible';
        const autor = (info.authors || ['Autor no disponible']).join(', ');
        const descripcion = info.description ? info.description.substring(0, 240) + '...' : 'Sin descripción.';
        const enlace = info.previewLink || info.infoLink || '#';

        const tarjeta = document.createElement('div');
        tarjeta.className = 'resultado';
        tarjeta.innerHTML = `
            <h3>${titulo}</h3>
            <p><strong>Autor:</strong> ${autor}</p>
            <p>${descripcion}</p>
            <p><a href="${enlace}" target="_blank" rel="noopener">Ver en Google Books</a></p>
        `;
        resultados.appendChild(tarjeta);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('busqueda');
    if (input) {
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                buscarGoogleLibros();
            }
        });
    }
});