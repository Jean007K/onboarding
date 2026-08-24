# Flujo

```
Usuario                  Nuestra web (Next)           Nuestro backend (Go)              Idantite
  |                              |                              |                            |
  |  llena el formulario         |                              |                            |
  |----------------------------->|  POST /api/solicitudes       |                            |
  |                              |----------------------------->|  guarda expediente SQLite  |
  |                              |                              |  POST /v2/sessions         |
  |                              |                              |--------------------------->|
  |                              |                              |  session_id + share_token  |
  |                              |  capture_url                 |<---------------------------|
  |  redirect a captura          |<-----------------------------|                            |
  |<-----------------------------|                              |                            |
  |  selfie + documento          |                              |                            |
  |----------------------------------------------------------------------------------------->|
  |                              |                              |     procesa ML             |
  |  (opcional) ve resultado     |                              |                            |
  |  corto y vuelve a return_url |                              |                            |
  |----------------------------->|                              |                            |
  |  /resultado?id=...           |  GET /api/solicitudes/:id    |                            |
  |                              |----------------------------->|                            |
  |                              |                              |   POST /webhooks/idantite  |
  |                              |                              |<---------------------------|
  |                              |                              |   verifica HMAC            |
  |                              |                              |   actualiza SQLite         |
  |  pantalla aprobado/no        |  poll hasta que haya estado  |                            |
```

## Endpoints de este backend

| Metodo | Ruta | Para que |
|--------|------|----------|
| GET | /health | ver si el proceso vive y si ya hay key/secret |
| POST | /api/solicitudes | crea expediente local + sesion Idantite |
| GET | /api/solicitudes/:id | estado que nosotros guardamos |
| GET | /api/verificaciones | listado interno |
| GET | /api/verificaciones/:id | detalle con OCR y scores |
| POST | /api/verificaciones/:id/consultar | pregunta a Idantite GET /v2/sessions/:id |
| POST | /webhooks/idantite | lo llama Idantite, no el browser |

## Firma webhook

```
X-IDANTITE-Signature = hex( HMAC-SHA256( IDANTITE_WEBHOOK_SECRET, rawBody ) )
```

Si cambias una coma del JSON, la firma deja de servir. Por eso el handler lee `io.ReadAll(r.Body)` primero.

## Estados que guardamos nosotros

- `creando_sesion` / `esperando_captura` — todavia no hay decision
- `aprobado` — decision APPROVE (Idantite). No implica que los datos del formulario coincidan.
- `rechazado` — decision REJECT
- `revision` — decision REVIEW (un humano en el panel de ellos)
- `procesando` — llego algo sin decision clara

## Cruce de identidad (modulo `identidad`)

Cuando llega el webhook (o una consulta a la API), el backend compara lo declarado con `extracted_data`:

- nombres
- apellidos
- numero de identidad (`document_number`)
- RUT

Espacios, mayusculas y acentos no cuentan como diferencia. Un nombre mas corto que el del documento ("Jean" vs "JEAN KENEL") si coincide; un nombre de mas, no.

El JSON de cada expediente trae `identidad` (estado `coincide` / `no_coincide` / `incompleto`) y `cuenta_apta` (true solo si Idantite aprobo Y el cruce coincide).
