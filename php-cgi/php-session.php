<?php
session_start();

$scriptName = $_SERVER['SCRIPT_NAME'] ?? '/php-session.php';
$queryString = $_SERVER['QUERY_STRING'] ?? '';

if (str_contains($queryString, 'action=clear')) {
    $_SESSION = [];
    session_destroy();
    
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    renderClearPage($scriptName);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $_SESSION['username'] = $_POST['username'] ?? '';
    header("Location: $scriptName?page=2");
    exit;
}

$sessionID = session_id();
$savedData = $_SESSION['username'] ?? '';

if (str_contains($queryString, 'page=2')) {
    renderPage2($scriptName, $sessionID, $savedData);
    exit;
}

renderPage1($scriptName, $sessionID, $savedData);
exit;

function renderPage1($scriptName, $sessionID, $val) {
    echo "<h1>PHP Native Session - Input</h1>";
    echo "<p>Session ID: " . htmlspecialchars($sessionID) . "</p>";
    echo '<form method="POST" action="' . htmlspecialchars($scriptName) . '">';
    echo '<input type="text" name="username" value="' . htmlspecialchars($val) . '" required>';
    echo '<button type="submit">Save</button></form>';
    echo '<p><a href="' . htmlspecialchars($scriptName) . '?page=2">View</a> | <a href="' . htmlspecialchars($scriptName) . '?action=clear">Clear</a></p>';
}

function renderPage2($scriptName, $sessionID, $val) {
    echo "<h1>PHP Native Session - View</h1>";
    echo "<p>Session ID: " . htmlspecialchars($sessionID) . "</p>";
    echo "<p>Saved Data: <strong>" . htmlspecialchars($val ?: 'None') . "</strong></p>";
    echo '<p><a href="' . htmlspecialchars($scriptName) . '">Back</a> | <a href="' . htmlspecialchars($scriptName) . '?action=clear">Clear</a></p>';
}

function renderClearPage($scriptName) {
    echo "<h1>Session Destroyed</h1><p><a href='" . htmlspecialchars($scriptName) . "'>Back</a></p>";
}