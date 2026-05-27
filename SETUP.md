# TeamSync-PBL Local Setup Guide

Welcome to the TeamSync-PBL project! Follow these instructions to run the fully-integrated application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher)
- **Git**
- A **PostgreSQL** database (e.g., [Neon](https://neon.tech/), [Render](https://render.com/), or local PostgreSQL)

## 1. Clone the Repository

If you haven't already, clone the project to your local machine:

```bash
git clone https://github.com/your-username/TeamSync-PBL.git
cd TeamSync-PBL
```

## 2. Backend Setup

The backend is built with Express.js and connects to PostgreSQL.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder and add your configuration:
   ```env
   # The port the backend will run on
   PORT=8000
   
   # Your Neon PostgreSQL connection string
   DATABASE_URL=postgresql://neondb_owner:npg_Ygl6MyWTb1xu@ep-late-voice-aqcz0txu.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
   
   # Secret key for signing JWT tokens (generate a random string)
   JWT_SECRET=super_secret_jwt_key_123
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *You should see a message indicating the server is running on port 8000.*

## 3. Frontend Setup

The frontend is a React application powered by Vite.

1. Open a **new terminal window** and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The Vite server will typically start on `http://localhost:5173/`.*

## 4. Test the Integration

1. Open your browser and navigate to the URL provided by Vite (e.g., `http://localhost:5173`).
2. **Register a new account**: Go to the login page and sign up. This tests the password hashing and user insertion in the database.
3. **Login**: Use the credentials you just created. You'll be redirected to the Home page.
4. **Create a Team**: Go to the "Teams" tab and click "Create Team". Enter some details and verify the team appears in your active list.
5. **Check your Profile**: Navigate to your profile and make some edits. Click "Save" and refresh the page to verify the changes persist in the database.

## Troubleshooting

- **Database Connection Error (ENOTFOUND/ETIMEDOUT):** Double-check your `DATABASE_URL` in the `.env` file. If you are using a managed service like Neon, ensure your IP address isn't being blocked by a firewall.
- **CORS Errors:** Ensure the backend `cors` configuration in `server.js` allows requests from your frontend's localhost port.
- **Unauthorized Errors (401):** Ensure your frontend is successfully storing the JWT token in `localStorage` under the key `token` after login.
