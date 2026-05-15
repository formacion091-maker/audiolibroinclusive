<?php

session_start();
include("conexion.php");

if(isset($_POST['ingresar'])){

    $correo = $_POST['correo'];
    $password = $_POST['password'];

    $sql = "SELECT * FROM usuarios
    WHERE correo='$correo'
    AND password='$password'";

    $resultado = mysqli_query($conn,$sql);

    if(mysqli_num_rows($resultado) > 0){

        $_SESSION['usuario'] = $correo;

        header("Location:biblioteca.php");

    }else{
        echo "
        <script>
        alert('Datos incorrectos');
        </script>
        ";
    }
}

?>

<!DOCTYPE html>
<html lang="es">
<head>

<meta charset="UTF-8">
<title>Login</title>

<link rel="stylesheet" href="estilos.css">

</head>

<body>

<div class="login">

<h2>🎧 Iniciar Sesión</h2>

<form method="POST">

<input type="email"
name="correo"
placeholder="Correo">

<input type="password"
name="password"
placeholder="Contraseña">

<button name="ingresar">
Ingresar
</button>

</form>

<a href="registro.php">
Crear Cuenta
</a>

</div>

</body>
</html>