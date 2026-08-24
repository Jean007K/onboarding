package main

import (
	"os"
	"strings"
)

// Config guarda lo que este backend necesita para hablar con Idantite
// y para saber a donde devolver al usuario despues de la captura.
type Config struct {
	Port                  string
	DBPath                string
	IdantiteAPIURL        string
	IdantiteAPIKey        string
	IdantiteWebhookSecret string
	IdantiteCaptureURL    string
	IdantiteEnvironment   string
	PublicAppURL          string
	CORSOrigin            string
}

func loadConfig() Config {
	return Config{
		Port:                  env("PORT", "8080"),
		DBPath:                env("DB_PATH", "./data/onboarding.db"),
		IdantiteAPIURL:        strings.TrimRight(env("IDANTITE_API_URL", "https://api-go.genbia.qzz.io"), "/"),
		IdantiteAPIKey:        env("IDANTITE_API_KEY", ""),
		IdantiteWebhookSecret: env("IDANTITE_WEBHOOK_SECRET", ""),
		IdantiteCaptureURL:    strings.TrimRight(env("IDANTITE_CAPTURE_URL", "https://validacion.genbia.qzz.io"), "/"),
		IdantiteEnvironment:   env("IDANTITE_ENVIRONMENT", "sandbox"),
		PublicAppURL:          strings.TrimRight(env("PUBLIC_APP_URL", "http://localhost:3000"), "/"),
		CORSOrigin:            env("CORS_ORIGIN", "http://localhost:3000"),
	}
}

func env(key, fallback string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	return v
}
