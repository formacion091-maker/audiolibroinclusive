<?php include("conexion.php"); ?>

<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>AudioLibros Inclusivos</title>

<link rel="stylesheet" href="estilos.css">

<script src="script.js"></script>

</head>

<body onload="hablarBienvenida()">

<header>

<h1>🎧 AudioLibros Inclusivos</h1>

<nav>
<button onclick="activarModoOscuro()">🌙 Modo Oscuro</button>
<button onclick="leerPagina()">🔊 Escuchar Página</button>
<button onclick="activarBusquedaVoz()">🎤 Buscar por Voz</button>
<button onclick="cambiarIdioma('es-ES')">🇪🇸 Español</button>
<button onclick="cambiarIdioma('en-US')">🇺🇸 English</button>
<button onclick="cambiarIdioma('fr-FR')">🇫🇷 Français</button>
<button onclick="cambiarIdioma('pt-PT')">🇵🇹 Português</button>
<button onclick="leerPagina()">🔊 Escuchar Todo</button>
<button onclick="activarBusquedaVoz()">🎤 Hablar para Buscar</button>
</nav>

</header>

<section class="hero">

<h2>Biblioteca Inclusiva de Audio Libros</h2>

<p>
Una plataforma diseñada especialmente para personas con discapacidad visual y baja visión.
</p>

<input type="text" id="busqueda" placeholder="Buscar audiolibro...">
<button class="btn-buscar" onclick="buscarGoogleLibros()">🔎 Buscar en Google</button>
<div id="resultados" class="resultados"></div>

</section>

<section class="contenedor-libros">

<?php

$sql = "SELECT * FROM libros";
$resultado = mysqli_query($conn, $sql);

while($fila = mysqli_fetch_assoc($resultado)){

?>

<div class="libro">

<img src="imagenes/<?php echo $fila['imagen']; ?>">

<h3><?php echo $fila['titulo']; ?></h3>

<p><?php echo $fila['autor']; ?></p>

<p><?php echo $fila['descripcion']; ?></p>

<audio controls>
<source src="audios/<?php echo $fila['audio']; ?>" type="audio/mpeg">
</audio>

</div>

<?php } ?>

</section>

</body>
</html>