<?php

include("conexion.php");

$mensaje = '';

if (isset($_POST['guardar'])) {
    $titulo = mysqli_real_escape_string($conn, $_POST['titulo']);
    $autor = mysqli_real_escape_string($conn, $_POST['autor']);
    $idioma = mysqli_real_escape_string($conn, $_POST['idioma']);
    $categoria = mysqli_real_escape_string($conn, $_POST['categoria']);
    $descripcion = mysqli_real_escape_string($conn, $_POST['descripcion']);

    if (!empty($_FILES['audio']['name']) && !empty($_FILES['imagen']['name'])) {
        $audioNombre = basename($_FILES['audio']['name']);
        $imagenNombre = basename($_FILES['imagen']['name']);
        $audioExt = strtolower(pathinfo($audioNombre, PATHINFO_EXTENSION));
        $imagenExt = strtolower(pathinfo($imagenNombre, PATHINFO_EXTENSION));

        // Validar extensiones de audio permitidas
        $extensionesAudioPermitidas = ['wav', 'mp3', 'ogg', 'm4a'];
        $extensionesImagenPermitidas = ['jpg', 'jpeg', 'png', 'gif'];

        if (!in_array($audioExt, $extensionesAudioPermitidas)) {
            $mensaje = 'Formato de audio no permitido. Solo se permiten: ' . implode(', ', $extensionesAudioPermitidas);
        } elseif (!in_array($imagenExt, $extensionesImagenPermitidas)) {
            $mensaje = 'Formato de imagen no permitido. Solo se permiten: ' . implode(', ', $extensionesImagenPermitidas);
        } else {
            $audioArchivo = time() . '_audio.' . $audioExt;
            $imagenArchivo = time() . '_imagen.' . $imagenExt;
            $audioDestino = 'audios/' . $audioArchivo;
            $imagenDestino = 'imagenes/' . $imagenArchivo;

            if (move_uploaded_file($_FILES['audio']['tmp_name'], $audioDestino) && move_uploaded_file($_FILES['imagen']['tmp_name'], $imagenDestino)) {
                $sql = "INSERT INTO libros (titulo, autor, idioma, categoria, audio, imagen, descripcion) VALUES ('$titulo', '$autor', '$idioma', '$categoria', '$audioArchivo', '$imagenArchivo', '$descripcion')";
                if (mysqli_query($conn, $sql)) {
                    $mensaje = 'Libro guardado correctamente en la página.';
                } else {
                    $mensaje = 'Error guardando el libro en la base de datos.';
                }
            } else {
                $mensaje = 'No se pudo subir el archivo. Verifica los permisos del directorio.';
            }
        }
    } else {
        $mensaje = 'Debes seleccionar un archivo de audio y una imagen.';
    }
}

?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agregar Audiolibro</title>
    <link rel="stylesheet" href="estilos.css">
</head>
<body>
<header>
    <h1>📥 Agregar Audiolibro</h1>
    <nav>
        <a href="index.php"><button>🏠 Inicio</button></a>
        <a href="biblioteca.php"><button>📚 Biblioteca</button></a>
    </nav>
</header>

<section class="login">
    <h2>Subir libro descargable</h2>
    <?php if ($mensaje): ?>
        <p style="color:#34d399; font-size:16px; margin-bottom:15px;"><?php echo $mensaje; ?></p>
    <?php endif; ?>
    <form method="POST" enctype="multipart/form-data">
        <input type="text" name="titulo" placeholder="Título" required>
        <input type="text" name="autor" placeholder="Autor" required>
        <input type="text" name="idioma" placeholder="Idioma" required>
        <input type="text" name="categoria" placeholder="Categoría" required>
        <textarea name="descripcion" placeholder="Descripción del libro" required></textarea>
        <input type="file" name="audio" accept=".wav,.mp3,.ogg,.m4a" required>
        <input type="file" name="imagen" accept=".jpg,.jpeg,.png,.gif" required>
        <button type="submit" name="guardar">Guardar libro</button>
    </form>
</section>
</body>
</html>