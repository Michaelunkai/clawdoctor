// Wait for user action instead of auto-starting
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('diagnose-btn').addEventListener('click', () => startDiagnosis(false));
  document.getElementById('scan-fix-btn').addEventListener('click', () => startDiagnosis(true));
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
        showDiagnosis(data.data, autoFix);
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
