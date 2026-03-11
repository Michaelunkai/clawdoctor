// Global state
let currentObservation = null;
let currentDiagnosis = null;
let autoRefreshInterval = null;

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
});

function startDiagnosis(autoFix = false) {
  showSection('progress');
  
  const eventSource = new EventSource('/api/diagnose');
  
  eventSource.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'progress':
        appendLog(data.message);
        break;
      
      case 'diagnosis':
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
