package main

import (
	"database/sql"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
)

type Server struct {
	cfg      Config
	db       *sql.DB
	idantite *Idantite
}

func newServer(cfg Config, db *sql.DB) http.Handler {
	s := &Server{cfg: cfg, db: db, idantite: newIdantite(cfg)}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", s.health)
	mux.HandleFunc("POST /webhooks/idantite", s.webhook)
	mux.HandleFunc("POST /api/solicitudes", s.crearSolicitud)
	mux.HandleFunc("GET /api/solicitudes/{id}", s.verSolicitud)
	mux.HandleFunc("GET /api/verificaciones", s.listar)
	mux.HandleFunc("GET /api/verificaciones/{id}", s.verSolicitud)
	mux.HandleFunc("POST /api/verificaciones/{id}/consultar", s.consultarIdantite)
	return withCORS(cfg.CORSOrigin, mux)
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]any{
		"ok":                    true,
		"servicio":              "ayiti-onboarding-api",
		"idantite_key":          s.cfg.IdantiteAPIKey != "",
		"idantite_webhook_secret": s.cfg.IdantiteWebhookSecret != "",
		"environment":           s.cfg.IdantiteEnvironment,
	})
}

type crearBody struct {
	Nombre   string `json:"nombre"`
	Apellido string `json:"apellido"`
	Email    string `json:"email"`
	Telefono string `json:"telefono"`
}

func (s *Server) crearSolicitud(w http.ResponseWriter, r *http.Request) {
	var in crearBody
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeErr(w, 400, "json invalido")
		return
	}
	in.Nombre = strings.TrimSpace(in.Nombre)
	in.Apellido = strings.TrimSpace(in.Apellido)
	in.Email = strings.TrimSpace(in.Email)
	in.Telefono = strings.TrimSpace(in.Telefono)
	if in.Nombre == "" || in.Apellido == "" || in.Email == "" {
		writeErr(w, 400, "faltan nombre, apellido o email")
		return
	}
	if s.cfg.IdantiteAPIKey == "" {
		writeErr(w, 503, "este servidor todavia no tiene la API key de Idantite")
		return
	}

	id := newID()
	now := nowUTC()
	ref := "ayiti-" + id[:12]
	sol := Solicitud{
		ID:         id,
		Nombre:     in.Nombre,
		Apellido:   in.Apellido,
		Email:      in.Email,
		Telefono:   in.Telefono,
		EndUserRef: ref,
		Estado:     "creando_sesion",
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	if err := insertSolicitud(s.db, sol); err != nil {
		log.Println("db insert:", err)
		writeErr(w, 500, "no se pudo guardar la solicitud")
		return
	}

	// return_url es a DONDE VUELVE EL NAVEGADOR. No es la fuente de verdad.
	returnURL := s.cfg.PublicAppURL + "/resultado?id=" + id
	ses, err := s.idantite.crearSesion(ref, returnURL)
	if err != nil {
		log.Println("crear sesion Idantite:", err)
		writeErr(w, 502, "Idantite no pudo crear la sesion: "+err.Error())
		return
	}
	if err := updateSesion(s.db, id, ses.SessionID, ses.ShareToken); err != nil {
		log.Println("db update sesion:", err)
		writeErr(w, 500, "sesion creada en Idantite pero no se pudo guardar aqui")
		return
	}

	writeJSON(w, 201, map[string]any{
		"id":           id,
		"end_user_ref": ref,
		"session_id":   ses.SessionID,
		"capture_url":  captureURL(s.cfg.IdantiteCaptureURL, ses.SessionID, ses.ShareToken),
		"return_url":   returnURL,
		"aviso":        "manda al usuario a capture_url. la decision real llega por webhook, no por el redirect",
	})
}

func (s *Server) verSolicitud(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	sol, err := getSolicitud(s.db, id)
	if err == sql.ErrNoRows {
		writeErr(w, 404, "no existe esa solicitud")
		return
	}
	if err != nil {
		writeErr(w, 500, "error leyendo sqlite")
		return
	}
	sol.ShareToken = ""
	writeJSON(w, 200, sol)
}

func (s *Server) listar(w http.ResponseWriter, r *http.Request) {
	list, err := listSolicitudes(s.db)
	if err != nil {
		writeErr(w, 500, "error listando sqlite")
		return
	}
	writeJSON(w, 200, map[string]any{"items": list})
}

// consultarIdantite es el plan B: si el webhook tarda, tu backend puede
// preguntar a Idantite GET /v2/sessions/:id con la API key.
func (s *Server) consultarIdantite(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	sol, err := getSolicitud(s.db, id)
	if err == sql.ErrNoRows {
		writeErr(w, 404, "no existe esa solicitud")
		return
	}
	if err != nil || sol.SessionID == "" {
		writeErr(w, 400, "esta solicitud no tiene session_id")
		return
	}
	ses, err := s.idantite.consultarSesion(sol.SessionID)
	if err != nil {
		writeErr(w, 502, err.Error())
		return
	}
	if ses.Decision != "" || ses.Status == "completed" || ses.Status == "failed" {
		_ = aplicarResultado(s.db, sol.SessionID, "consulta_api", ses.Decision, ses.Approved, ses.Scores, ses.Reasons, ses.Extracted)
	}
	sol2, _ := getSolicitud(s.db, id)
	sol2.ShareToken = ""
	writeJSON(w, 200, map[string]any{
		"solicitud": sol2,
		"idantite":  ses,
		"nota":      "esto es consulta a la API. el webhook sigue siendo la fuente de verdad para produccion",
	})
}

func (s *Server) webhook(w http.ResponseWriter, r *http.Request) {
	raw, err := io.ReadAll(r.Body)
	if err != nil {
		writeErr(w, 400, "no se pudo leer el body")
		return
	}
	sig := r.Header.Get("X-IDANTITE-Signature")
	ok := firmaValida(s.cfg.IdantiteWebhookSecret, raw, sig)
	var evt WebhookEvent
	_ = json.Unmarshal(raw, &evt)
	sessionID := evt.SessionID
	logWebhook(s.db, evt.Event, sessionID, ok, raw)

	if s.cfg.IdantiteWebhookSecret == "" {
		writeErr(w, 503, "este servidor todavia no tiene IDANTITE_WEBHOOK_SECRET")
		return
	}
	if !ok {
		writeErr(w, 401, "firma HMAC invalida")
		return
	}

	var data WebhookData
	if len(evt.Data) > 0 {
		_ = json.Unmarshal(evt.Data, &data)
	}
	if sessionID == "" {
		sessionID = data.SessionID
	}
	if sessionID == "" {
		writeJSON(w, 200, map[string]any{"received": true, "aviso": "evento sin session_id, solo se logueo"})
		return
	}

	decision := data.Decision
	approved := data.Approved
	_ = aplicarResultado(s.db, sessionID, evt.Event, decision, approved, data.Scores, data.Reasons, data.Extracted)

	// Si Idantite manda un evento de una sesion que no creamos, igual respondemos 200
	// para que no reintente forever. El log queda en webhook_log.
	writeJSON(w, 200, map[string]any{"received": true})
}

func withCORS(origin string, next http.Handler) http.Handler {
	allow := map[string]bool{}
	for _, o := range strings.Split(origin, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			allow[o] = true
		}
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reqOrigin := r.Header.Get("Origin")
		if allow[reqOrigin] {
			w.Header().Set("Access-Control-Allow-Origin", reqOrigin)
			w.Header().Set("Vary", "Origin")
		}
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(204)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]string{"error": msg})
}
