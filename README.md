# Ghazal Labs — Landing Page

```
frontend/   Static site (HTML/CSS/JS)  → deploy on Netlify
backend/    Node + Express API          → deploy on Heroku
```

## Run locally

```bash
# backend
cd backend
cp .env.example .env      # edit values if needed
npm install
npm run dev               # http://localhost:5000

# frontend (new terminal)
cd frontend
python3 -m http.server 3000   # http://localhost:3000
```

## API
| Method | Route          | Description                          |
|--------|----------------|--------------------------------------|
| GET    | /api/health    | Health check                         |
| GET    | /api/stats     | Sample dashboard numbers             |
| POST   | /api/contact   | Contact form (name, email, message…) |

Contact form submissions are logged; if SMTP env vars are set, they are also emailed to `CONTACT_TO`.

## Deploy backend on Heroku

```bash
cd backend
git init && git add . && git commit -m "Ghazal Labs API"
heroku login
heroku create ghazal-labs-api
heroku config:set ALLOWED_ORIGINS=https://YOUR-SITE.netlify.app
# optional email:
heroku config:set SMTP_HOST=smtp.gmail.com SMTP_PORT=465 SMTP_USER=you@gmail.com SMTP_PASS=app-password CONTACT_TO=you@gmail.com
git push heroku main       # or master
heroku open /api/health
```

## Deploy frontend on Netlify

1. Put your Heroku URL in `frontend/config.js` (replace `https://YOUR-HEROKU-APP.herokuapp.com`).
2. Either drag-and-drop the `frontend` folder at https://app.netlify.com/drop,
   or connect the repo and set **Base directory** = `frontend`, **Publish directory** = `.` (no build command).
3. Copy the Netlify URL and set it in Heroku's `ALLOWED_ORIGINS`.
