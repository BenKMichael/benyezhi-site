<?php
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');

$title = "Hello, World from PHP (HTML)";
$heading = "Hello, HTML World!";
$timestamp = date('Y-m-d H:i:s');
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($title); ?></title>
</head>
<body>
    <div class="card">
        <h1><?php echo htmlspecialchars($heading); ?></h1>
        <p>This page was generated dynamically via <strong>PHP</strong>.</p>
        <div class="meta">
            <p><strong>Server Time:</strong> <?php echo htmlspecialchars($timestamp); ?></p>
            <p><strong>Your IP:</strong> <?php echo htmlspecialchars($clientIp); ?></p>
        </div>
    </div>
</body>
</html>
