// Global state
let currentObservation = null;
let currentDiagnosis = null;
let autoRefreshInterval = null;
let toastId = 0;

// Toast notification system
function showToast(message, type = 'info', duration = 5000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.id = `toast-${toastId++}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(toast);
  
  // Play sound if enabled
  if (localStorage.getItem('sound') === 'true') {
    playNotificationSound(type);
  }
  
  if (duration > 0) {
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  
  return toast.id;
}

// Sound notification system
function playNotificationSound(type) {
  const frequencies = {
    success: 800,
    error: 400,
    warning: 600,
    info: 700
  };
  
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequencies[type] || 700;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Sound not supported
  }
}

// Loading overlay control
function showLoading(text = 'Loading...') {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.querySelector('.loading-text').textContent = text;
    overlay.classList.remove('hidden');
  }
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

// Wait for user action instead of auto-starting
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('diagnose-btn').addEventListener('click', () => startDiagnosis(false));
  document.getElementById('scan-fix-btn').addEventListener('click', () => startDiagnosis(true));
  
  // Dark mode toggle
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('clawdoctor-theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
    themeToggle.classList.add('active');
  }
  
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    themeToggle.classList.toggle('active');
    localStorage.setItem('clawdoctor-theme', isDark ? 'dark' : 'light');
  });
  
  // Auto-refresh toggle
  const autoRefresh = document.getElementById('auto-refresh');
  autoRefresh.addEventListener('click', () => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
      autoRefresh.classList.remove('active');
      autoRefresh.title = 'Auto-Refresh Every 5min (OFF)';
    } else {
      autoRefreshInterval = setInterval(() => {
        if (document.getElementById('start-section').classList.contains('hidden')) return;
        startDiagnosis(false);
      }, 300000); // 5 minutes
      autoRefresh.classList.add('active');
      autoRefresh.title = 'Auto-Refresh Every 5min (ON)';
    }
  });
  
  // Load recent reports count
  fetch('/api/reports')
    .then(r => r.json())
    .then(data => {
      if (data.success && data.reports.length > 0) {
        showReportsHint(data.reports.length);
      }
    })
    .catch(() => {});
  
  // Show comparison modal
  document.getElementById('show-comparison').addEventListener('click', () => {
    document.getElementById('comparison-modal').classList.remove('hidden');
  });
  
  // Show comparison modal on first visit
  if (!localStorage.getItem('clawdoctor-seen-comparison')) {
    setTimeout(() => {
      document.getElementById('comparison-modal').classList.remove('hidden');
      localStorage.setItem('clawdoctor-seen-comparison', 'true');
    }, 2000);
  }
  
  // Settings button
  document.getElementById('settings-btn').addEventListener('click', () => {
    document.getElementById('settings-modal').classList.remove('hidden');
    loadSettings();
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + D = Diagnose
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      const diagnoseBtn = document.getElementById('diagnose-btn');
      if (diagnoseBtn && !diagnoseBtn.disabled) {
        startDiagnosis(false);
      }
    }
    
    // Ctrl/Cmd + Shift + F = Scan & Fix
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      const fixBtn = document.getElementById('scan-fix-btn');
      if (fixBtn && !fixBtn.disabled) {
        startDiagnosis(true);
      }
    }
    
    // Escape = Close modal
    if (e.key === 'Escape') {
      const modal = document.getElementById('comparison-modal');
      if (modal && !modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
      }
    }
    
    // Ctrl/Cmd + K = Toggle dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('theme-toggle').click();
    }
  });
  
  // Show keyboard shortcuts hint
  const shortcutsHint = document.createElement('div');
  shortcutsHint.className = 'shortcuts-hint';
  shortcutsHint.innerHTML = `
    <div class="hint-title">⌨️ Keyboard Shortcuts</div>
    <div class="hint-item"><kbd>Ctrl+D</kbd> Diagnose</div>
    <div class="hint-item"><kbd>Ctrl+Shift+F</kbd> Scan & Fix</div>
    <div class="hint-item"><kbd>Ctrl+K</kbd> Dark Mode</div>
    <div class="hint-item"><kbd>Esc</kbd> Close Modal</div>
  `;
  shortcutsHint.style.cssText = 'position:fixed;bottom:20px;left:20px;background:var(--container-bg);padding:15px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-size:0.85em;opacity:0.9;';
  document.body.appendChild(shortcutsHint);
  
  // Hide shortcuts hint after 5 seconds
  setTimeout(() => {
    shortcutsHint.style.opacity = '0';
    shortcutsHint.style.transition = 'opacity 0.5s';
    setTimeout(() => shortcutsHint.remove(), 500);
  }, 5000);
});

function startDiagnosis(autoFix = false) {
  showSection('progress');
  showToast('Starting diagnostic scan...', 'info', 3000);
  
  const startTime = Date.now();
  const progressBar = document.querySelector('.progress-fill');
  let progress = 0;
  
  // Animate progress bar
  const progressInterval = setInterval(() => {
    if (progress < 90) {
      progress += Math.random() * 10;
      if (progressBar) {
        progressBar.style.width = Math.min(progress, 90) + '%';
      }
    }
  }, 500);
  
  const eventSource = new EventSource('/api/diagnose');
  
  eventSource.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'progress':
        appendLog(data.message);
        break;
      
      case 'diagnosis':
        clearInterval(progressInterval);
        if (progressBar) progressBar.style.width = '100%';
        
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        showToast(`Scan completed in ${elapsed}s`, 'success', 3000);
        
        eventSource.close();
        currentDiagnosis = data.data;
        showDiagnosis(data.data, autoFix);
        break;
      
      case 'observation':
        currentObservation = data.data;
        break;
      
      case 'complete':
        eventSource.close();
        showComplete(data.success);
        break;
      
      case 'error':
        eventSource.close();
        showError(data.message);
        break;
    }
  });
  
  eventSource.onerror = () => {
    eventSource.close();
    showError('Connection to server lost');
  };
}

function showSection(name) {
  document.querySelectorAll('.section').forEach(el => el.classList.add('hidden'));
  document.getElementById(`${name}-section`)?.classList.remove('hidden');
}

function appendLog(message) {
  const logDiv = document.getElementById('progress-log');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = message;
  logDiv.appendChild(entry);
  logDiv.scrollTop = logDiv.scrollHeight;
}

function showDiagnosis(diagnosis, autoFix) {
  showSection('diagnosis');
  
  // Health badge
  const badge = document.getElementById('health-badge');
  badge.textContent = diagnosis.healthy ? '✅ System Healthy' : '⚠️ Issues Found';
  badge.className = diagnosis.healthy ? 'badge-healthy' : 'badge-unhealthy';
  
  // Diagnosis text
  document.getElementById('diagnosis-title').textContent = 
    diagnosis.healthy ? 'OpenClaw is Running Smoothly!' : 'Issues Detected';
  document.getElementById('diagnosis-text').textContent = diagnosis.diagnosis;
  
  // Warnings
  if (diagnosis.warnings && diagnosis.warnings.length > 0) {
    const warningsSection = document.getElementById('warnings-section');
    const warningsList = document.getElementById('warnings-list');
    warningsList.innerHTML = '';
    diagnosis.warnings.forEach(warning => {
      const li = document.createElement('li');
      li.textContent = warning;
      warningsList.appendChild(li);
    });
    warningsSection.classList.remove('hidden');
  }
  
  // Repair options
  if (diagnosis.options && diagnosis.options.length > 0) {
    const optionsSection = document.getElementById('options-section');
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    // If autoFix mode, automatically execute recommended option
    let autoExecuted = false;
    
    diagnosis.options.forEach(option => {
      const optionEl = createOptionElement(option, autoFix && option.recommended && !autoExecuted);
      optionsContainer.appendChild(optionEl);
      
      if (autoFix && option.recommended && option.risk === 'low' && !autoExecuted) {
        autoExecuted = true;
        setTimeout(() => executeFix(option), 1000);
      }
    });
    
    optionsSection.classList.remove('hidden');
  } else if (diagnosis.healthy) {
    showComplete(true);
  }
}

function createOptionElement(option, autoExecuting) {
  const div = document.createElement('div');
  div.className = 'repair-option' + (option.recommended ? ' recommended' : '');
  
  const header = document.createElement('div');
  header.className = 'option-header';
  
  const title = document.createElement('div');
  title.className = 'option-title';
  title.textContent = option.title;
  
  const badges = document.createElement('div');
  if (option.recommended) {
    const recBadge = document.createElement('span');
    recBadge.className = 'option-badge badge-recommended';
    recBadge.textContent = '✓ Recommended';
    badges.appendChild(recBadge);
    badges.appendChild(document.createTextNode(' '));
  }
  const riskBadge = document.createElement('span');
  riskBadge.className = `option-badge badge-risk-${option.risk}`;
  riskBadge.textContent = `Risk: ${option.risk}`;
  badges.appendChild(riskBadge);
  
  header.appendChild(title);
  header.appendChild(badges);
  
  const desc = document.createElement('div');
  desc.className = 'option-description';
  desc.textContent = option.description;
  
  const stepsDiv = document.createElement('div');
  stepsDiv.className = 'option-steps';
  stepsDiv.innerHTML = '<div class="steps-title">🔧 Steps that will be executed:</div>';
  option.steps.forEach(step => {
    const stepEl = document.createElement('div');
    stepEl.className = 'step';
    stepEl.innerHTML = `<span class="step-icon">▶</span> ${step.description}`;
    stepsDiv.appendChild(stepEl);
  });
  
  const button = document.createElement('button');
  button.className = autoExecuting ? 'btn-success' : 'btn-primary';
  button.textContent = autoExecuting ? '⚡ Auto-executing...' : '🔧 Execute Fix';
  button.onclick = () => executeFix(option);
  
  if (autoExecuting) {
    button.disabled = true;
  }
  
  div.appendChild(header);
  div.appendChild(desc);
  div.appendChild(stepsDiv);
  div.appendChild(button);
  
  return div;
}

async function executeFix(option) {
  showSection('progress');
  document.getElementById('progress-log').innerHTML = '';
  appendLog(`⚡ Executing: ${option.title}`);
  
  try {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        optionId: option.id,
        steps: option.steps
      })
    });
    
    const result = await response.json();
    
    if (result.success && result.verification) {
      appendLog('✅ Fix successful!');
      appendLog('✅ Verification passed!');
      setTimeout(() => showComplete(true), 2000);
    } else if (result.success) {
      appendLog('✅ Fix completed');
      appendLog('⚠️ Verification inconclusive - please check manually');
      setTimeout(() => location.reload(), 3000);
    } else {
      appendLog('❌ Fix failed: ' + (result.error || 'Unknown error'));
      setTimeout(() => showError('Fix execution failed'), 2000);
    }
  } catch (error) {
    showError(`Failed to execute fix: ${error.message}`);
  }
}

function showComplete(success) {
  showSection('complete');
  document.getElementById('complete-text').textContent = 
    success 
      ? '✨ Your OpenClaw system is now healthy and running smoothly!' 
      : '✅ Diagnosis complete. Review the findings above.';
}

function showError(message) {
  showSection('error');
  document.getElementById('error-text').textContent = message;
}

function setupExportButtons(observation, diagnosis) {
  currentObservation = observation;
  currentDiagnosis = diagnosis;
  
  const exportBtn = document.getElementById('export-btn');
  const exportMdBtn = document.getElementById('export-md-btn');
  
  if (exportBtn) {
    exportBtn.onclick = async () => {
      try {
        const response = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ observation, diagnosis })
        });
        const result = await response.json();
        if (result.success) {
          alert(`✅ Report saved to:\n${result.filepath}`);
        } else {
          alert('❌ Failed to save report');
        }
      } catch (error) {
        alert('❌ Error: ' + error.message);
      }
    };
  }
  
  if (exportMdBtn) {
    exportMdBtn.onclick = async () => {
      try {
        const response = await fetch('/api/export/markdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ observation, diagnosis })
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'clawdoctor-report.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        alert('❌ Error: ' + error.message);
      }
    };
  }
}

function showReportsHint(count) {
  const hint = document.createElement('div');
  hint.className = 'reports-hint';
  hint.innerHTML = `📋 ${count} previous diagnostic report${count > 1 ? 's' : ''} saved`;
  hint.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#667eea;color:white;padding:12px 20px;border-radius:8px;font-size:0.9em;box-shadow:0 4px 12px rgba(0,0,0,0.2);cursor:pointer;';
  hint.onclick = () => window.open('file://' + require('os').homedir() + '/.openclaw/clawdoctor-reports', '_blank');
  document.body.appendChild(hint);
}

// Settings functions
async function loadSettings() {
  try {
    const response = await fetch('/api/scheduler/status');
    const data = await response.json();
    if (data.success) {
      document.getElementById('schedule-enabled').checked = data.config.enabled;
      document.getElementById('schedule-interval').value = data.config.interval;
      document.getElementById('schedule-autofix').checked = data.config.autoFix || false;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  
  // Load UI preferences from localStorage
  document.getElementById('enable-animations').checked = localStorage.getItem('animations') !== 'false';
  document.getElementById('enable-sound').checked = localStorage.getItem('sound') === 'true';
}

async function saveSettings() {
  const config = {
    enabled: document.getElementById('schedule-enabled').checked,
    interval: parseInt(document.getElementById('schedule-interval').value),
    autoFix: document.getElementById('schedule-autofix').checked
  };
  
  try {
    const response = await fetch('/api/scheduler/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    
    const data = await response.json();
    if (data.success) {
      showToast('Settings saved successfully!', 'success');
      document.getElementById('settings-modal').classList.add('hidden');
    } else {
      showToast('Failed to save settings', 'error');
    }
  } catch (error) {
    showToast('Error saving settings: ' + error.message, 'error');
  }
  
  // Save UI preferences
  localStorage.setItem('animations', document.getElementById('enable-animations').checked);
  localStorage.setItem('sound', document.getElementById('enable-sound').checked);
}

async function clearCache() {
  try {
    const response = await fetch('/api/cache/clear', { method: 'POST' });
    const data = await response.json();
    if (data.success) {
      showToast('Cache cleared successfully!', 'success');
    }
  } catch (error) {
    showToast('Error clearing cache: ' + error.message, 'error');
  }
}

async function showPerformanceStats() {
  try {
    const response = await fetch('/api/performance');
    const data = await response.json();
    if (data.success) {
      let stats = 'Performance Statistics:\n\n';
      for (const [key, value] of Object.entries(data.stats)) {
        stats += `${key}:\n  Avg: ${value.avg}ms\n  Min: ${value.min}ms\n  Max: ${value.max}ms\n\n`;
      }
      alert(stats || 'No performance data available yet');
    }
  } catch (error) {
    showToast('Error loading performance stats: ' + error.message, 'error');
  }
}
