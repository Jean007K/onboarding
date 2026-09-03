package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Cliente minimo de Emverax.
// La API key NUNCA sale de este servidor. El navegador no la ve.

type Emverax struct {
	baseURL     string
	apiKey      string
	environment string
	http        *http.Client
}

func newEmverax(cfg Config) *Emverax {
	return &Emverax{
		baseURL:     cfg.EmveraxAPIURL,
		apiKey:      cfg.EmveraxAPIKey,
		environment: cfg.EmveraxEnvironment,
		http:        &http.Client{Timeout: 25 * time.Second},
	}
}

type crearSesionReq struct {
	EndUserRef   string `json:"end_user_ref"`
	WorkflowType string `json:"workflow_type"`
	ReturnURL    string `json:"return_url"`
}

type SesionEmverax struct {
	SessionID    string          `json:"session_id"`
	ShareToken   string          `json:"share_token"`
	ReturnURL    string          `json:"return_url"`
	Status       string          `json:"status"`
	Decision     string          `json:"decision"`
	Approved     bool            `json:"approved"`
	Scores       json.RawMessage `json:"scores"`
	Reasons      json.RawMessage `json:"reasons"`
	Extracted    json.RawMessage `json:"extracted_data"`
	ExternalRef  string          `json:"external_ref"`
	EndUserRef   string          `json:"end_user_ref"`
	WorkflowType string          `json:"workflow_type"`
}

func (c *Emverax) crearSesion(endUserRef, returnURL string) (SesionEmverax, error) {
	body, _ := json.Marshal(crearSesionReq{
		EndUserRef:   endUserRef,
		WorkflowType: "document_selfie",
		ReturnURL:    returnURL,
	})
	var out SesionEmverax
	if err := c.do("POST", "/v2/sessions", body, &out); err != nil {
		return out, err
	}
	if out.SessionID == "" {
		return out, fmt.Errorf("Emverax no devolvio session_id")
	}
	return out, nil
}

func (c *Emverax) consultarSesion(sessionID string) (SesionEmverax, error) {
	var out SesionEmverax
	err := c.do("GET", "/v2/sessions/"+sessionID, nil, &out)
	return out, err
}

func (c *Emverax) do(method, path string, body []byte, dest any) error {
	if c.apiKey == "" {
		return fmt.Errorf("falta IDANTITE_API_KEY en el servidor")
	}
	var rdr io.Reader
	if body != nil {
		rdr = bytes.NewReader(body)
	}
	req, err := http.NewRequest(method, c.baseURL+path, rdr)
	if err != nil {
		return err
	}
	req.Header.Set("X-API-Key", c.apiKey)
	req.Header.Set("X-Environment", c.environment)
	req.Header.Set("Accept", "application/json")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	res, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return fmt.Errorf("Emverax %s %s -> %d: %s", method, path, res.StatusCode, recortar(raw, 400))
	}
	if dest == nil || len(raw) == 0 {
		return nil
	}
	if err := json.Unmarshal(raw, dest); err != nil {
		return fmt.Errorf("respuesta Emverax no es JSON: %w", err)
	}
	return nil
}

func recortar(b []byte, n int) string {
	if len(b) <= n {
		return string(b)
	}
	return string(b[:n]) + "..."
}

func captureURL(base, sessionID, token string) string {
	return fmt.Sprintf("%s/?session=%s&t=%s", base, sessionID, token)
}
