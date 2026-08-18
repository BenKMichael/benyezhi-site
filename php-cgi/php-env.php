<?php
header("Cache-Control: no-cache");
header("Content-Type: text/html; charset=utf-8");

$envVars = array_merge($_ENV, $_SERVER);
ksort($envVars);
?>
<!DOCTYPE html>
<html><head><title>Environment Variables</title>
</head><body><h1 align="center">Environment Variables</h1>
<hr>
<?php
foreach ($envVars as $variable => $value) {
    $valStr = is_array($value) ? json_encode($value) : (string)$value;
    echo "<b>" . htmlspecialchars($variable) . ":</b> " . htmlspecialchars($valStr) . "<br />\n";
}
?>
</body></html>