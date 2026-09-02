package main

import (
	"fmt"
	"io"
	"net/http"
	"net/http/cgi"
	"os"
	"strconv"
	"time"
)

func handler(w http.ResponseWriter, r* http.Request){
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Add("Cache-Control", "no-cache")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "<!DOCTYPE html>")
	fmt.Fprintf(w, "<html>")
	fmt.Fprintf(w, "<head>")
	fmt.Fprintf(w, "<title>General Request Echo</title>")
	fmt.Fprintf(w, "</head>")

	fmt.Fprintf(w, "<body>")
	fmt.Fprintf(w, "<h1 align=center>General Request Echo</h1><hr/>")

	// HTTP Protocol, HTTP Method, and Query String are environment variables
	protocol := os.Getenv("SERVER_PROTOCOL")
	method := os.Getenv("REQUEST_METHOD")
	queryString := os.Getenv("QUERY_STRING")
	contentLengthStr := os.Getenv("CONTENT_LENGTH")

	fmt.Fprintf(w, "<p><b>HTTP Protocol:</b> %s</p>\n", protocol)
	fmt.Fprintf(w, "<p><b>HTTP Method:</b> %s</p>\n", method)
	fmt.Fprintf(w, "<p><b>Query String:</b> %s</p>\n", queryString)
	
	var formData string
	if contentLengthStr != "" {
		if contentLength, err := strconv.Atoi(contentLengthStr); err == nil && contentLength > 0 {
			buf := make([]byte, contentLength)
			if _, err := io.ReadFull(os.Stdin, buf); err == nil {
				formData = string(buf)
			}
		}
	}
	fmt.Fprintf(w, "<p><b>Message Body:</b> %s</p>\n", formData)

	hostname, _ := os.Hostname()
	dateTime := time.Now().Format("2006-01-02 15:04:05 MST")
	userAgent := os.Getenv("HTTP_USER_AGENT")
	ipAddress := os.Getenv("REMOTE_ADDR")

	fmt.Fprintf(w, "<p><b>Hostname:</b> %s</p>\n", hostname)
	fmt.Fprintf(w, "<p><b>Date & Time:</b> %s</p>\n", dateTime)
	fmt.Fprintf(w, "<p><b>User Agent:</b> %s</p>\n", userAgent)
	fmt.Fprintf(w, "<p><b>IP Address:</b> %s</p>\n", ipAddress)

	fmt.Fprintf(w, "</body>")
	fmt.Fprintf(w, "</html>")
}
func main(){
	http.HandleFunc("/",handler)
	if err:= cgi.Serve(nil); err != nil{
		fmt.Printf("CGI Serve error: %v\n", err)
	}
}