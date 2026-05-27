<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['filename']) || !isset($input['text'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing filename or text']);
    exit;
}

$filename = basename($input['filename']);
$dir = __DIR__ . '/cache';
if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
}
$path = $dir . '/' . $filename . '.txt';

$result = file_put_contents($path, $input['text']);
if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not write cache']);
    exit;
}

echo json_encode(['ok' => true, 'path' => 'cache/' . $filename . '.txt']);
