# GlobeTrotter - Multi-City Travel Planner

GlobeTrotter is a web application that helps travelers plan multi-city trips end-to-end. You can build structured itineraries, track budgets, visualize plans on a calendar, and share plans with others.

## Project Structure

- `backend/`: FastAPI application, database models, and LLM services.
- `frontend/`: React + TypeScript + Vite application.
- `docs/`: Product Requirements Document (PRD), Architecture details, and database diagrams.

## Quick Start (with Docker Compose)

The easiest way to run the entire stack (database, backend, and frontend) is using Docker Compose:

```bash
# Clone the repository and run:
docker-compose up --build
```

- **Frontend:** http://localhost:5173
- **Backend API Docs:** http://localhost:8000/docs
- **Backend Health Check:** http://localhost:8000/health
- **Postgres Database:** localhost:5432 (credentials inside `docker-compose.yml`)

## Local Development (without Docker)

If you prefer to run the applications locally, follow the instructions below.

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows (PowerShell):
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - On Unix/macOS:
     ```bash
     source venv/bin/activate
     ```

4. Install the backend dependencies:
   ```bash
   pip install --upgrade pip
   ```
   For local development:
   ```bash
   pip install -r requirements.txt
   ```

5. Copy the environment template and set up your local `.env` values:
   ```bash
   cp .env.example .env
   ```

6. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment template and set up your local `.env` values:
   ```bash
   cp .env.example .env
   ```

4. Run the Vite development server:
   ```bash
   npm run dev
   ```
