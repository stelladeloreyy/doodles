# Doodles Drawing App

This project is a web app where users can draw, submit their drawing, and view a public gallery. The backend uses PostgreSQL and is ready for future AI moderation of inappropriate content.

## Getting Started

### Frontend
- Built with Vite + React + TypeScript
- Run with:
  ```sh
  npm run dev
  ```

### Backend
- Node.js + Express + PostgreSQL
- Configure your PostgreSQL connection in `server/.env`:
  ```env
  DATABASE_URL=postgresql://user:password@localhost:5432/doodles
  PORT=4000
  ```
- Install dependencies and start the server:
  ```sh
  cd server
  npm install
  npm run dev
  ```

### Database
- Create the `drawings` table:
  ```sql
  CREATE TABLE drawings (
    id SERIAL PRIMARY KEY,
    drawing_data TEXT NOT NULL,
    text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

## Features
- Draw on a canvas and submit your art
- Public gallery of all submissions
- Backend ready for AI moderation integration

---
