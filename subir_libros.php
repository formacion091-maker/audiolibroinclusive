<?php

include("conexion.php");

$mensaje = '';

if (isset($_POST['guardar'])) {
    $titulo = mysqli_real_escape_string($conn, $_POST['titulo']);
    $autor = mysqli_real_escape_string($conn, $_POST['autor']);
    $idioma = mysqli_real_escape_string($conn, $_POST['idioma']);
    $categoria = mysqli_real_escape_string($conn, $_POST['categoria']);
    $descripcion = mysqli_real_escape_string($conn, $_POST['descripcion']);

    $pdfNombre = !empty($_FILES['pdf']['name']) ? basename($_FILES['pdf']['name']) : '';
    $pdfExt = $pdfNombre ? strtolower(pathinfo($pdfNombre, PATHINFO_EXTENSION)) : '';
    $extensionesPdfPermitidas = ['pdf'];

    if (!empty($pdfNombre)) {
        if (!in_array($pdfExt, $extensionesPdfPermitidas)) {
            $mensaje = 'Formato de PDF no permitido. Solo se permiten archivos PDF.';
        } else {
            $pdfArchivo = time() . '_libro.' . $pdfExt;
            $pdfDestino = 'libros/' . $pdfArchivo;

            if (move_uploaded_file($_FILES['pdf']['tmp_name'], $pdfDestino)) {
                $mensaje = 'Libro PDF guardado correctamente. Aparecerá automáticamente en la biblioteca.';
            } else {
                $mensaje = 'No se pudo subir el archivo PDF. Verifica los permisos del directorio.';
            }
        }
    } elseif (!empty($_FILES['audio']['name']) && !empty($_FILES['imagen']['name'])) {
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
                    $mensaje = 'Audiolibro guardado correctamente en la página.';
                } else {
                    $mensaje = 'Error guardando el libro en la base de datos.';
                }
            } else {
                $mensaje = 'No se pudo subir el archivo. Verifica los permisos del directorio.';
            }
        }
    } else {
        $mensaje = 'Debes seleccionar un archivo de audio e imagen, o un PDF para subir.';
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
    <p style="color:#cbd5e1; font-size:16px; margin-bottom:15px;">
        Elige el tipo de contenido que deseas subir. Si es un libro en PDF, selecciona "Subir PDF". Si es un audiolibro, selecciona "Subir Audiolibro".
    </p>
    <div class="upload-toggle">
        <label>
            <input type="radio" name="tipo_subida" value="pdf" onclick="mostrarTipoSubida('pdf')" checked>
            Subir PDF
        </label>
        <label>
            <input type="radio" name="tipo_subida" value="audio" onclick="mostrarTipoSubida('audio')">
            Subir Audiolibro
        </label>
    </div>
    <form method="POST" enctype="multipart/form-data">
        <input type="hidden" name="tipo_subida_seleccionado" id="tipo_subida_seleccionado" value="pdf">
        <input type="text" name="titulo" placeholder="Título" required>
        <input type="text" name="autor" placeholder="Autor" required>
        <input type="text" name="idioma" placeholder="Idioma" required>
        <input type="text" name="categoria" placeholder="Categoría" required>
        <textarea name="descripcion" placeholder="Descripción del libro" required></textarea>
        <div id="seccion-pdf">
            <input type="file" name="pdf" id="pdf" accept=".pdf">
        </div>
        <div id="seccion-audio" style="display:none;">
            <input type="file" name="audio" id="audio" accept=".wav,.mp3,.ogg,.m4a">
            <input type="file" name="imagen" id="imagen" accept=".jpg,.jpeg,.png,.gif">
        </div>
        <button type="submit" name="guardar">Guardar libro</button>
        <button type="submit" name="guardar">Guardar libro</button>
    </form>
</section>
<script>
    function mostrarTipoSubida(tipo) {
        const pdfSection = document.getElementById('seccion-pdf');
        const audioSection = document.getElementById('seccion-audio');
        const tipoSeleccionado = document.getElementById('tipo_subida_seleccionado');
        const pdfInput = document.getElementById('pdf');
        const audioInput = document.getElementById('audio');
        const imagenInput = document.getElementById('imagen');

        if (tipo === 'pdf') {
            pdfSection.style.display = 'block';
            audioSection.style.display = 'none';
            pdfInput.required = true;
            audioInput.required = false;
            imagenInput.required = false;
        } else {
            pdfSection.style.display = 'none';
            audioSection.style.display = 'block';
            pdfInput.required = false;
            audioInput.required = true;
            imagenInput.required = true;
        }

        if (tipoSeleccionado) {
            tipoSeleccionado.value = tipo;
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        mostrarTipoSubida('pdf');
    });
</script>
</body>
</html>