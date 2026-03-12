# General Checklist App

Two-folder structure:

- **frontend** – React (Vite) app
- **backend** – Node.js (Express + MongoDB) API

## Full setup and run

1. **MongoDB**  
   Install and start MongoDB on `localhost:27017` (default). The app uses database `mrd_audit`.

2. **Backend**
   - `cd backend`
   - Copy `backend\.env.example` to `backend\.env` (or use the existing `.env` for local dev).
   - `npm install`
   - `npm run dev` → API at http://localhost:5000

3. **Frontend**
   - `cd frontend`
   - `npm install`
   - `npm run dev` → App at http://localhost:5173

4. **Optional: seed database**  
   With backend and MongoDB running: `cd backend` then `npm run seed`.

5. **One-command start (from project root)**  
   Starts both backend and frontend in separate windows:
   ```powershell
   .\run-local.ps1
   ```
   First-time: `.\run-local.ps1 -InstallDeps`

- Backend: http://localhost:5000  
- Frontend: http://localhost:5173  

## Other scripts

PowerShell scripts (backup, restore, env setup, cleanup, SSL) are under **backend/scripts/run/** and resolve paths from the project root. Run them from that folder, for example:

```powershell
cd backend\scripts\run
.\backup-mongodb.ps1
.\setup-env.ps1
.\cleanup.ps1
```

Or from project root by calling the script explicitly:

```powershell
.\backend\scripts\run\backup-mongodb.ps1
```
