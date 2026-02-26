# Running with Docker

## Quick start

From the project root (`Gen_CL`):

```bash
docker compose up --build
```

- **App (frontend):** http://localhost  
- **API:** proxied at http://localhost/api (backend runs inside Docker, no direct port exposed).

Default admin (created on first run): **admin@hospital.com** / **TataTiago@2026**

## Seed data (optional)

To populate departments, users, locations, shifts, forms, and submissions:

```bash
docker compose exec backend node src/scripts/seedAllScreens.js --reset
```

## Stop

```bash
docker compose down
```

To remove the MongoDB data volume as well:

```bash
docker compose down -v
```

## Environment (docker-compose)

Backend receives:

- `MONGO_URI=mongodb://mongo:27017/gen_cl`
- `JWT_SECRET` (set in docker-compose.yml)
- `CORS_ORIGIN=http://localhost` (must match the URL you use to open the app)

To change port (e.g. frontend on 8080), in `docker-compose.yml` set `frontend.ports` to `"8080:80"` and use http://localhost:8080; set `CORS_ORIGIN=http://localhost:8080`.
