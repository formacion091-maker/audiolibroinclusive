<?php

session_start();

include("conexion.php");

if(!isset($_SESSION['usuario'])){
    header("Location:login.php");
}

// Función para obtener libros de la carpeta audios
function obtenerLibrosCarpeta() {
    $libros = [];
    $carpetaAudios = 'audios/';

    if (is_dir($carpetaAudios)) {
        $archivos = scandir($carpetaAudios);
        foreach ($archivos as $archivo) {
            if ($archivo !== '.' && $archivo !== '..') {
                $extension = strtolower(pathinfo($archivo, PATHINFO_EXTENSION));
                if (in_array($extension, ['wav', 'mp3', 'ogg', 'm4a'])) {
                    $titulo = ucwords(str_replace(['_', '.' . $extension], [' ', ''], $archivo));
                    $tipoAudio = $extension === 'wav' ? 'audio/wav' : 'audio/mpeg';
                    $libros[] = [
                        'titulo' => $titulo,
                        'autor' => 'Biblioteca Local',
                        'descripcion' => 'Audiolibro disponible en la página',
                        'audio' => $archivo,
                        'imagen' => 'placeholder.png',
                        'tipo' => $tipoAudio,
                        'tipoLibro' => 'audio'
                    ];
                }
            }
        }
    }
    return $libros;
}

// Función para obtener libros PDF de la carpeta libros
function obtenerLibrosPDF() {
    $libros = [];
    $carpetaLibros = 'libros/';

    if (is_dir($carpetaLibros)) {
        $archivos = scandir($carpetaLibros);
        foreach ($archivos as $archivo) {
            if ($archivo !== '.' && $archivo !== '..') {
                $extension = strtolower(pathinfo($archivo, PATHINFO_EXTENSION));
                if ($extension === 'pdf') {
                    $titulo = ucwords(str_replace(['_', '.pdf'], [' ', ''], $archivo));
                    $libros[] = [
                        'titulo' => $titulo,
                        'autor' => 'Biblioteca de Libros',
                        'descripcion' => 'Libro disponible para leer en PDF',
                        'archivo' => $archivo,
                        'imagen' => 'placeholder.png',
                        'tipoLibro' => 'pdf'
                    ];
                }
            }
        }
    }
    return $libros;
}

$librosCarpeta = obtenerLibrosCarpeta();
$librosPDF = obtenerLibrosPDF();

?>

<!DOCTYPE html>
<html lang="es">
<head>

<meta charset="UTF-8">

<title>Biblioteca</title>

<link rel="stylesheet" href="estilos.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.172/pdf.min.js"></script>
<script src="script.js"></script>

</head>

<body onload="hablarBienvenida()">

<header>

<h1>🎧 Biblioteca Inclusiva</h1>

<nav>

<button onclick="leerPagina()">
🔊 Escuchar Página
</button>

<button onclick="activarBusquedaVoz()">
🎤 Buscar por Voz
</button>

<button onclick="activarModoOscuro()">
🌙 Modo Oscuro
</button>

<a href="subir_libros.php">
<button>
📥 Agregar libro
</button>
</a>

<a href="logout.php">
<button>
🚪 Salir
</button>
</a>

</nav>

</header>

<section class="hero">

<h2>Explora Miles de Audio Libros</h2>

<input type="text"
id="busqueda"
placeholder="Buscar audiolibro">
<button class="btn-buscar" onclick="buscarLibrosLocal()">🔎 Buscar audiolibro</button>
<button class="btn-buscar" onclick="mostrarOffline()">🎧 Escuchar sin conexión</button>
<div id="resultados" class="resultados"></div>

</section>

<section class="offline-biblioteca">
<h2>Opciones sin conexión</h2>
<p>Escucha estos audiolibros locales si la búsqueda en la página no tiene resultados.</p>
<div class="contenedor-libros local-libros">
    <div class="libro">
        <img src="imagenes/placeholder.png" alt="Cuentos para dormir">
        <h3>Cuentos para dormir</h3>
        <p>Autor: Voz Inclusiva</p>
        <p>Una colección local de muestras narradas disponibles directamente en la página.</p>
        <audio controls>
            <source src="audios/cuentos_para_dormir.wav" type="audio/wav">
        </audio>
    </div>
    <div class="libro">
        <img src="imagenes/placeholder.png" alt="Relatos inclusivos">
        <h3>Relatos inclusivos</h3>
        <p>Autor: Biblioteca Offline</p>
        <p>Historias accesibles desde el propio sitio para escuchar sin conexión.</p>
        <audio controls>
            <source src="audios/relatos_inclusivos.wav" type="audio/wav">
        </audio>
    </div>
    <div class="libro">
        <img src="imagenes/placeholder.png" alt="Historias para escuchar">
        <h3>Historias para escuchar</h3>
        <p>Autor: Narrador Web</p>
        <p>Audio simple disponible en la página como alternativa cuando no hay conexión.</p>
        <audio controls>
            <source src="audios/historias_para_escuchar.wav" type="audio/wav">
        </audio>
    </div>
</div>
</section>

<section class="contenedor-libros local-libros">

<?php

$sql = "SELECT * FROM libros";

$resultado = mysqli_query($conn,$sql);

while($fila = mysqli_fetch_assoc($resultado)){

?>

<div class="libro" data-titulo="<?php echo htmlspecialchars($fila['titulo'], ENT_QUOTES); ?>" data-autor="<?php echo htmlspecialchars($fila['autor'], ENT_QUOTES); ?>" data-descripcion="<?php echo htmlspecialchars($fila['descripcion'], ENT_QUOTES); ?>">

<img src="imagenes/<?php echo $fila['imagen']; ?>">

<h3>
<?php echo $fila['titulo']; ?>
</h3>

<p>
Autor:
<?php echo $fila['autor']; ?>
</p>

<p>
<?php echo $fila['descripcion']; ?>
</p>

<audio controls>

<source
src="audios/<?php echo $fila['audio']; ?>"
type="audio/mpeg">

</audio>

</div>

<?php } ?>

<?php
// Mostrar libros de la carpeta
foreach ($librosCarpeta as $libro) {
?>

<div class="libro" data-titulo="<?php echo htmlspecialchars($libro['titulo'], ENT_QUOTES); ?>" data-autor="<?php echo htmlspecialchars($libro['autor'], ENT_QUOTES); ?>" data-descripcion="<?php echo htmlspecialchars($libro['descripcion'], ENT_QUOTES); ?>">

<img src="imagenes/<?php echo $libro['imagen']; ?>">

<h3>
<?php echo $libro['titulo']; ?>
</h3>

<p>
Autor:
<?php echo $libro['autor']; ?>
</p>

<p>
<?php echo $libro['descripcion']; ?>
</p>

<audio controls>

<source
src="audios/<?php echo $libro['audio']; ?>"
type="<?php echo $libro['tipo']; ?>">

</audio>

</div>

<?php } ?>

</section>

<section class="contenedor-libros libros-pdf">
<h2>📖 Biblioteca de Libros PDF</h2>
<?php
// Mostrar libros PDF de la carpeta libros
foreach ($librosPDF as $libro) {
?>

<div class="libro libro-pdf" data-titulo="<?php echo htmlspecialchars($libro['titulo'], ENT_QUOTES); ?>" data-autor="<?php echo htmlspecialchars($libro['autor'], ENT_QUOTES); ?>" data-descripcion="<?php echo htmlspecialchars($libro['descripcion'], ENT_QUOTES); ?>">

<img src="imagenes/<?php echo $libro['imagen']; ?>" alt="Portada de <?php echo $libro['titulo']; ?>">

<h3><?php echo $libro['titulo']; ?></h3>

<p><?php echo $libro['autor']; ?></p>

<p><?php echo $libro['descripcion']; ?></p>

<div class="pdf-actions">
  <button class="btn-descargar" onclick="window.open('libros/<?php echo $libro['archivo']; ?>', '_blank')">📖 Abrir PDF</button>
  <button class="btn-descargar" onclick="location.href='libros/<?php echo $libro['archivo']; ?>'">⬇️ Descargar</button>
  <button class="btn-descargar" onclick="leerPdf('libros/<?php echo $libro['archivo']; ?>')">🔊 Leer PDF</button>
</div>

</div>

<?php } ?>
</section>

</body>
</html>