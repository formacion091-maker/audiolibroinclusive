<?php
// Script de prueba para verificar la función de libros de carpeta
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
                        'tipo' => $tipoAudio
                    ];
                }
            }
        }
    }
    return $libros;
}

$libros = obtenerLibrosCarpeta();
echo 'Libros encontrados: ' . count($libros) . "\n";
foreach ($libros as $libro) {
    echo '- ' . $libro['titulo'] . ' (' . $libro['audio'] . ' - ' . $libro['tipo'] . ')' . "\n";
}
?>