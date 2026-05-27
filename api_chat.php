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

function normalize_text($text) {
    $text = trim($text);
    $text = preg_replace('/\s+/', ' ', $text);
    return $text;
}

function extract_document_text($text) {
    $text = str_replace(["\r\n", "\r"], "\n", $text);
    $parts = preg_split('/\n{2,}/', $text, 2);
    if (count($parts) === 2 && trim($parts[1]) !== '') {
        return trim($parts[1]);
    }
    $markers = [
        'Lee en voz alta o resume el contenido siguiente',
        'Lee en voz alta o resume el contenido siguiente, mantén un tono claro y pausado:',
        'Lee en voz alta o resume el contenido siguiente, mantén un tono claro y pausado',
        'Resume el contenido siguiente',
        'Resumen local:'
    ];
    foreach ($markers as $marker) {
        $pos = mb_stripos($text, $marker);
        if ($pos !== false) {
            $body = trim(mb_substr($text, $pos + mb_strlen($marker)));
            if ($body !== '') {
                return $body;
            }
        }
    }
    return normalize_text($text);
}

function split_sentences($text) {
    $sentences = preg_split('/(?<=[\.\!\?])\s+/u', trim($text), -1, PREG_SPLIT_NO_EMPTY);
    return $sentences ?: [];
}

function sentence_score($sentence, $frequencies) {
    $words = preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower($sentence), -1, PREG_SPLIT_NO_EMPTY);
    $score = 0;
    foreach ($words as $word) {
        if (isset($frequencies[$word])) {
            $score += $frequencies[$word];
        }
    }
    return $score / max(1, count($words));
}

function build_word_frequencies($text) {
    $words = preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower($text), -1, PREG_SPLIT_NO_EMPTY);
    $stopwords = [
        'de','la','que','el','en','y','a','los','del','se','las','por','un','para','con','no','una','su','al','lo',
        'como','más','pero','sus','le','ya','o','este','sí','porque','esta','entre','cuando','muy','sin','sobre',
        'también','me','hasta','hay','donde','quien','desde','todo','nos','durante','todos','uno','les','ni','contra',
        'otros','ese','eso','ante','ellos','e','esto','mí','antes','algunos','qué','unos','yo','otro','otras','otra',
        'él','tanto','esa','estos','mucho','quienes','nada','muchos','cual','poco','ella','estar','estas','algunas','algo',
        'nosotros','mi','mis','tú','te','ti','tu','tus','ellas','nosotras','vosotros','vosotras','os','mío','mía','míos',
        'mías','tuyo','tuya','tuyos','tuyas','suyo','suya','suyos','suyas','nuestro','nuestra','nuestros','nuestras',
        'vuestro','vuestra','vuestros','vuestras','es','son','fue','era','ser','era','tambien','este','esta','estas'
    ];
    $freq = [];
    foreach ($words as $word) {
        if ($word === '' || in_array($word, $stopwords, true)) {
            continue;
        }
        $freq[$word] = ($freq[$word] ?? 0) + 1;
    }
    return $freq;
}

function local_summary($text) {
    $fullText = extract_document_text($text);
    if ($fullText === '') {
        return 'No hay texto disponible para resumir.';
    }
    $sentences = split_sentences($fullText);
    if (count($sentences) <= 4) {
        return 'Resumen local:
' . trim(implode(' ', $sentences));
    }
    $frequencies = build_word_frequencies($fullText);
    $scored = [];
    foreach ($sentences as $idx => $sentence) {
        $score = sentence_score($sentence, $frequencies);
        $scored[] = ['idx' => $idx, 'score' => $score, 'sentence' => trim($sentence)];
    }
    usort($scored, function($a, $b) {
        return $b['score'] <=> $a['score'];
    });
    $chosen = array_slice($scored, 0, min(5, count($scored)));
    usort($chosen, function($a, $b) {
        return $a['idx'] <=> $b['idx'];
    });
    $summary = implode(' ', array_column($chosen, 'sentence'));
    if (mb_strlen($summary) > 1500) {
        $summary = mb_substr($summary, 0, 1500) . '...';
    }
    return 'Resumen local:
' . trim($summary);
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