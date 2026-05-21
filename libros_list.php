<?php
header('Content-Type: application/json');
$carpetaLibros = 'libros/';
$libros = [];
if (is_dir($carpetaLibros)) {
    $archivos = scandir($carpetaLibros);
    foreach ($archivos as $archivo) {
        if ($archivo === '.' || $archivo === '..') continue;
        $ext = strtolower(pathinfo($archivo, PATHINFO_EXTENSION));
        if ($ext === 'pdf') {
            $libros[] = [
                'archivo' => $archivo,
                'titulo' => ucwords(str_replace(['_', '.pdf'], [' ', ''], $archivo))
            ];
        }
    }
}
echo json_encode($libros);
?>