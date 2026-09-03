package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"onboarding/identidad"
)

func TestNormalizaYCruzaConSQLite(t *testing.T) {
	db, err := openDB(filepath.Join(t.TempDir(), "t.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	id := newID()
	now := nowUTC()
	sol := Solicitud{
		ID:         id,
		Nombre:     identidad.NormalizarNombre("  jean  kenel "),
		Apellido:   identidad.NormalizarNombre("calixte "),
		RUT:        identidad.NormalizarRUT("25925129k"),
		Email:      "a@b.c",
		EndUserRef: "ayiti-test",
		SessionID:  "sess-1",
		Estado:     "esperando_captura",
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	if err := insertSolicitud(db, sol); err != nil {
		t.Fatal(err)
	}

	extracted := json.RawMessage(`{"nombres":"JEAN KENEL","apellidos":"CALIXTE","document_number":"B00.147.414","rut":"25.925.129-K"}`)
	if err := aplicarResultado(db, "sess-1", "verification.completed", "APPROVE", true, nil, nil, extracted); err != nil {
		t.Fatal(err)
	}
	got, err := getSolicitud(db, id)
	if err != nil {
		t.Fatal(err)
	}
	if got.Nombre != "Jean Kenel" || got.Apellido != "Calixte" || got.RUT != "25.925.129-K" {
		t.Fatalf("guardado mal: %+v", got)
	}
	if got.Identidad == nil || !got.Identidad.Coincide || !got.CuentaApta {
		t.Fatalf("cruce: %#v cuenta_apta=%v", got.Identidad, got.CuentaApta)
	}

	extractedBad := json.RawMessage(`{"nombres":"MARIA","apellidos":"LOPEZ","document_number":"A11.222.333","rut":"11.111.111-1"}`)
	if err := aplicarResultado(db, "sess-1", "verification.completed", "APPROVE", true, nil, nil, extractedBad); err != nil {
		t.Fatal(err)
	}
	got, _ = getSolicitud(db, id)
	if got.Identidad == nil || got.Identidad.Estado != identidad.EstadoNoCoincide || got.CuentaApta {
		t.Fatalf("mismatch: %#v cuenta_apta=%v", got.Identidad, got.CuentaApta)
	}
}

func TestCrearSolicitudRequiereRUT(t *testing.T) {
	db, err := openDB(filepath.Join(t.TempDir(), "t.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	h := newServer(Config{}, db)

	req := httptest.NewRequest(http.MethodPost, "/api/solicitudes", strings.NewReader(`{"nombre":"  jean ","apellido":"calixte","email":"a@b.c"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != 400 {
		t.Fatalf("sin RUT deberia ser 400, fue %d %s", rec.Code, rec.Body.String())
	}

	req2 := httptest.NewRequest(http.MethodPost, "/api/solicitudes", strings.NewReader(`{"nombre":"jean","apellido":"calixte","email":"a@b.c","rut":"25925129k"}`))
	req2.Header.Set("Content-Type", "application/json")
	rec2 := httptest.NewRecorder()
	h.ServeHTTP(rec2, req2)
	if rec2.Code != 503 {
		t.Fatalf("con RUT y sin API key deberia ser 503 (no pedir documento), fue %d %s", rec2.Code, rec2.Body.String())
	}
}

func TestHTTPWebhookFirmaYCruce(t *testing.T) {
	db, err := openDB(filepath.Join(t.TempDir(), "t.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	secret := "webhook-test-secret"
	h := newServer(Config{EmveraxWebhookSecret: secret}, db)

	id := newID()
	now := nowUTC()
	if err := insertSolicitud(db, Solicitud{
		ID: id, Nombre: "Jean Kenel", Apellido: "Calixte",
		RUT:   "25.925.129-K",
		Email: "a@b.c", EndUserRef: "ref", SessionID: "sess-http",
		Estado: "esperando_captura", CreatedAt: now, UpdatedAt: now,
	}); err != nil {
		t.Fatal(err)
	}

	body := webhookBody("sess-http", "APPROVE", true)
	req := httptest.NewRequest(http.MethodPost, "/webhooks/idantite", strings.NewReader(body))
	req.Header.Set("X-IDANTITE-Signature", signBody(secret, body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != 200 {
		t.Fatalf("webhook %d %s", rec.Code, rec.Body.String())
	}

	got, _ := getSolicitud(db, id)
	if got.Identidad == nil || !got.Identidad.Coincide || !got.CuentaApta {
		t.Fatalf("despues del webhook: %#v apta=%v", got.Identidad, got.CuentaApta)
	}

	getReq := httptest.NewRequest(http.MethodGet, "/api/solicitudes/"+id, nil)
	getRec := httptest.NewRecorder()
	h.ServeHTTP(getRec, getReq)
	if getRec.Code != 200 {
		t.Fatalf("GET %d %s", getRec.Code, getRec.Body.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(getRec.Body.Bytes(), &payload); err != nil {
		t.Fatal(err)
	}
	idMap, _ := payload["identidad"].(map[string]any)
	if idMap["estado"] != "coincide" || payload["cuenta_apta"] != true {
		t.Fatalf("json publico: %s", getRec.Body.String())
	}

	bad := httptest.NewRequest(http.MethodPost, "/webhooks/idantite", strings.NewReader(body))
	bad.Header.Set("X-IDANTITE-Signature", "ab")
	badRec := httptest.NewRecorder()
	h.ServeHTTP(badRec, bad)
	if badRec.Code != 401 {
		t.Fatalf("firma mala deberia ser 401, fue %d", badRec.Code)
	}
}

func webhookBody(session, decision string, approved bool) string {
	appr := "false"
	if approved {
		appr = "true"
	}
	return `{
  "event": "verification.completed",
  "session_id": "` + session + `",
  "data": {
    "session_id": "` + session + `",
    "decision": "` + decision + `",
    "approved": ` + appr + `,
    "extracted_data": {
      "nombres": "JEAN KENEL",
      "apellidos": "CALIXTE",
      "document_number": "B00.147.414",
      "rut": "25.925.129-K"
    }
  }
}`
}

func signBody(secret, body string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(body))
	return hex.EncodeToString(mac.Sum(nil))
}
