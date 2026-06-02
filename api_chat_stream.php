<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');

// Start output buffering only if needed, but flush frequently for streaming.
while (ob_get_level() > 0) {
    ob_end_flush();
}

require_once 'config.php';

set_time_limit(0);
ignore_user_abort(true);

function send_sse($payload) {
    echo 'data: ' . $payload . "\n\n";
    if (ob_get_length() > 0) {
        @ob_flush();
    }
    @flush();
}

function send_error($message) {
    send_sse(json_encode(['event' => 'error', 'message' => $message]));
    exit;
}

function normalize_text($text) {
    $text = trim($text);
    $text = preg_replace('/\s+/', ' ', $text);
    return $text;
}

function load_cached_pdf_text($filename) {
    $safe = basename($filename);
    $cachePath = __DIR__ . '/cache/' . $safe . '.txt';
    if (file_exists($cachePath)) {
        return trim(file_get_contents($cachePath));
    }
    return '';
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Method not allowed');
}

$api_key = getenv('OPENAI_API_KEY');
if (!$api_key && defined('OPENAI_API_KEY')) {
    $api_key = OPENAI_API_KEY;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['message'])) {
    send_error('Missing message');
}

$message = trim($input['message']);
$pdfText = isset($input['pdfText']) ? trim($input['pdfText']) : '';
if ($pdfText === '' && isset($input['filename']) && $input['filename'] !== '') {
    $pdfText = load_cached_pdf_text($input['filename']);
}

if (!$api_key || $api_key === 'pon_aqui_tu_clave_openai') {
    if ($pdfText === '') {
        send_error('Missing OpenAI API key or PDF text is not available.');
    }
    send_error('OpenAI API key not configured. Agrega OPENAI_API_KEY en config.php o en .env.');
}

$system_prompt = isset($input['system']) ? $input['system'] : "Eres un asistente experto en leer y resumir libros en español. Responde con claridad y en español, y cuando el usuario pide leer el libro, proporciona texto adecuado para lectura continua.";

$user_content = $message;
if ($pdfText !== '') {
    $user_content .= "\n\nTexto del PDF:\n" . mb_substr($pdfText, 0, 10000);
}

$payload = [
    'model' => 'gpt-4o-mini',
    'messages' => [
        ['role' => 'system', 'content' => $system_prompt],
        ['role' => 'user', 'content' => $user_content]
    ],
    'temperature' => 0.7,
    'stream' => true
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

$buffer = '';

curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $data) use (&$buffer) {
    $buffer .= $data;
    while (($pos = strpos($buffer, "\n\n")) !== false) {
        $chunk = substr($buffer, 0, $pos);
        $buffer = substr($buffer, $pos + 2);
        if ($chunk === '') {
            continue;
        }
        foreach (explode("\n", $chunk) as $line) {
            $line = trim($line);
            if ($line === '' || strpos($line, 'data: ') !== 0) {
                continue;
            }
            $payload = substr($line, 6);
            if ($payload === '[DONE]') {
                send_sse(json_encode(['event' => 'done']));
                continue;
            }
            $decoded = json_decode($payload, true);
            if (!$decoded) {
                continue;
            }
            if (isset($decoded['choices'][0]['delta']['content'])) {
                $content = $decoded['choices'][0]['delta']['content'];
                send_sse(json_encode(['event' => 'message', 'text' => $content]));
            }
            if (isset($decoded['error'])) {
                send_sse(json_encode(['event' => 'error', 'message' => json_encode($decoded['error'])]));
            }
        }
    }
    return strlen($data);
});

$response = curl_exec($ch);
$err = curl_error($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($err) {
    send_error('Curl error: ' . $err);
}

if ($code < 200 || $code >= 300) {
    send_error('OpenAI API returned HTTP ' . $code);
}

exit;
