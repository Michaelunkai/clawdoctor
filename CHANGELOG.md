# ClawDoctor Changelog

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
