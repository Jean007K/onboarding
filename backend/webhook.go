package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"strings"
)

// Header que manda Idantite: X-IDANTITE-Signature
// Valor = hex(HMAC-SHA256(secret, cuerpo_crudo))
//
// Hay que firmar el body TAL CUAL llega. Si lo parseas a JSON primero
// y lo vuelves a serializar, la firma no va a coincidir.

func firmaValida(secret string, rawBody []byte, signatureHex string) bool {
	if secret == "" || signatureHex == "" {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write(rawBody)
	esperada := hex.EncodeToString(mac.Sum(nil))
	a := []byte(strings.ToLower(esperada))
	b := []byte(strings.ToLower(strings.TrimSpace(signatureHex)))
	if len(a) != len(b) {
		return false
	}
	return hmac.Equal(a, b)
}

// WebhookEvent es lo que Idantite pega a nuestro endpoint.
// Eventos: verification.completed, verification.reviewed, verification.resubmission_requested
type WebhookEvent struct {
	Event     string          `json:"event"`
	SessionID string          `json:"session_id"`
	SentAt    string          `json:"sent_at"`
	Data      json.RawMessage `json:"data"`
}

type WebhookData struct {
	SessionID    string          `json:"session_id"`
	ExternalRef  string          `json:"external_ref"`
	Environment  string          `json:"environment"`
	Status       string          `json:"status"`
	WorkflowType string          `json:"workflow_type"`
	ReturnURL    string          `json:"return_url"`
	Decision     string          `json:"decision"`
	Approved     bool            `json:"approved"`
	Scores       json.RawMessage `json:"scores"`
	Reasons      json.RawMessage `json:"reasons"`
	Extracted    json.RawMessage `json:"extracted_data"`
}
