package main

import (
	"fmt"
	"net/http"
	"net/http/cgi"
)
func handler(w http.ResponseWriter, r* http.Request){
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	fmt.Fprintf(w, "<h1>Hello world!")
}
func main(){
	http.HandleFunc("/",handler)
	if err:= cgi.Serve(nil); err != nil{
		fmt.Printf("CGI Serve error: %v\n", err)
	}
}