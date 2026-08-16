package main

import (
	"fmt"
	"net/http"
	"net/http/cgi"
	"os"
	"sort"
	"strings"
)
func handler(w http.ResponseWriter, r* http.Request){
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Add("Cache-Control", "no-cache")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "<!DOCTYPE html>")
	fmt.Fprintf(w, "<html>")
	fmt.Fprintf(w, "<head>")
	fmt.Fprintf(w, "<title>Environment Variables</title>")
	fmt.Fprintf(w, "</head>")

	fmt.Fprintf(w, "<body>")
	fmt.Fprintf(w, "<h1>Environment Variables</h1><hr/>")

	envs := os.Environ()
	sort.Strings(envs)

	for _, env := range envs {
		key, val, found := strings.Cut(env, "=")
		if found {
			fmt.Fprintf(os.Stdout, "<b>%s:</b> %s<br />\n", key, val)
		}
	}
	
	fmt.Fprintf(w, "</body>")
	fmt.Fprintf(w, "</html>")
}
func main(){
	http.HandleFunc("/",handler)
	if err:= cgi.Serve(nil); err != nil{
		fmt.Printf("CGI Serve error: %v\n", err)
	}
}