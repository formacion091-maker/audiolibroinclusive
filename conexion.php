<?php

$servidor = "mysql-mina.alwaysdata.net";
$usuario = "mina";
$password = "clase123";
$base_datos = "mina_audiolibroinclusive";

$conn = mysqli_connect($servidor, $usuario, $password, $base_datos);

if(!$conn){
    die("Error de conexión");
}

?>