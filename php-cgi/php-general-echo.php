<?php
header("Content-Type: text/html; charset=utf-8");
header("Cache-Control: no-cache");

$protocol = $_SERVER['SERVER_PROTOCOL'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? '';
$queryString = $_SERVER['QUERY_STRING'] ?? '';

$formData = file_get_contents('php://input');
?>
<!DOCTYPE html>
<html>
<head>
<title>General Request Echo</title>
</head>
<body>
<h1 align=center>General Request Echo</h1><hr/>
<p><b>HTTP Protocol:</b> <?php echo htmlspecialchars($protocol); ?></p>
<p><b>HTTP Method:</b> <?php echo htmlspecialchars($method); ?></p>
<p><b>Query String:</b> <?php echo htmlspecialchars($queryString); ?></p>
<p><b>Message Body:</b> <?php echo htmlspecialchars($formData); ?></p>
</body>
</html>