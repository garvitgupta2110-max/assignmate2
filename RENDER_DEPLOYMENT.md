# Deploying AssignTantra to Render

This repository is pre-configured for automated and manual deployment on [Render](https://render.com).

---

## 🚀 Method 1: Automatic Deployment via Render Blueprint (Recommended)

Render Blueprint uses the [`render.yaml`](file:///c:/Users/garvi/OneDrive/Desktop/assignmate2/render.yaml) file to automatically provision and configure both the backend API and frontend web service simultaneously.

### Step-by-Step Instructions:

1. **Push your code to GitHub / GitLab**:
   ```bash
   git add .
   git commit -m "Configure Render deployment"
   git push origin main
   ```

2. **Open Render Dashboard**:
   - Go to [dashboard.render.com](https://dashboard.render.com/) and sign in.
   - Click the **New +** button in the top right.
   - Select **Blueprint**.

3. **Connect Repository**:
   - Select your AssignTantra repository.
   - Render will detect [`render.yaml`](file:///c:/Users/garvi/OneDrive/Desktop/assignmate2/render.yaml) automatically.

4. **Fill Required Environment Variables**:
   Render will prompt you for any un-synced variables. Fill in:
   - `MONGODB_URI`: Your MongoDB Atlas connection string (e.g., `mongodb+srv://<user>:<password>@cluster.mongodb.net/assigntantra?retryWrites=true&w=majority`).
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `NEXT_PUBLIC_GEMINI_API_KEY`: Same Gemini API key for the frontend.
   - `CLOUDINARY_*` / `FIREBASE_*`: Cloudinary and Firebase credentials (if using file uploads and client auth).

5. **Click "Apply"**:
   - Render will build and deploy both `assigntantra-backend` and `assigntantra-frontend`.
   - The frontend will automatically link to the backend service URL.

---

## 🛠️ Method 2: Manual Deployment (Individual Web Services)

If you prefer to configure each service manually in the Render dashboard:

### 1. Deploy the Backend API (`assigntantra-backend`)

1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your Git repository.
3. Configure the service settings:
   - **Name**: `assigntantra-backend`
   - **Region**: `Oregon (US West)` or your preferred region
   - **Root Directory**: `assignmate/backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Expand **Advanced**:
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: `Yes`
5. Under **Environment Variables**, add:
   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Required |
   | `MONGODB_URI` | `mongodb+srv://...` | From MongoDB Atlas |
   | `JWT_SECRET` | *(click Generate or enter a secure random string)* | Required |
   | `JWT_EXPIRY` | `7d` | Optional |
   | `FRONTEND_URL` | `https://assigntantra-frontend.onrender.com` | (Update after creating frontend) |
   | `GEMINI_API_KEY` | `your_gemini_key` | Optional / AI Tutor |
   | `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Optional |
   | `CLOUDINARY_API_KEY` | `your_api_key` | Optional |
   | `CLOUDINARY_API_SECRET` | `your_api_secret` | Optional |

6. Click **Create Web Service**. Note the backend URL (e.g., `https://assigntantra-backend.onrender.com`).

---

### 2. Deploy the Frontend (`assigntantra-frontend`)

1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your Git repository.
3. Configure the service settings:
   - **Name**: `assigntantra-frontend`
   - **Region**: Same region as backend (e.g. `Oregon`)
   - **Root Directory**: `assignmate/frontend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Under **Environment Variables**, add:
   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Required |
   | `NEXT_PUBLIC_API_URL` | `https://assigntantra-backend.onrender.com/api` | Your deployed backend URL |
   | `NEXT_PUBLIC_APP_URL` | `https://assigntantra-frontend.onrender.com` | Your deployed frontend URL |
   | `NEXTAUTH_SECRET` | *(click Generate or enter a random string)* | Required |
   | `NEXTAUTH_URL` | `https://assigntantra-frontend.onrender.com` | Frontend URL |
   | `NEXT_PUBLIC_GEMINI_API_KEY` | `your_gemini_key` | Optional |
   | `NEXT_PUBLIC_FIREBASE_*` | *(Your Firebase Config Keys)* | Optional |

5. Click **Create Web Service**.

---

## 🗄️ Database Setup (MongoDB Atlas)

Since Render's free tier does not host persistent MongoDB databases, use MongoDB Atlas (Free Tier):

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. Create a free **M0 Shared Cluster**.
3. Under **Security → Database Access**, create a user with read/write privileges.
4. Under **Security → Network Access**, add IP Access List: `0.0.0.0/0` (Allow access from anywhere, so Render instances can connect).
5. Under **Clusters → Connect → Drivers (Node.js)**, copy your connection string and set it as `MONGODB_URI`.

---

## ⚡ Important Production Features Included

- **Smart CORS Handling**: [`assignmate/backend/src/index.ts`](file:///c:/Users/garvi/OneDrive/Desktop/assignmate2/assignmate/backend/src/index.ts) dynamically accepts requests from Render (`*.onrender.com`), Vercel, Netlify, custom domains, and local development.
- **Robust Base URL Normalization**: [`assignmate/frontend/lib/api.ts`](file:///c:/Users/garvi/OneDrive/Desktop/assignmate2/assignmate/frontend/lib/api.ts) automatically resolves API URLs whether provided with or without the `/api` prefix.
- **Health Check**: Backend provides `GET /health` so Render can verify service availability and zero-downtime re-deploys.
- **Render Cache & Ignore Rules**: [`.renderignore`](file:///c:/Users/garvi/OneDrive/Desktop/assignmate2/.renderignore) configured to prevent uploading unnecessary artifacts and speed up build times.
