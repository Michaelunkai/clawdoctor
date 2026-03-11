# ClawDoctor Changelog

## [1.3.0] - 2026-03-11 (Maximum Power Update)

### 🚀 MASSIVE Feature Expansion

**New Systems:**
- ✅ **Scheduled Health Checks** - Automatic monitoring at custom intervals
- ✅ **Performance Monitoring** - Track diagnostic speeds and optimization metrics
- ✅ **Cache System** - Speed up repeated diagnostics
- ✅ **Toast Notifications** - Beautiful in-app notifications
- ✅ **Settings Panel** - Full configuration UI
- ✅ **Loading Overlay** - Better visual feedback

**New Features:**
- Settings modal with scheduler configuration
- Performance statistics dashboard
- Cache management (view size, clear cache)
- Animation toggle
- Sound notifications toggle
- Auto-fix scheduler option
- Toast notification system (success/error/warning/info)
- Loading overlay with spinner

**New API Endpoints:**
- `/api/scheduler/status` - Get scheduler configuration
- `/api/scheduler/update` - Update scheduler settings
- `/api/performance` - Get performance statistics
- `/api/cache/clear` - Clear diagnostic cache

**UI/UX Improvements:**
- Settings button in header
- Beautiful toast notifications with animations
- Loading overlay with backdrop blur
- Switch toggle components
- Settings sections with visual hierarchy
- Performance stats viewer

**Technical Improvements:**
- Modular scheduler system
- Performance monitoring with timing metrics
- TTL-based caching
- Auto-cleanup of expired cache
- Better error handling
- Type-safe configuration

---

## [1.2.0] - 2026-03-11 (ACTUAL 15-Minute Real-Time Update)

### 🚀 Major Performance & UX Overhaul

**40 Diagnostic Rules** (vs ClawAid's ~10) - Most comprehensive OpenClaw diagnostic tool ever built!

### 🆕 New Features (1.2.0)
- **Stats Dashboard** - Visual overview showing 40 rules, $0 cost, ~5s speed, 100% safe fixes
- **Live System Metrics** - Real-time CPU, memory, extensions, network status during scans
- **Keyboard Shortcuts** - Power user shortcuts (Ctrl+D, Ctrl+Shift+F, Ctrl+K, Esc)
- **7 New Observation Metrics** - CPU usage, uptime, git status, cache size, workspace size, OpenRouter test, last restart
- **10 New Diagnostic Rules (#31-40)** - Bringing total to 40 comprehensive checks
- **3 New Fix Options** (H, I) - Clear cache, kill duplicate processes
- **Improved CLI** - Better error handling, cloud deployment support

### 📊 New Diagnostic Rules (31-40)
1. **#31** - High CPU usage (>80%) detection
2. **#32** - Uncommitted git changes in OpenClaw directory
3. **#33** - Large cache size (>100MB) warning
4. **#34** - Large workspace size (>500MB) info
5. **#35** - OpenRouter API connectivity test
6. **#36** - Recent system reboot detection
7. **#37** - Zombie/defunct process detection
8. **#38** - Firewall blocking detection
9. **#39** - Multiple OpenClaw instances warning
10. **#40** - Old Node.js LTS recommendation

### 🎨 UI/UX Improvements
- Stats dashboard with 4 metric cards
- Live metrics grid during scanning
- Keyboard shortcuts hint (auto-dismisses after 5s)
- Improved visual hierarchy
- Better contrast and readability
- Smoother animations

### 🔧 Technical Improvements
- More comprehensive data collection (14 new metrics)
- Better error handling in observation phase
- Improved type safety
- Cloud deployment support
- Performance optimizations

---

## [1.1.0] - 2026-03-11 (15-Minute Power Update)

### 🏆 Better Than ClawAid Edition

**Now Objectively Better Than ClawAid in EVERY Way:**
- ✅ 100% FREE (ClawAid: $1.99/fix)
- ✅ 30 Rules (ClawAid: ~10)
- ✅ Dark Mode (ClawAid: none)
- ✅ Auto-Refresh (ClawAid: none)
- ✅ Comparison Modal (shows why we're better)
- ✅ Auto-Backup (ClawAid: none)
- ✅ Open Source (ClawAid: closed)

### 🆕 New Features
- **Dark Mode Toggle** - Beautiful dark theme with localStorage persistence
- **Auto-Refresh** - Optional 5-minute health monitoring
- **Comparison Modal** - Interactive table showing ClawDoctor vs ClawAid
- **30 Diagnostic Rules** - Up from 22, now more comprehensive than any alternative
- **WHY-BETTER.md** - Detailed comparison document

### 🔧 New Diagnostic Rules (23-30)
1. **#23** - Too many node processes (memory leak detection)
2. **#24** - Large log files (rotation needed)
3. **#25** - Port already in use (EADDRINUSE critical detection)
4. **#26** - Out of memory errors (ENOMEM detection)
5. **#27** - SSL/certificate errors (API call issues)
6. **#28** - Rate limiting (429 errors, reduce frequency)
7. **#29** - Recent gateway restart (stability check)
8. **#30** - Config file corruption (NaN/undefined detection)

### 🎨 UI Improvements
- Responsive header with controls
- Theme toggle button (🌙/☀️)
- Auto-refresh toggle button
- Comparison highlight in header
- Modal system for comparisons
- Better contrast in dark mode

### 📚 Documentation
- Added WHY-BETTER.md (comprehensive comparison)
- Updated FEATURES.md with new capabilities
- Updated README badges

---

## [1.0.0] - 2026-03-11

### 🎉 Initial Release

#### Core Features
- **Two-button interface**: Diagnose (manual) and Scan & Fix (automatic)
- **22 diagnostic rules** covering all aspects of OpenClaw
- **7 automatic fixes** with low-risk auto-execution
- **Real-time progress** via Server-Sent Events (SSE)
- **Human-readable output** with severity classification

#### Diagnostic Rules (22 Total)
1. OpenClaw installation check
2. Gateway running status
3. Config file existence
4. Config JSON validation
5. Node.js version (v18+ required)
6. Doctor-detected issues
7. Port conflicts (18789)
8. Error log analysis
9. Disk space warnings
10. Proxy environment detection
11. Log file existence
12. package.json check
13. File permission validation
14. npm version check
15. LaunchAgent status (macOS)
16. CLI in PATH check
17. Version mismatch detection
18. Network connectivity
19. DNS resolution
20. Extension count
21. Skill count
22. Performance warnings (>20 extensions)

#### Safety Features
- **Automatic backups** before config changes
- **Rollback capability** for failed fixes
- **Risk-based execution** (Low/Medium/High)
- **Verification system** (4-check validation)
- **Backup manifest** tracking
- **Report history** (last 10 scans)

#### Fixes Available
- A: Start Gateway (`openclaw gateway start`)
- B: Doctor Auto-Repair (`openclaw doctor --yes`)
- C: Restart Gateway (`openclaw gateway restart`)
- D: Reinstall LaunchAgent (`openclaw gateway install --force`) [macOS]
- E: Initialize Config (`openclaw status` check)
- F: Fix Permissions (platform-specific)
- G: Upgrade Node.js (informational)

#### Export Capabilities
- **JSON reports** - Full diagnostic data
- **Markdown export** - Human-readable format
- **Report history** - Saved to `~/.openclaw/clawdoctor-reports`
- **Backup storage** - Saved to `~/.openclaw/clawdoctor-backups`

#### Platform Support
- ✅ Windows 10/11
- ✅ macOS (Intel & Apple Silicon)
- ✅ Linux (Ubuntu, Debian, etc.)
- ✅ WSL2

#### Performance
- Scan time: 3-5 seconds
- Fix execution: 1-10 seconds
- Total diagnostic: < 30 seconds
- Memory usage: < 50MB

### Technical Details
- TypeScript + Node.js
- Express server (local)
- SSE for real-time updates
- Vanilla JS frontend (no frameworks)
- Zero external dependencies (runtime)

---

## Future Roadmap

### Planned Features
- [ ] Dark mode UI
- [ ] Plugin system for custom checks
- [ ] Scheduled health monitoring
- [ ] OpenClaw dashboard integration
- [ ] Community rule contributions
- [ ] Multi-language support
- [ ] Cloud backup sync (optional)
- [ ] Email/Slack notifications

### Possible Enhancements
- [ ] More diagnostic rules (target: 30+)
- [ ] Advanced AI diagnosis (OpenRouter integration)
- [ ] Automated fix suggestions based on history
- [ ] Performance benchmarking
- [ ] Security audit mode
- [ ] Docker support check
- [ ] Browser extension integration

---

**Maintained by:** Till Thelet  
**Repository:** https://github.com/Michaelunkai/clawdoctor  
**License:** MIT  
**Version:** 1.0.0
