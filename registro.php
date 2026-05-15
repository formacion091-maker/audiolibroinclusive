<?php

include("conexion.php");

if(isset($_POST['registrar'])){

    $nombre = $_POST['nombre'];
    $correo = $_POST['correo'];
    $password = $_POST['password'];

    $sql = "INSERT INTO usuarios
    (nombre,correo,password)

    VALUES

    ('$nombre','$correo','$password')";

    mysqli_query($conn,$sql);

    echo "
    <script>
    alert('Usuario registrado');
    window.location='login.php';
    </script>
    ";
}

?>

<!DOCTYPE html>
<html lang="es">
<head>

<meta charset="UTF-8">
<title>Registro</title>

<link rel="stylesheet" href="estilos.css">

</head>

<body>

<div class="login">

<h2>📝 Registro</h2>

<form method="POST">

<input type="text"
name="nombre"
placeholder="Nombre">

<input type="email"
name="correo"
placeholder="Correo">

<input type="password"
name="password"
placeholder="Contraseña">

<button name="registrar">
Registrarse
</button>

</form>

</div>

</body>
</html>