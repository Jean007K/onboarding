package main

import (
	"os"
	"strings"
)

// Config guarda lo que este backend necesita para hablar con Emverax
// y para saber a donde devolver al usuario despues de la captura.
type Config struct {
	Port                  string
	DBPath                string
	EmveraxAPIURL        string
	EmveraxAPIKey        string
	EmveraxWebhookSecret string
	EmveraxCaptureURL    string
	EmveraxEnvironment   string
	PublicAppURL          string
	CORSOrigin            string
}

func loadConfig() Config {
	return Config{
		Port:                  env("PORT", "8080"),
		DBPath:                env("DB_PATH", "./data/onboarding.db"),
		EmveraxAPIURL:        strings.TrimRight(env("IDANTITE_API_URL", "https://api.emverax.com"), "/"),
		EmveraxAPIKey:        env("IDANTITE_API_KEY", ""),
		EmveraxWebhookSecret: env("IDANTITE_WEBHOOK_SECRET", ""),
		EmveraxCaptureURL:    strings.TrimRight(env("EMVERAX_CAPTURE_URL", "https://verify.emverax.com"), "/"),
		EmveraxEnvironment:   env("EMVERAX_ENVIRONMENT", "sandbox"),
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
