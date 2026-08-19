<?php
header("Content-Type: text/html; charset=utf-8");
header("Cache-Control: no-cache");

$protocol = $_SERVER['SERVER_PROTOCOL'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? '';
$queryString = $_SERVER['QUERY_STRING'] ?? '';

$hostname = gethostname();
$dateTime = date('Y-m-d H:i:s T');
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';

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

<p><b>Hostname:</b> <?php echo htmlspecialchars($hostname); ?></p>
<p><b>Date & Time:</b> <?php echo htmlspecialchars($dateTime); ?></p>
<p><b>User Agent:</b> <?php echo htmlspecialchars($userAgent); ?></p>
<p><b>IP Address:</b> <?php echo htmlspecialchars($ipAddress); ?></p>
</body>
</html>