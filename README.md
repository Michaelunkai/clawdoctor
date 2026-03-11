# 🦞 ClawDoctor v2.0.0

**100% Free OpenClaw Diagnostics & Repair Tool**

ClawDoctor automatically diagnoses and fixes OpenClaw issues with a beautiful, user-friendly interface.

## ✨ What's Fixed in v2.0.0

### 1️⃣ **Useful Output** (No More Garbage)
- Clean, filtered logs showing only warnings and errors
- No verbose startup noise
- Human-readable messages
- Truncated long errors

### 2️⃣ **Real Fixes** (19 Diagnostic Checks)
- memory-context-bridge config cleanup
- Gateway startup automation
- Config initialization & repair
- Node.js version checking
- npm upgrade recommendations
- DNS & network diagnostics
- Hook loading error detection
- Permission fixes
- And 11 more checks!

### 3️⃣ **Beautiful UI** (Like ClawAid)
- Dark theme (#0a0a0a background)
- Clean, minimal design
- Emoji scan steps
- Color-coded severity
- Fix summary with counts
- Smooth animations

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Run
npm start
```

The browser will automatically open at `http://localhost:8888`

## 🎯 Features

- **19 Diagnostic Checks** covering all common OpenClaw issues
- **7 Automatic Fixes** that can be applied with one click
- **Smart Log Filtering** - only shows relevant warnings/errors
- **Beautiful Dark UI** - matching ClawAid's aesthetic
- **Fix Summaries** - clear success/fail counts
- **Feedback System** - report if fixes worked

## 🩺 What It Detects

### Critical Issues
- OpenClaw not installed
- Gateway not running
- Config file missing or corrupted
- Old Node.js version
- Permission errors

### Warnings
- memory-context-bridge plugin config leftover
- Doctor detected issues
- Recent errors in logs
- Low disk space
- DNS resolution failures
- Failed hook loading
- Network binding issues
- npm outdated

### Info
- State directory migration
- No extensions installed
- Too many extensions
- TLS warnings (safe)
- Unknown hook types

## 🔧 Automatic Fixes

ClawDoctor can automatically fix:
1. Remove unused plugin configs (`memory-context-bridge`)
2. Start OpenClaw gateway
3. Initialize OpenClaw configuration
4. Repair corrupted config files
5. Run `openclaw doctor` to fix issues
6. Restart gateway to clear errors
7. And more!

## 📊 Comparison with ClawAid

| Feature | ClawAid | ClawDoctor v2.0.0 |
|---------|---------|-------------------|
| **Price** | $1.99/fix | **100% FREE** ✅ |
| **Diagnostic Checks** | ~10 | **19** ✅ |
| **Automatic Fixes** | Few | **7+** ✅ |
| **UI Quality** | Good | **Beautiful** ✅ |
| **Output Quality** | Technical | **User-Friendly** ✅ |
| **Open Source** | No | **Yes (MIT)** ✅ |

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in dev mode
npm start

# Test locally
npm test
```

## 📁 Project Structure

```
clawdoctor/
├── src/
│   ├── index.ts          # CLI entry point
│   ├── server.ts         # Express server & SSE
│   ├── observe.ts        # System data collection
│   ├── diagnose.ts       # Issue detection (19 checks)
│   ├── execute.ts        # Fix execution
│   ├── report.ts         # Report generation
│   ├── scheduler.ts      # Scheduled health checks
│   ├── performance.ts    # Performance monitoring
│   └── cache.ts          # Diagnostic caching
├── web/
│   ├── index.html        # Clean dark UI
│   ├── style.css         # Dark theme styles
│   └── app.js            # Frontend logic
└── package.json
```

## 🌟 Key Improvements Over v1.0.0

- ✅ **No more garbage output** - filtered, clean logs
- ✅ **Real fixes** - 19 checks, 7 automatic fixes
- ✅ **Beautiful UI** - dark theme like ClawAid
- ✅ **Smart truncation** - long errors limited to 150 chars
- ✅ **Fix summaries** - success/fail counts
- ✅ **Better UX** - emoji steps, smooth animations

## 📝 License

MIT License - 100% Free Forever

## 🔗 Links

- **GitHub:** https://github.com/Michaelunkai/clawdoctor
- **Issues:** https://github.com/Michaelunkai/clawdoctor/issues
- **OpenClaw:** https://docs.openclaw.ai

---

**Made with ❤️ for the OpenClaw community**
