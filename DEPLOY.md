# 🚀 Deployment Instructions

## Option 1: Render (Recommended)

1. Go to https://render.com/
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Connect your `clawdoctor` repository
5. Render will auto-detect `render.yaml` and configure everything
6. Click "Create Web Service"
7. Wait ~3 minutes for deployment
8. Copy the live URL (e.g., `https://clawdoctor.onrender.com`)
9. Update README.md with the live link

**Free tier:** Yes! Render offers free hosting for web services.

---

## Option 2: Railway

1. Go to https://railway.app/
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `clawdoctor`
5. Railway auto-detects Node.js
6. Add environment variable: `PORT` = `3000` (optional, auto-set)
7. Deploy
8. Copy the live URL
9. Update README.md

**Free tier:** $5 credit/month (enough for this app)

---

## Option 3: Fly.io

```bash
cd F:\study\Dev_Toolchain\programming\typescript\clawdoctor
fly launch --name clawdoctor
fly deploy
fly open
```

**Free tier:** Yes!

---

## Option 4: Vercel (Serverless - Limited SSE Support)

**⚠ Warning:** Vercel's serverless functions have timeout limits (10s free, 60s pro). SSE streaming may not work reliably.

```bash
cd F:\study\Dev_Toolchain\programming\typescript\clawdoctor
npm install -g vercel
vercel login
vercel --prod
```

---

## After Deployment

1. Test the live URL
2. Update README.md:
   ```markdown
   ## 🌐 Live Demo
   
   **Try it now:** https://clawdoctor.onrender.com (or your deployment URL)
   ```
3. Commit and push:
   ```bash
   git add README.md
   git commit -m "Add live deployment link"
   git push
   ```

---

## Troubleshooting

**Issue:** Server starts but 502 Bad Gateway  
**Fix:** Check logs. Ensure PORT env variable is set.

**Issue:** Timeout on /api/diagnose  
**Fix:** Reduce AI timeout in diagnose.ts or use faster model.

**Issue:** "Cannot find module"  
**Fix:** Ensure `npm run build` completed successfully. Check dist/ folder exists.
