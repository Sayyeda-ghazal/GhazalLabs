# Ghazal Labs — Landing Page

Live: https://ghazal-labs.netlify.app

```
frontend/             Static site (HTML/CSS/JS)
netlify/functions/    API (Netlify Functions) — /api/contact, /api/health
netlify.toml          Publishes frontend/ and the functions
```

## Run locally

```bash
npm install
npm run dev               # http://localhost:8888 (site + API)
```

Email settings live in `.env` (not committed):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=you@gmail.com
SMTP_PASS=gmail-app-password
CONTACT_TO=you@gmail.com
```

## API
| Method | Route          | Description                          |
|--------|----------------|--------------------------------------|
| GET    | /api/health    | Health check                         |
| POST   | /api/contact   | Contact form (name, email, message…) — emailed to `CONTACT_TO` |

## Deploy

```bash
npm run deploy            # netlify deploy --prod (site + functions together)
```

Changed email settings? Update them on Netlify too:

```bash
npx netlify env:import .env
npm run deploy
```
