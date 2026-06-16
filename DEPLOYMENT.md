# DeepPulse AI Market-Making Agent - Full Deployment Guide

This guide walks you through deploying your complete application (frontend and backend) to free platforms!

---

## Overview
- **Frontend**: Deploy to Vercel (free, auto-scaling, easy)
- **Backend**: Deploy to Render (free web service for Python FastAPI apps)

---

## Prerequisites
1. GitHub/GitLab account (to host your code)
2. Vercel account (https://vercel.com)
3. Render account (https://render.com)

---

## Part 1: Prepare Your Code
First, make sure your code is committed to GitHub/GitLab!

1. Initialize git (if not already done):
   ```bash
   cd /Users/others/Documents/hackathon
   git init
   git add .
   git commit -m "Initial commit for DeepPulse"
   ```

2. Push to a new GitHub/GitLab repository (follow GitHub/GitLab instructions to create a repo and push code).

---

## Part 2: Deploy Backend to Render (Free)
1. Go to https://render.com and log in with GitHub/GitLab
2. Click "New +" → "Web Service"
3. Connect your GitHub/GitLab account and select your repo
4. Configure the web service:
   - **Name**: deeppulse-backend
   - **Environment**: Python
   - **Region**: Choose one close to you
   - **Branch**: main (or whatever your default branch is)
   - **Root Directory**: Leave blank (or set to `/`)
   - **Build Command**:
     ```
     cd backend && pip install -r requirements.txt
     ```
   - **Start Command**:
     ```
     cd backend && uvicorn app.main:app --host 0.0.0.0 --port 10000
     ```
   - **Plan**: Free (it's selected by default)

5. Add Environment Variables (under "Advanced" → "Environment Variables"):
   - `CORS_ORIGINS`: You can use `*` for now (we'll update later with frontend URL)
   - `APP_MODE`: `simulation`

6. Click "Create Web Service"
7. Wait a few minutes for Render to build and deploy your backend!

### Important: Save Your Backend URL!
Once deployed, Render will give you a URL like `https://deeppulse-backend.onrender.com` - **save this**, we'll need it for the frontend!

---

## Part 3: Deploy Frontend to Vercel (Free)
1. Go to https://vercel.com and log in with GitHub/GitLab
2. Click "Add New..." → "Project"
3. Select your GitHub/GitLab repo
4. Configure the project:
   - **Project Name**: deeppulse-frontend (or whatever you like)
   - **Framework Preset**: Vite (Vercel should auto-detect this)
   - **Root Directory**: Set to `frontend`
   - **Build Command**: `npm run build` (Vercel should auto-detect this)
   - **Output Directory**: `dist` (Vercel should auto-detect this)

5. Add Environment Variables:
   Click "Environment Variables" and add:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://your-render-backend-url.onrender.com/api` (replace with your actual backend URL from Part 2!)

6. Click "Deploy"! Wait a minute or two, Vercel will build and deploy your frontend!

### Optional: Update Backend CORS Origins
Once your frontend is deployed (you'll get a URL like `https://deeppulse-frontend.vercel.app`), go back to Render:
1. Go to your backend service
2. Click "Environment"
3. Update `CORS_ORIGINS` to your frontend URL(s):
   ```
   https://deeppulse-frontend.vercel.app,http://localhost:5173
   ```
4. Save and wait for Render to redeploy.

---

## Done! 🚀
You now have your full DeepPulse system live for free!
- Frontend: Your Vercel URL
- Backend: Your Render URL

---

## Troubleshooting
- **Backend takes too long to respond on first load**: Render free tier spins down inactive services - just wait a few seconds and it'll wake up!
- **CORS errors**: Double-check that your `CORS_ORIGINS` environment variable on Render includes your frontend URL!
- **API errors**: Check that `VITE_API_BASE_URL` on Vercel is correct (should end with `/api`!)
