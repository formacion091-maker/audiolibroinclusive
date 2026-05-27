<?php
header('Content-Type: application/json');

// Start output buffering to prevent accidental HTML/PHP output
ob_start();
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);

// collect PHP warnings
$php_warnings = [];
set_error_handler(function($severity, $message, $file, $line) use (&$php_warnings) {
    $php_warnings[] = ['severity' => $severity, 'message' => $message, 'file' => $file, 'line' => $line];
    return true; // prevent PHP internal handler from outputting HTML
});

function send_json($data, $status = 200) {
    global $php_warnings;
    // capture any buffered output
    $extra = @ob_get_clean();
    if ($extra) {
        // trim very large outputs
        $extra = mb_substr($extra, 0, 2000);
    }
    if (!empty($extra) || !empty($php_warnings)) {
        $data['_internal_debug'] = ['output' => $extra, 'warnings' => $php_warnings];
    }
    if (!headers_sent()) header('Content-Type: application/json', true, $status);
    http_response_code($status);
    echo json_encode($data);
    exit;
}

register_shutdown_function(function() {
    $err = error_get_last();
    if ($err) {
        // clear any buffered output
        @ob_end_clean();
        // Use send_json to ensure consistent JSON response
        if (function_exists('send_json')) {
            send_json(['error' => 'Fatal PHP error', 'details' => $err], 500);
        } else {
            if (!headers_sent()) header('Content-Type: application/json', true, 500);
            echo json_encode(['error' => 'Fatal PHP error', 'details' => $err]);
        }
        exit;
    }
});

// Proxy mínimo para OpenAI Chat Completions
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['error' => 'Method not allowed'], 405);
}

// Prefer environment variable for API key, fallback to config constant
$api_key = getenv('OPENAI_API_KEY');
if (!$api_key && defined('OPENAI_API_KEY')) {
    $api_key = OPENAI_API_KEY;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['message'])) {
    send_json(['error' => 'Missing message'], 400);
}

function local_summary($text) {
    $text = trim($text);
    if ($text === '') {
        return 'No hay texto disponible para resumir.';
    }
    // Extrae hasta 4 frases simples del texto
    $sentences = preg_split('/(?<=[\.\?!])\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);
    if ($sentences && count($sentences) > 0) {
        $summary = '';
        $count = 0;
        foreach ($sentences as $sentence) {
            if ($count >= 4) break;
            $summary .= trim($sentence) . ' ';
            $count++;
        }
        $summary = trim($summary);
        if (strlen($summary) > 1500) {
            $summary = substr($summary, 0, 1500) . '...';
        }
        return 'Resumen local:
' . $summary;
    }
    $short = mb_substr($text, 0, 1200);
    return 'Resumen local:
' . trim($short) . (mb_strlen($text) > 1200 ? '...' : '');
}

if (!$api_key || $api_key === 'pon_aqui_tu_clave_openai') {
    $message = $input['message'];
    $fallback = local_summary($message);
    send_json(['choices' => [['message' => ['content' => $fallback]]]], 200);
}

$message = $input['message'];
$system_prompt = isset($input['system']) ? $input['system'] : "Eres un asistente útil, responde con claridad y en español cuando sea necesario.";

$payload = [
    'model' => 'gpt-4o-mini',
    'messages' => [
        ['role' => 'system', 'content' => $system_prompt],
        ['role' => 'user', 'content' => $message]
    ],
    'max_tokens' => 1500,
    'temperature' => 0.7
];

$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $api_key
]);
curl_setopt($ch, CURLOPT_TIMEOUT, OPENAI_TIMEOUT);

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
        // Forward structured error from OpenAI when available
        send_json($decoded, $code);
    } else {
        // Ensure we always return JSON (wrap non-JSON bodies)
        send_json([
            'error' => 'OpenAI API returned an error',
            'status' => $code,
            'body' => $response
        ], $code);
    }
}

// Normal success: ensure output is valid JSON
if ($decoded) {
    send_json($decoded, 200);
} else {
    // If API returned non-JSON for some reason, wrap it
    send_json(['result' => $response], 200);
}

?>