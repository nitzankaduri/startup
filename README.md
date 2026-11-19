# Spawn.gg

AI prompt-to-3D-game studio built with React (pure `.jsx`), Tailwind CSS, React Three Fiber, Rapier Physics, FastAPI, and MongoDB.

---

## Local Development

### 1. Backend (`/backend`)
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate | macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```
- If `MONGO_URI` is unreachable locally, the API safely falls back to an in-memory store.
- If `GEMINI_API_KEY` is omitted, the generator returns a deterministic balanced 3D preset level.

### 2. Frontend (`/frontend`)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`. Set `VITE_API_URL` if your backend runs on a non-default origin.

---

## One-Click Deployment on Render.com

1. Push this repository to GitHub or GitLab.
2. In the Render Dashboard, choose **New + -> Blueprint** and select this repository (`render.yaml` is at the root).
3. Configure environment variables when prompted:
   - **`spawn-gg-api`**:
     - `MONGO_URI`: MongoDB Atlas connection string
     - `GEMINI_API_KEY`: Google Gemini API key
     - `FRONTEND_URL`: Deployed URL of `spawn-gg-web` (e.g., `https://spawn-gg-web.onrender.com`)
   - **`spawn-gg-web`**:
     - `VITE_API_URL`: Deployed URL of `spawn-gg-api` (e.g., `https://spawn-gg-api.onrender.com`)
4. Deploy both services. The static site rewrite rule (`/* -> /index.html`) ensures `/play/:id` share links resolve cleanly.
