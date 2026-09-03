# Ayiti onboarding

Ejemplo de como una empresa cliente usa Emverax.

Hay dos piezas:

- `frontend` — Next.js. Formulario de apertura de cuenta y pantallas de resultado.
- `backend` — Go. Crea la sesion en Emverax, recibe el webhook, guarda en SQLite.

Esto no es el producto Emverax. Esto es el lado del cliente: lo que TU tienes que tener para mandar gente a verificar y enterarte si pasaron.

## URLs

- Web: https://onboarding.ayiti.cc.cd
- Como funciona (explicacion publica): https://onboarding.ayiti.cc.cd/como-funciona
- API: https://api.onboarding.ayiti.cc.cd
- Webhook (pegar esto en el panel de Emverax): https://api.onboarding.ayiti.cc.cd/webhooks/idantite

Captura de identidad (de ellos, no nuestra): https://verify.emverax.com

## Como se usa, en corto

1. El usuario llena nombres, apellidos, RUT y correo en nuestra web.
2. El backend limpia esos campos (espacios, mayusculas) y llama `POST /v2/sessions` con la API key. Nunca ponemos esa key en el navegador.
3. Mandamos al usuario a `verify.emverax.com/?session=...&t=...`.
4. El usuario se saca la selfie y la foto del documento ahi.
5. Emverax procesa y nos pega un webhook firmado a `/webhooks/idantite`.
6. Ademas de guardar la decision, el modulo `identidad` cruza el OCR con lo que el cliente escribio.
7. El usuario vuelve a `/resultado?id=...`. Esa pagina lee NUESTRA base: verificacion de Emverax y si los datos coinciden.

La fuente de verdad es el webhook. El `return_url` solo trae a la persona de vuelta.

## Local

Backend:

```
cd backend
copy .env.example .env
go test ./...
go run .
```

Frontend (otra terminal):

```
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

SQLite queda en `backend/data/onboarding.db`.

## Variables

Ver `backend/.env.example`. Las tres que importan:

- `IDANTITE_API_KEY` — la key de tu organizacion (sandbox o live).
- `IDANTITE_WEBHOOK_SECRET` — el secret que te da el panel al crear el webhook.
- `PUBLIC_APP_URL` — hacia donde vuelve el navegador.

## Docs

- [COMO_IMPLEMENTAR.md](COMO_IMPLEMENTAR.md) — paso a paso para otra empresa.
- [FLUJO.md](FLUJO.md) — que viaja en cada llamada.
