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
    if (!SpeechRecognition) {
        alert('Tu navegador no soporta búsqueda por voz. Usa el teclado para buscar.');
        return;
    }

    const reconocimiento = new SpeechRecognition();
    reconocimiento.lang = idiomaActual;
    reconocimiento.interimResults = false;
    reconocimiento.maxAlternatives = 1;
    reconocimiento.continuous = false;

    const resultados = document.getElementById('resultados');
    if (resultados) resultados.innerHTML = '<p>Escuchando tu voz... por favor habla ahora.</p>';

    reconocimiento.start();

    reconocimiento.onresult = function(event){
        const texto = event.results[0][0].transcript;
        const input = document.getElementById('busqueda');
        if (input) input.value = texto;
        buscarGoogleLibros();
    };

    reconocimiento.onerror = function(event){
        if (resultados) resultados.innerHTML = '<p>No se pudo reconocer la voz. Intenta de nuevo usando el botón de búsqueda o el teclado.</p>';
        console.error('Speech recognition error:', event.error);
    };

    reconocimiento.onend = function(){
        if (resultados && !document.getElementById('busqueda').value.trim()) {
            resultados.innerHTML = '<p>La búsqueda por voz terminó. Escribe o habla para buscar audiolibros.</p>';
        }
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

    const googleBooksUrl = `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(consulta + ' audiolibro')}`;
    if (!navigator.onLine) {
        if (resultados) {
            resultados.innerHTML = `
                <p>Parece que no estás conectado a internet. Revisa tu conexión y vuelve a intentar.</p>
                <p>También puedes abrir la búsqueda directamente en Google Books:</p>
                <p><a href="${googleBooksUrl}" target="_blank" rel="noopener">Abrir búsqueda en Google Books</a></p>
            `;
        }
        return;
    }

    try {
        const respuesta = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(consulta + ' audiobook')}&printType=books&maxResults=12`,
            { mode: 'cors' }
        );

        if (!respuesta.ok) {
            throw new Error(`Error en la búsqueda: ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        mostrarResultadosGoogle(datos, googleBooksUrl);
    } catch (err) {
        if (resultados) {
            resultados.innerHTML = `
                <p>No se pudo completar la búsqueda automáticamente. Revisa tu conexión e inténtalo de nuevo.</p>
                <p>Si el problema persiste, abre la búsqueda directamente en Google Books:</p>
                <p><a href="${googleBooksUrl}" target="_blank" rel="noopener">Abrir búsqueda en Google Books</a></p>
            `;
        }
        console.error(err);
    }
}

function mostrarResultadosGoogle(datos, fallbackUrl) {
    const resultados = document.getElementById('resultados');
    if (!resultados) return;

    if (!datos.items || datos.items.length === 0) {
        resultados.innerHTML = `
            <p>No se encontraron resultados de audiolibros en Google.</p>
            <p>Prueba abrir la búsqueda directamente en Google Books:</p>
            <p><a href="${fallbackUrl}" target="_blank" rel="noopener">Abrir búsqueda en Google Books</a></p>
        `;
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
                buscarGoogleLibros();
            }
        });
    }
});