package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"net/url"
	"os"
	"strconv"
	"strings"
)

func generateSessionID() string{
	b := make([]byte,16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func getSessionID() string {
	cookieHeader := os.Getenv("HTTP_COOKIE")
	cookies := strings.Split(cookieHeader, ";")
	for _, c := range cookies{
		parts := strings.Split(strings.TrimSpace(c), "=")
		if len(parts) == 2 && parts[0] == "session_id" {
			return parts[1]
		}
	}
	return ""
}

func printHeaders(setCookie string) {
	fmt.Print("Cache-Control: no-cache\n")
	fmt.Print("Content-Type: text/html; charset=utf-8\n")
	if setCookie != "" {
		fmt.Print(setCookie)
	}
	fmt.Print("\n")
}
func main() {
	method := os.Getenv("REQUEST_METHOD")
	queryString := os.Getenv("QUERY_STRING")
	scriptName := os.Getenv("SCRIPT_NAME")
	if scriptName == "" {
		scriptName = "/cgi-bin/session"
	}

	sessionID := getSessionID()
	setCookieHeader := ""

	if sessionID == "" {
		sessionID = generateSessionID()
		setCookieHeader = fmt.Sprintf("Set-Cookie: session_id=%s; Path=/; HttpOnly\n", sessionID)
	}

	sessionFilePath := fmt.Sprintf("/tmp/sess_%s.txt", sessionID)

	if method == "POST" {
		contentLengthStr := os.Getenv("CONTENT_LENGTH")
		if contentLength, err := strconv.Atoi(contentLengthStr); err == nil && contentLength > 0 {
			buf := make([]byte, contentLength)
			if _, err := io.ReadFull(os.Stdin, buf); err == nil {
				vals, _ := url.ParseQuery(string(buf))
				username := vals.Get("username")
				_ = os.WriteFile(sessionFilePath, []byte(username), 0600)
			}
		}

		printHeaders(setCookieHeader)
		renderPage2(scriptName, sessionID, sessionFilePath)
		return
	}
	if strings.Contains(queryString, "action=clear") {
		_ = os.Remove(sessionFilePath)
		expireCookie := "Set-Cookie: session_id=deleted; Path=/; Max-Age=0; HttpOnly\n"
		printHeaders(expireCookie)
		renderClearPage(scriptName)
		return
	}
	if strings.Contains(queryString, "page=2") {
		printHeaders(setCookieHeader)
		renderPage2(scriptName, sessionID, sessionFilePath)
		return
	}
	printHeaders(setCookieHeader)
	renderPage1(scriptName, sessionID, sessionFilePath)
}

func renderPage1(scriptName, sessionID, filePath string) {
	currentVal := ""
	if b, err := os.ReadFile(filePath); err == nil {
		currentVal = string(b)
	}

	fmt.Printf(`<!DOCTYPE html>
<html lang="en">
<head><title>State Demo - Page 1 (Collect Data)</title></head>
<body>
  <h1>Server-Side State Demo (Go) - Page 1: Input</h1>
  <hr>
  <p><b>Session ID:</b> %s</p>
  <form action="%s" method="POST">
    <p>
      <label for="username">Enter some data to save to server session:</label><br>
      <input type="text" id="username" name="username" value="%s" required>
    </p>
    <p>
      <button type="submit">Save and Go to Page 2</button>
    </p>
  </form>
  <p><a href="%s?page=2">View Saved Data (Page 2)</a> | <a href="%s?action=clear">Clear Session</a></p>
</body>
</html>`, sessionID, scriptName, currentVal, scriptName, scriptName)
}

func renderPage2(scriptName, sessionID, filePath string) {
	savedData := ""
	if b, err := os.ReadFile(filePath); err == nil {
		savedData = string(b)
	}

	dataDisplay := "<em>No data currently saved in session.</em>"
	if savedData != "" {
		dataDisplay = fmt.Sprintf("<strong>%s</strong>", savedData)
	}

	fmt.Printf(`<!DOCTYPE html>
<html lang="en">
<head><title>State Demo - Page 2 (View Data)</title></head>
<body>
  <h1>Server-Side State Demo (Go) - Page 2: View</h1>
  <hr>
  <p><b>Session ID:</b> %s</p>
  <p><b>Saved Session Data:</b> %s</p>
  <hr>
  <p>
    <a href="%s">Back to Page 1 (Edit Data)</a> | 
    <a href="%s?action=clear">Clear Session Data</a>
  </p>
</body>
</html>`, sessionID, dataDisplay, scriptName, scriptName)
}

func renderClearPage(scriptName string) {
	fmt.Printf(`<!DOCTYPE html>
<html lang="en">
<head><title>State Demo - Cleared</title></head>
<body>
  <h1>Session Destroyed</h1>
  <hr>
  <p>Server-side session file has been deleted successfully.</p>
  <p><a href="%s">Back to Page 1</a></p>
</body>
</html>`, scriptName)
}