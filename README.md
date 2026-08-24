# Ayiti onboarding

Ejemplo de como una empresa cliente usa Idantite.

Hay dos piezas:

- `frontend` — Next.js. Formulario de apertura de cuenta y pantallas de resultado.
- `backend` — Go. Crea la sesion en Idantite, recibe el webhook, guarda en SQLite.

Esto no es el producto Idantite. Esto es el lado del cliente: lo que TU tienes que tener para mandar gente a verificar y enterarte si pasaron.

## URLs

- Web: https://onboarding.ayiti.cc.cd
- API: https://api.onboarding.ayiti.cc.cd
- Webhook (pegar esto en el panel de Idantite): https://api.onboarding.ayiti.cc.cd/webhooks/idantite

Captura de identidad (de ellos, no nuestra): https://validacion.genbia.qzz.io

## Como se usa, en corto

1. El usuario llena nombre, apellido y correo en nuestra web.
2. Nuestro backend llama `POST /v2/sessions` con la API key. Nunca ponemos esa key en el navegador.
3. Mandamos al usuario a `validacion.genbia.qzz.io/?session=...&t=...`.
4. El usuario se saca la selfie y la foto del documento ahi.
5. Idantite procesa y nos pega un webhook firmado a `/webhooks/idantite`.
6. El usuario vuelve a `/resultado?id=...`. Esa pagina lee NUESTRA base, no cree en el redirect.

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
