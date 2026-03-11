# 🦞 ClawDoctor

**100% Free AI-Powered OpenClaw Diagnostics & Repair Tool**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

---

## 🚀 Quick Start

```bash
npx clawdoctor
```

Opens a clean web UI with two powerful buttons:

### 🔍 **Diagnose Button**
- Scans your entire OpenClaw setup
- Shows human-readable results
- Lists all detected issues
- Provides step-by-step fix options
- You choose what to fix

### ⚡ **Scan & Fix Button** 
- Automatically scans your system
- Finds all issues
- **Auto-executes low-risk fixes**
- Only safe fixes (no data loss)
- Verifies fixes worked

**Choose your style:** Manual control (Diagnose) or full automation (Scan & Fix)!

---

## ✨ Features

- **100% Free** - No paywalls, no subscriptions, no hidden costs
- **AI-Powered** - Uses OpenRouter API (auto-detects your existing OpenClaw API key)
- **Rule-Based Fallback** - Works even without AI, using deterministic diagnostics
- **Auto-Fix** - One-click repairs for common issues
- **Real-Time Progress** - See exactly what's happening via SSE streaming
- **Zero Config** - Just run it, no setup needed

---

## 🔍 What It Checks (17+ Diagnostic Rules)

### Critical Issues:
✅ OpenClaw installation status  
✅ Gateway running state  
✅ Config file exists & valid JSON  
✅ Node.js version (v18+ required)  
✅ File permissions on .openclaw directory  
✅ CLI commands accessible in PATH  

### Warnings:
✅ Port conflicts (18789)  
✅ Doctor-detected issues  
✅ Error logs presence  
✅ Low disk space  
✅ LaunchAgent missing (macOS)  
✅ npm version outdated  
✅ Version mismatches  
✅ Missing package.json  

### Info:
✅ Proxy environment variables  
✅ Memory usage  
✅ Process status  
✅ Recent log analysis

---

## 🛠 How It Works

1. **Observe** - Collects 20+ system metrics:
   - OpenClaw version & status
   - Gateway state & processes
   - Config file validation
   - Log file analysis (error detection)
   - Disk space & memory
   - Environment variables
   - File permissions
   - Platform-specific checks (LaunchAgent/Services)

2. **Diagnose** - Runs 17 diagnostic rules:
   - Rule-based checks (always works)
   - AI analysis (if OpenRouter API key available)
   - Severity classification (Critical/Warning/Info)

3. **Repair** - Offers smart fixes:
   - `openclaw gateway start` - Start stopped gateway
   - `openclaw doctor --yes` - Auto-repair config issues  
   - `openclaw gateway restart` - Clear transient problems
   - `openclaw gateway install --force` - Fix LaunchAgent (macOS)
   - Permission fixes (Windows/macOS/Linux)
   - All fixes use official OpenClaw CLI (safe!)

4. **Verify** - Multi-check validation:
   - OpenClaw status
   - Gateway health
   - Config file integrity
   - Port availability

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
