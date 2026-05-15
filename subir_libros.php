<?php

include("../conexion.php");

if(isset($_POST['guardar'])){

    $titulo = $_POST['titulo'];
    $autor = $_POST['autor'];
    $idioma = $_POST['idioma'];
    $categoria = $_POST['categoria'];
    $descripcion = $_POST['descripcion'];

    $audio = $_FILES['audio']['name'];
    $imagen = $_FILES['imagen']['name'];

    move_uploaded_file($_FILES['audio']['tmp_name'],
    "../audios/".$audio);

    move_uploaded_file($_FILES['imagen']['tmp_name'],
    "../imagenes/".$imagen);

    $sql = "INSERT INTO libros
    (titulo,autor,idioma,categoria,audio,imagen,descripcion)

    VALUES
    ('$titulo','$autor','$idioma','$categoria',
    '$audio','$imagen','$descripcion')";

    mysqli_query($conn,$sql);
}

?>

<form method="POST" enctype="multipart/form-data">

<input type="text" name="titulo" placeholder="Título">

<input type="text" name="autor" placeholder="Autor">

<input type="text" name="idioma" placeholder="Idioma">

<input type="text" name="categoria" placeholder="Categoría">

<textarea name="descripcion"></textarea>

<input type="file" name="audio">

<input type="file" name="imagen">

<button name="guardar">Guardar</button>

</form>