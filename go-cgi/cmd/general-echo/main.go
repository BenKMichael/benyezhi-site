package main

import (
	"fmt"
	"io"
	"net/http"
	"net/http/cgi"
	"os"
	"strconv"
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

	fmt.Fprintf(w, "</body>")
	fmt.Fprintf(w, "</html>")
}
func main(){
	http.HandleFunc("/",handler)
	if err:= cgi.Serve(nil); err != nil{
		fmt.Printf("CGI Serve error: %v\n", err)
	}
}