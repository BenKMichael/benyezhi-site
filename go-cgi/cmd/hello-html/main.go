package main

import (
	"fmt"
	"net/http"
	"net/http/cgi"
	"os"
	"time"
)
func handler(w http.ResponseWriter, r* http.Request){
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Add("Cache-Control", "no-cache")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "<!DOCTYPE html>")
	fmt.Fprintf(w, "<html>")
	fmt.Fprintf(w, "<head>")
	fmt.Fprintf(w, "<title>Hello CGI World</title>")
	fmt.Fprintf(w, "</head>")

	fmt.Fprintf(w, "<body>")
	fmt.Fprintf(w, "<h1 align=center>Hello HTML World</h1>")
	fmt.Fprintf(w, "<hr/><p>Hello World</p>")
	fmt.Fprintf(w, "<p>This page was generated with the Go programming langauge</p>")
	
	now := time.Now()
	fmt.Fprintf(w, "<p>This program was generated at: %s</p>", now.Format("Sun Aug 16 17:35:20 2026"))

	clientIP := os.Getenv("REMOTE_ADDR")
	fmt.Fprintf(w, "<p>Your current IP Address is: %s</p>", clientIP)

	fmt.Fprintf(w, "</body>")
	fmt.Fprintf(w, "</html>")
}
func main(){
	http.HandleFunc("/",handler)
	if err:= cgi.Serve(nil); err != nil{
		fmt.Printf("CGI Serve error: %v\n", err)
	}
}