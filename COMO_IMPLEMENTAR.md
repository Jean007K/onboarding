# Como implementar Idantite en tu empresa

Esto es lo que tienes que armar del lado tuyo. El ejemplo de este repo es una version chica con Next y Go + SQLite. En produccion usas tu stack, pero el orden es el mismo.

## 1. Cosas que te da Idantite

En el panel (https://panel.genbia.qzz.io) creas la organizacion y sacas:

- Una API key de sandbox para probar.
- Una API key live cuando vayas a gente real.
- Un endpoint de webhook: URL tuya + un secret HMAC.

API de ellos: `https://api-go.genbia.qzz.io`
Captura: `https://validacion.genbia.qzz.io`

Header de maquina: `X-API-Key`.
Entorno: `X-Environment: sandbox` o `live`.

## 2. Infra minima tuya

Necesitas:

1. Un backend que pueda guardar un expediente (quien es la persona, `session_id`, estado).
2. Una URL HTTPS publica para el webhook. Idantite no acepta localhost ni IPs privadas.
3. Un lugar donde el usuario vuelve despues de la captura (`return_url`).
4. La API key y el webhook secret SOLO en el servidor. Env vars, vault, lo que uses. Nunca en el JS del browser.

SQLite sirve para este demo. En serio, usa Postgres o lo que ya tengas.

## 3. Crear la sesion (backend)

Cuando el usuario da "quiero verificarme":

```
POST https://api-go.genbia.qzz.io/v2/sessions
X-API-Key: TU_KEY
X-Environment: sandbox
Content-Type: application/json

{
  "end_user_ref": "cliente-interno-123",
  "workflow_type": "document_selfie",
  "return_url": "https://tu-app.com/resultado?id=TU_ID"
}
```

`end_user_ref` es TU identificador. Luego te vuelve en el webhook como `external_ref`. Asi cruzas su resultado con tu usuario.

Te responden `session_id` y `share_token`. Armas el link:

```
https://validacion.genbia.qzz.io/?session=SESSION_ID&t=SHARE_TOKEN
```

Redirect del browser a ese link. Listo. El usuario no ve tu API key.

## 4. Recibir el webhook (backend)

URL de este demo:

```
https://api.onboarding.ayiti.cc.cd/webhooks/idantite
```

En el panel de Idantite pegas esa URL y te dan un secret.

Cuando llega el POST:

1. Lee el body CRUDO (bytes). No lo parsees y lo vuelvas a serializar antes de firmar.
2. Header `X-IDANTITE-Signature` = hex(HMAC-SHA256(secret, body)).
3. Si no cuadra, responde 401. No guardes el resultado.
4. Si cuadra, parsea JSON, responde 200 rapido, guarda decision y datos.

Eventos que importan:

- `verification.completed` — ya hay decision automatica (APPROVE, REJECT o REVIEW).
- `verification.reviewed` — un humano decidio en el panel.
- `verification.resubmission_requested` — hay que volver a capturar.

Campos utiles dentro de `data`:

- `session_id`
- `external_ref` (el `end_user_ref` que tu mandaste)
- `decision` (`APPROVE` / `REJECT` / `REVIEW`)
- `approved` (true/false)
- `extracted_data` (OCR: nombre, documento, etc.)
- `scores` y `reasons`

Codigo Go de este repo: `backend/webhook.go` y `backend/http.go`.

## 5. Como saber si la persona paso

No uses la pantalla de captura como verdad. El usuario puede cerrar la pestaña, el redirect puede fallar, o alguien puede abrir el `return_url` a mano.

Regla:

- Si tu tabla dice `aprobado` porque llego un webhook con firma buena y `decision=APPROVE`, ahi si.
- Si quieres un plan B, tu backend llama `GET /v2/sessions/:id` con la API key y copia el estado. Este demo lo hace en `POST /api/verificaciones/{id}/consultar`.

Consultar despues: guarda `session_id` y `end_user_ref`. Con eso buscas en tu base, o vuelves a preguntar a Idantite.

## 6. Que NO hacer

- API key en Next, Vite, Android o iOS compilado.
- Confiar en query params tipo `?ok=1` al volver.
- Webhook HTTP (tiene que ser HTTPS).
- Rehacer el JSON antes de chequear HMAC.
- Mezclar key sandbox con datos live.

## 7. Checklist para pegar en el panel

- [ ] Organizacion creada
- [ ] API key sandbox copiada a `IDANTITE_API_KEY`
- [ ] Webhook URL: `https://api.onboarding.ayiti.cc.cd/webhooks/idantite`
- [ ] Secret del webhook copiado a `IDANTITE_WEBHOOK_SECRET`
- [ ] Eventos: completed, reviewed, resubmission_requested
- [ ] Probar health: `GET https://api.onboarding.ayiti.cc.cd/health`
- [ ] Hacer una solicitud de prueba y mirar `webhook_log` / expedientes
