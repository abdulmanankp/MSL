# Deployment Guide: MSL Membership System

## 1. Overview
This guide explains how to deploy the frontend (React/Vite) and backend (Express.js) on separate domains, and how to configure environment variables for seamless integration.

---

## 2. Backend (Express.js) Deployment

### a. Prerequisites
- Node.js 18+ installed
- A server or cloud instance (e.g., VPS, DigitalOcean, AWS EC2)
- Domain: `mslpakistan.online`

### b. Steps
1. **Clone the repository**
   ```sh
   git clone <your-repo-url>
   cd <project-folder>
   ```
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Configure environment variables**
   - Edit `.env`:
     ```env
     API_URL=https://mslpakistan.online
     # ...other backend variables...
     ```
4. **Start the server**
   ```sh
   npm run start
   # or
   node server.js
   ```
5. **(Optional) Set up a process manager**
   - Use PM2 or similar to keep the server running:
     ```sh
     npm install -g pm2
     pm2 start server.js --name msl-backend
     pm2 save
     pm2 startup
     ```
6. **Configure your domain**
   - Point `mslpakistan.online` to your server's IP.
   - Set up HTTPS (Let's Encrypt or your provider).

---

## 3. Frontend (React/Vite) Deployment

### a. Prerequisites
- Node.js 18+ installed (for build step)
- Static hosting (e.g., Netlify, Vercel, Hostinger, cPanel, or your own server)
- Domain: `join.mslpakistan.org`

### b. Steps
1. **Clone the repository**
   ```sh
   git clone <your-repo-url>
   cd <project-folder>
   ```
2. **Configure environment variables**
   - Edit `.env`:
     ```env
     VITE_API_URL=https://mslpakistan.online
     # ...other frontend variables...
     ```
3. **Build the frontend**
   ```sh
   npm install
   npm run build
   ```
4. **Deploy the `dist` folder**
   - Upload the contents of the `dist` folder to your static host or web server root for `join.mslpakistan.org`.
   - If using cPanel/Hostinger: upload to `public_html` or the correct subdomain folder.
   - If using Netlify/Vercel: follow their deployment instructions.

5. **Configure your domain**
   - Point `join.mslpakistan.org` to your static hosting provider.
   - Set up HTTPS.

---

## 4. Integration Notes
- The frontend will call all backend APIs using `VITE_API_URL`.
- The backend will generate all public URLs using `API_URL`.
- If you change the backend domain, update both `.env` files and redeploy/restart.

---

## 5. Troubleshooting
- **CORS errors:** Ensure backend CORS allows the frontend domain.
- **API not reachable:** Check that `API_URL` and `VITE_API_URL` are correct and HTTPS is enabled.
- **Uploads not accessible:** Make sure backend returns full URLs and static files are served.

---

## 6. Example .env Files

### Backend (.env)
```
API_URL=https://mslpakistan.online
# ...other backend variables...
```

### Frontend (.env)
```
VITE_API_URL=https://mslpakistan.online
# ...other frontend variables...
```

---

For further help, contact your developer or deployment provider.
