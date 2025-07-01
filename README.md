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

## How to Set Up PostgreSQL Database

1. **Install PostgreSQL**
   - Download and install PostgreSQL from [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
   - During installation, set a password for the `postgres` superuser and remember it.

2. **Open the PostgreSQL command line tool**
   - On Windows, open `SQL Shell (psql)` from your Start menu.
   - When prompted, enter:
     - Server: `localhost` (press Enter)
     - Database: `postgres` (press Enter)
     - Port: `5432` (press Enter)
     - Username: `postgres` (press Enter)
     - Password: (enter the password you set during installation)

3. **Create a new database**
   - At the `psql` prompt, run:
     ```sql
     CREATE DATABASE doodles;
     ```

4. **Connect to your new database**
   - Run:
     ```sql
     \c doodles
     ```

5. **Create the `drawings` table**
   - Run:
     ```sql
     CREATE TABLE drawings (
       id SERIAL PRIMARY KEY,
       drawing_data TEXT NOT NULL,
       text TEXT,
       created_at TIMESTAMP DEFAULT NOW()
     );
     ```

6. **Configure your `.env` file**
   - Open `server/.env` and set:
     ```env
     DATABASE_URL=postgresql://postgres:<your_password>@localhost:5432/doodles
     PORT=4000
     ```
   - Replace `<your_password>` with the password you set for the `postgres` user.

7. **Test your connection**
   - Start your backend server:
     ```sh
     cd server
     npm run dev
     ```
   - You should see `Server running on port 4000` if everything is set up correctly.

## Features
- Draw on a canvas and submit your art
- Public gallery of all submissions
- Backend ready for AI moderation integration

---
