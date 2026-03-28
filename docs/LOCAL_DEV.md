# Local development (frontend + backend + face-tagging)

## Default ports

| App            | URL                    |
|----------------|------------------------|
| Admin UI (Vite)| http://127.0.0.1:5173  |
| Spring API     | http://127.0.0.1:8080  |
| Face-tagging   | http://127.0.0.1:8081  |

## 1. Backend (local profile)

From `momentsBackend`:

```bash
export SPRING_PROFILES_ACTIVE=local
mvn spring-boot:run
```

Face-tagging base URL defaults to `http://127.0.0.1:8081` in `application-local.properties`. See `momentsBackend/docs/LOCAL_DEV.md` for overrides.

## 2. Face-tagging service

Start your face-embedding service so it listens on **8081** (or change both `application-local.properties` and `.env.development` to match).

The Spring app calls:

- `POST {face.tagging.service.url}/api/v1/face-embeddings/moments/batch`

## 3. Frontend

From `moments.github.io`:

```bash
npm install
npm run dev
```

`npm run dev` loads **`.env.development`**, which sets:

- `VITE_API_BASE_URL=http://127.0.0.1:8080`
- `VITE_FACE_TAGGING_BASE_URL=http://127.0.0.1:8081`

### Production builds

`npm run build` does **not** load `.env.development`. If you do not add `.env.production`, `src/config/api.js` falls back to the same production URLs as before (Cloud Run).

### Overrides

Copy `.env.example` to **`.env.local`** (gitignored) and adjust ports:

```env
VITE_API_BASE_URL=http://127.0.0.1:9090
VITE_FACE_TAGGING_BASE_URL=http://127.0.0.1:5000
```

## Quick test

1. Backend up on 8080 with profile `local`.
2. Face-tagging up on 8081 (or aligned ports everywhere).
3. `npm run dev`, open http://127.0.0.1:5173/admin/login — flows hit local API.

If face-tagging is down, moment saves still work; batch tagging calls will fail until the service is up.

## Browser → face-tagging (rotate, etc.)

`EventDetails` calls the face-tagging API **from the browser**. Your local face-tagging app must allow CORS from `http://127.0.0.1:5173` and `http://localhost:5173` (or the Vite port you use). Server-to-server calls from Spring Boot do not need that CORS rule.
