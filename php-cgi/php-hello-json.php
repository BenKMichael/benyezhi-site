<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');

$data = [
    "status"    => "success",
    "message"   => "Hello, JSON World!",
    "language"  => "PHP",
    "version"   => PHP_VERSION,
    "timestamp" => time(),
    "datetime"  => date('c'),
    "client"    => [
        "ip"         => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
        "user_agent" => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
    ]
];

echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
exit;