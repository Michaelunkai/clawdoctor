# 🦞 ClawDoctor

**100% Free AI-Powered OpenClaw Diagnostics & Repair Tool**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

---

## 🚀 Quick Start

```bash
npx clawdoctor
```

That's it! Opens a web UI in your browser, automatically diagnoses your OpenClaw installation, and offers one-click fixes.

---

## ✨ Features

- **100% Free** - No paywalls, no subscriptions, no hidden costs
- **AI-Powered** - Uses OpenRouter API (auto-detects your existing OpenClaw API key)
- **Rule-Based Fallback** - Works even without AI, using deterministic diagnostics
- **Auto-Fix** - One-click repairs for common issues
- **Real-Time Progress** - See exactly what's happening via SSE streaming
- **Zero Config** - Just run it, no setup needed

---

## 🔍 What It Fixes

✅ Gateway not running  
✅ Port conflicts (18789)  
✅ Config file errors  
✅ Node.js version issues  
✅ LaunchAgent problems (macOS)  
✅ And more via AI analysis...

---

## 🛠 How It Works

1. **Observe** - Collects system diagnostics (openclaw status, logs, config, etc.)
2. **Diagnose** - Analyzes with AI (Claude Sonnet 4 via OpenRouter) or rule-based engine
3. **Repair** - Offers 1-3 fix options with risk levels
4. **Verify** - Confirms the fix worked

---

## 📋 Requirements

- Node.js 18+ 
- OpenClaw installed
- (Optional) OpenRouter API key in OpenClaw config for AI diagnostics

---

## 🎯 Why ClawDoctor?

**vs ClawAid:**
- ClawAid: $1.99 USD per fix (paywall)
- ClawDoctor: **100% FREE** (open source)

**Tech Stack:**
- TypeScript + Express + Vanilla JS
- OpenRouter API (Claude Sonnet 4)
- Rule-based fallback (no API needed)
- Server-Sent Events (SSE) for real-time updates

---

## 🔧 Development

```bash
# Clone
git clone https://github.com/Michaelunkai/clawdoctor.git
cd clawdoctor

# Install
npm install

# Build
npm run build

# Run locally
npm start
```

---

## 📦 Publishing to npm

```bash
npm run build
npm publish
```

---

## 🌐 Live Demo

**🚀 Deploy it yourself in 2 minutes:**

### Quick Deploy to Render (Free):
1. Click this button: [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)
2. Sign in with GitHub
3. Click "New +" → "Web Service" 
4. Connect this repo: `Michaelunkai/clawdoctor`
5. Render auto-detects `render.yaml` ✓
6. Click "Create Web Service"
7. Wait ~3 mins ⏱️
8. **Copy your live URL** (e.g., `https://clawdoctor-xxxxx.onrender.com`)
9. Come back here and replace this section with your URL!

**Or use:** Railway, Fly.io, Vercel (see DEPLOY.md for alternatives)

---

## 🤝 Contributing

PRs welcome! Add new diagnostic rules, improve AI prompts, or enhance the UI.

---

## 📄 License

MIT © 2026 ClawDoctor

---

## ⭐ Star This Repo

If ClawDoctor saved you $1.99 (or just saved your time), give it a star! 🌟

---

## 🙏 Credits

Inspired by ClawAid architecture, rebuilt from scratch as 100% free alternative.
