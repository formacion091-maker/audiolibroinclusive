<?php
header('Content-Type: application/json');

// Proxy mínimo para OpenAI Chat Completions
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Validar que la clave de API esté configurada
if (!defined('OPENAI_API_KEY') || OPENAI_API_KEY === 'pon_aqui_tu_clave_openai' || empty(OPENAI_API_KEY)) {
    http_response_code(400);
    echo json_encode(['error' => 'Clave de API de OpenAI no configurada. Por favor, edita config.php y agrega tu clave de API válida desde https://platform.openai.com/account/api-keys']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['message'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing message']);
    exit;
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
    'Authorization: Bearer ' . OPENAI_API_KEY
]);
curl_setopt($ch, CURLOPT_TIMEOUT, OPENAI_TIMEOUT);

$response = curl_exec($ch);
$err = curl_error($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($err) {
    http_response_code(500);
    echo json_encode(['error' => 'Curl error: '.$err]);
    exit;
}

if ($code < 200 || $code >= 300) {
    http_response_code($code);
    echo $response;
    exit;
}

echo $response;

?>