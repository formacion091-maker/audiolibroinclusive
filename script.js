let idiomaActual = 'es-ES';

function hablarBienvenida(){

    let mensaje = new SpeechSynthesisUtterance(
        "Bienvenido a la plataforma inclusiva de audiolibros"
    );

    mensaje.lang = idiomaActual;

    speechSynthesis.speak(mensaje);
}

function leerPagina(){

    let texto = document.body.innerText;

    let voz = new SpeechSynthesisUtterance(texto);

    voz.lang = idiomaActual;

    speechSynthesis.speak(voz);
}

function activarModoOscuro(){
    document.body.classList.toggle("dark");
}

function cambiarIdioma(idioma){
    idiomaActual = idioma;

    let mensaje = new SpeechSynthesisUtterance(
        "Idioma cambiado"
    );

    mensaje.lang = idioma;

    speechSynthesis.speak(mensaje);
}

function activarBusquedaVoz(){

    const reconocimiento = new webkitSpeechRecognition();

    reconocimiento.lang = idiomaActual;

    reconocimiento.start();

    reconocimiento.onresult = function(event){

        let texto = event.results[0][0].transcript;

        document.getElementById("busqueda").value = texto;
    }
    window.onload = () => {

    hablarBienvenida();

    document.body.style.opacity = "0";

    setTimeout(()=>{
        document.body.style.transition = "1s";
        document.body.style.opacity = "1";
    },200);
}
}