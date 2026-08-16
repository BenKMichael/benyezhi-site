package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/cgi"
	"os"
	"time"
)

type GolangResponse struct {
	Title string `json:"title"`
	IP string `json:"IP"`
	Heading string `json:"heading"`
	Time string `json:"time"`
	Message string `json:"message"`
}
func handler(w http.ResponseWriter, r* http.Request){
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Add("Cache-Control", "no-cache")
	w.WriteHeader(http.StatusOK)

	resp := GolangResponse{
		Title: "Hello, Golang",
		IP: os.Getenv("REMOTE_ADDR"),
		Heading: "Hello, Golang",
		Time: time.Now().Format("Sun Aug 16 17:35:20 2026"),
		Message: "This page was generated with the Go programming language",
	}
	json.NewEncoder(w).Encode(resp)
}
func main(){
	http.HandleFunc("/",handler)
	if err:= cgi.Serve(nil); err != nil{
		fmt.Printf("CGI Serve error: %v\n", err)
	}
}