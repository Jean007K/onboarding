package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"
)

// Solicitud es el expediente que GUARDA ESTA EMPRESA (Ayiti).
// Idantite no es nuestra base de datos. Lo que nos importa para el negocio
// queda aqui: quien es el cliente, si ya lo verificamos, y que datos nos
// devolvieron en el webhook.
type Solicitud struct {
	ID               string          `json:"id"`
	Nombre           string          `json:"nombre"`
	Apellido         string          `json:"apellido"`
	Email            string          `json:"email"`
	Telefono         string          `json:"telefono"`
	EndUserRef       string          `json:"end_user_ref"`
	SessionID        string          `json:"session_id"`
	ShareToken       string          `json:"share_token,omitempty"`
	Estado           string          `json:"estado"`
	Decision         string          `json:"decision"`
	Approved         bool            `json:"approved"`
	Scores           json.RawMessage `json:"scores,omitempty"`
	Reasons          json.RawMessage `json:"reasons,omitempty"`
	Extracted        json.RawMessage `json:"extracted_data,omitempty"`
	WebhookEvent     string          `json:"webhook_event"`
	WebhookRecibido  string          `json:"webhook_recibido_at"`
	CreatedAt        string          `json:"created_at"`
	UpdatedAt        string          `json:"updated_at"`
}

func openDB(path string) (*sql.DB, error) {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;`); err != nil {
		return nil, err
	}
	return db, migrate(db)
}

func migrate(db *sql.DB) error {
	_, err := db.Exec(`
CREATE TABLE IF NOT EXISTS solicitudes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL DEFAULT '',
  end_user_ref TEXT NOT NULL,
  session_id TEXT NOT NULL DEFAULT '',
  share_token TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'pendiente',
  decision TEXT NOT NULL DEFAULT '',
  approved INTEGER NOT NULL DEFAULT 0,
  scores_json TEXT NOT NULL DEFAULT '',
  reasons_json TEXT NOT NULL DEFAULT '',
  extracted_json TEXT NOT NULL DEFAULT '',
  webhook_event TEXT NOT NULL DEFAULT '',
  webhook_recibido_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_solicitudes_session ON solicitudes(session_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_email ON solicitudes(email);

CREATE TABLE IF NOT EXISTS webhook_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL DEFAULT '',
  session_id TEXT NOT NULL DEFAULT '',
  firma_ok INTEGER NOT NULL,
  payload TEXT NOT NULL,
  received_at TEXT NOT NULL
);
`)
	return err
}

func nowUTC() string {
	return time.Now().UTC().Format(time.RFC3339)
}

func newID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}

func insertSolicitud(db *sql.DB, s Solicitud) error {
	_, err := db.Exec(`
INSERT INTO solicitudes (
  id, nombre, apellido, email, telefono, end_user_ref, session_id, share_token,
  estado, decision, approved, scores_json, reasons_json, extracted_json,
  webhook_event, webhook_recibido_at, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		s.ID, s.Nombre, s.Apellido, s.Email, s.Telefono, s.EndUserRef, s.SessionID, s.ShareToken,
		s.Estado, s.Decision, boolToInt(s.Approved), rawOrEmpty(s.Scores), rawOrEmpty(s.Reasons), rawOrEmpty(s.Extracted),
		s.WebhookEvent, s.WebhookRecibido, s.CreatedAt, s.UpdatedAt,
	)
	return err
}

func updateSesion(db *sql.DB, id, sessionID, shareToken string) error {
	_, err := db.Exec(`UPDATE solicitudes SET session_id=?, share_token=?, estado=?, updated_at=? WHERE id=?`,
		sessionID, shareToken, "esperando_captura", nowUTC(), id)
	return err
}

func getSolicitud(db *sql.DB, id string) (Solicitud, error) {
	return scanSolicitud(db.QueryRow(`SELECT `+solicitudCols+` FROM solicitudes WHERE id=?`, id))
}

func getBySession(db *sql.DB, sessionID string) (Solicitud, error) {
	return scanSolicitud(db.QueryRow(`SELECT `+solicitudCols+` FROM solicitudes WHERE session_id=? ORDER BY created_at DESC LIMIT 1`, sessionID))
}

func listSolicitudes(db *sql.DB) ([]Solicitud, error) {
	rows, err := db.Query(`SELECT ` + solicitudCols + ` FROM solicitudes ORDER BY created_at DESC LIMIT 200`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Solicitud{}
	for rows.Next() {
		s, err := scanSolicitudRows(rows)
		if err != nil {
			return nil, err
		}
		// no devolvemos el share_token en el listado interno
		s.ShareToken = ""
		out = append(out, s)
	}
	return out, rows.Err()
}

const solicitudCols = `id, nombre, apellido, email, telefono, end_user_ref, session_id, share_token,
  estado, decision, approved, scores_json, reasons_json, extracted_json,
  webhook_event, webhook_recibido_at, created_at, updated_at`

func scanSolicitud(row *sql.Row) (Solicitud, error) {
	var s Solicitud
	var approved int
	var scores, reasons, extracted string
	err := row.Scan(
		&s.ID, &s.Nombre, &s.Apellido, &s.Email, &s.Telefono, &s.EndUserRef, &s.SessionID, &s.ShareToken,
		&s.Estado, &s.Decision, &approved, &scores, &reasons, &extracted,
		&s.WebhookEvent, &s.WebhookRecibido, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return s, err
	}
	s.Approved = approved == 1
	s.Scores = toRaw(scores)
	s.Reasons = toRaw(reasons)
	s.Extracted = toRaw(extracted)
	return s, nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanSolicitudRows(row rowScanner) (Solicitud, error) {
	var s Solicitud
	var approved int
	var scores, reasons, extracted string
	err := row.Scan(
		&s.ID, &s.Nombre, &s.Apellido, &s.Email, &s.Telefono, &s.EndUserRef, &s.SessionID, &s.ShareToken,
		&s.Estado, &s.Decision, &approved, &scores, &reasons, &extracted,
		&s.WebhookEvent, &s.WebhookRecibido, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return s, err
	}
	s.Approved = approved == 1
	s.Scores = toRaw(scores)
	s.Reasons = toRaw(reasons)
	s.Extracted = toRaw(extracted)
	return s, nil
}

func aplicarResultado(db *sql.DB, sessionID string, event string, decision string, approved bool, scores, reasons, extracted json.RawMessage) error {
	estado := estadoDesdeDecision(decision, approved)
	_, err := db.Exec(`
UPDATE solicitudes SET
  estado=?, decision=?, approved=?, scores_json=?, reasons_json=?, extracted_json=?,
  webhook_event=?, webhook_recibido_at=?, updated_at=?
WHERE session_id=?`,
		estado, decision, boolToInt(approved), rawOrEmpty(scores), rawOrEmpty(reasons), rawOrEmpty(extracted),
		event, nowUTC(), nowUTC(), sessionID,
	)
	return err
}

func estadoDesdeDecision(decision string, approved bool) string {
	switch decision {
	case "APPROVE":
		return "aprobado"
	case "REJECT":
		return "rechazado"
	case "REVIEW":
		return "revision"
	}
	if approved {
		return "aprobado"
	}
	if decision != "" {
		return "rechazado"
	}
	return "procesando"
}

func logWebhook(db *sql.DB, event, sessionID string, firmaOK bool, payload []byte) {
	_, _ = db.Exec(`INSERT INTO webhook_log (event, session_id, firma_ok, payload, received_at) VALUES (?, ?, ?, ?, ?)`,
		event, sessionID, boolToInt(firmaOK), string(payload), nowUTC())
}

func boolToInt(v bool) int {
	if v {
		return 1
	}
	return 0
}

func rawOrEmpty(r json.RawMessage) string {
	if len(r) == 0 {
		return ""
	}
	return string(r)
}

func toRaw(s string) json.RawMessage {
	if s == "" {
		return nil
	}
	return json.RawMessage(s)
}
