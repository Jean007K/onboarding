package main

import (
	"log"
	"net/http"
)

func main() {
	cfg := loadConfig()
	db, err := openDB(cfg.DBPath)
	if err != nil {
		log.Fatal("sqlite: ", err)
	}
	defer db.Close()

	addr := ":" + cfg.Port
	log.Println("api onboarding escuchando en", addr)
	if err := http.ListenAndServe(addr, newServer(cfg, db)); err != nil {
		log.Fatal(err)
	}
}
