<?php
// Configuración mínima para OpenAI
// El archivo .env se carga automáticamente si existe.
if (file_exists(__DIR__ . '/.env')) {
    $envLines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($envLines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) {
            continue;
        }
        [$key, $value] = array_map('trim', explode('=', $line, 2) + ['', '']);
        if ($key !== '') {
            $value = trim($value, " \t\n\r\0\x0B\"'");
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

// Reemplaza el valor de OPENAI_API_KEY por tu clave real desde https://platform.openai.com/account/api-keys
if (!defined('OPENAI_API_KEY')) {
    define('OPENAI_API_KEY', getenv('OPENAI_API_KEY') ?: 'pon_aqui_tu_clave_openai');
}

// Tiempo máximo en segundos para peticiones a la API
if (!defined('OPENAI_TIMEOUT')) {
    define('OPENAI_TIMEOUT', getenv('OPENAI_TIMEOUT') ?: 30);
}
?>