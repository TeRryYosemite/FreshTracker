# Food Expiration Date Calculator (Frontend)

A modern, responsive React application to track food expiration dates.

## Tech Stack
- **Framework:** Vite + React + TypeScript
- **Styling:** Tailwind CSS + Lucide Icons
- **State Management:** Zustand
- **HTTP Client:** Axios

## Features
- **Dashboard:** View food items with color-coded expiration status (Safe, Warning, Danger).
- **Smart Calculation:** Automatically calculates "Days Remaining".
- **Mock Mode:** Toggle between real backend and fake data for testing.
- **Configurable API:** Set your backend URL directly from the Settings page.

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   Navigate to `http://localhost:5173`

## Mock Mode vs Real Backend
By default, the app starts in **Mock Mode**.
- Go to **Settings** to disable Mock Mode and enter your real backend URL.
- The app expects a backend with standard REST endpoints (`/auth/login`, `/foods`, etc.).

## Project Structure
- `src/services/api.ts`: The core Service Layer that handles API calls and Mock switching.
- `src/store`: Zustand stores for Global State and Auth.
- `src/pages`: Route components.

