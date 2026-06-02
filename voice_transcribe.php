<?php
header('Content-Type: application/json');

// Start output buffering to prevent accidental HTML/PHP output
ob_start();
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);

$php_warnings = [];
set_error_handler(function($severity, $message, $file, $line) use (&$php_warnings) {
    $php_warnings[] = ['severity' => $severity, 'message' => $message, 'file' => $file, 'line' => $line];
    return true;
});

function send_json($data, $status = 200) {
    global $php_warnings;
    $extra = @ob_get_clean();
    if ($extra) {
        $extra = mb_substr($extra, 0, 2000);
    }
    if (!empty($php_warnings)) {
        $data['_internal_debug'] = ['warnings' => $php_warnings];
    }
    if (!headers_sent()) header('Content-Type: application/json', true, $status);
    http_response_code($status);
    echo json_encode($data);
    exit;
}

register_shutdown_function(function() {
    $err = error_get_last();
    if ($err) {
        @ob_end_clean();
        if (function_exists('send_json')) {
            send_json(['error' => 'Fatal PHP error', 'details' => $err], 500);
        } else {
            if (!headers_sent()) header('Content-Type: application/json', true, 500);
            echo json_encode(['error' => 'Fatal PHP error', 'details' => $err]);
        }
        exit;
    }
});

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['error' => 'Method not allowed'], 405);
}

$api_key = getenv('OPENAI_API_KEY');
if (!$api_key && defined('OPENAI_API_KEY')) {
    $api_key = OPENAI_API_KEY;
}

if (!$api_key || $api_key === 'pon_aqui_tu_clave_openai') {
    send_json(['error' => 'OpenAI API key not configured. Agrega OPENAI_API_KEY en .env o en config.php.'], 500);
}

if (!isset($_FILES['audio']) || !is_uploaded_file($_FILES['audio']['tmp_name'])) {
    send_json(['error' => 'No audio file uploaded.'], 400);
}

$audioFile = $_FILES['audio']['tmp_name'];
$audioName = $_FILES['audio']['name'] ?: 'voz.webm';
$mimeType = mime_content_type($audioFile) ?: 'audio/webm';

$formData = [
    'model' => 'whisper-1',
    'file' => new CURLFile($audioFile, $mimeType, $audioName),
    'language' => 'es'
];

$ch = curl_init('https://api.openai.com/v1/audio/transcriptions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $formData);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $api_key
]);

$response = curl_exec($ch);
$err = curl_error($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($err) {
    send_json(['error' => 'Curl error: ' . $err], 500);
}

$decoded = json_decode($response, true);
if ($code < 200 || $code >= 300) {
    if ($decoded) {
        send_json($decoded, $code);
    }
    send_json(['error' => 'OpenAI API returned error', 'status' => $code, 'body' => $response], $code);
}

if (!empty($decoded['text'])) {
    send_json(['transcript' => trim($decoded['text'])]);
}

send_json(['error' => 'No transcription result returned.'], 500);
