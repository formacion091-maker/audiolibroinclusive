<?php

session_start();

include("conexion.php");

if(!isset($_SESSION['usuario'])){
    header("Location:login.php");
}

?>

<!DOCTYPE html>
<html lang="es">
<head>

<meta charset="UTF-8">

<title>Biblioteca</title>

<link rel="stylesheet" href="estilos.css">

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

</section>

<section class="contenedor-libros">

<?php

$sql = "SELECT * FROM libros";

$resultado = mysqli_query($conn,$sql);

while($fila = mysqli_fetch_assoc($resultado)){

?>

<div class="libro">

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

</section>

</body>
</html>