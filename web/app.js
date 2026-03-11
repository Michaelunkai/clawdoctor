// Auto-start diagnosis on page load
window.addEventListener('DOMContentLoaded', startDiagnosis);

function startDiagnosis() {
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
        showDiagnosis(data.data);
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

function showDiagnosis(diagnosis) {
  showSection('diagnosis');
  
  // Health badge
  const badge = document.getElementById('health-badge');
  badge.textContent = diagnosis.healthy ? '✓ Healthy' : '⚠ Issues Found';
  badge.className = diagnosis.healthy ? 'badge-healthy' : 'badge-unhealthy';
  
  // Diagnosis text
  document.getElementById('diagnosis-title').textContent = 
    diagnosis.healthy ? 'System is Healthy' : 'Issues Detected';
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
    
    diagnosis.options.forEach(option => {
      const optionEl = createOptionElement(option);
      optionsContainer.appendChild(optionEl);
    });
    
    optionsSection.classList.remove('hidden');
  } else if (diagnosis.healthy) {
    showComplete(true);
  }
}

function createOptionElement(option) {
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
    recBadge.textContent = 'Recommended';
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
  option.steps.forEach(step => {
    const stepEl = document.createElement('div');
    stepEl.className = 'step';
    stepEl.textContent = `$ ${step.command}`;
    stepsDiv.appendChild(stepEl);
  });
  
  const button = document.createElement('button');
  button.textContent = option.autoExecute ? 'Auto-executing...' : 'Execute Fix';
  button.onclick = () => executeFix(option);
  
  if (option.autoExecute) {
    button.disabled = true;
    setTimeout(() => executeFix(option), 1000);
  }
  
  div.appendChild(header);
  div.appendChild(desc);
  div.appendChild(stepsDiv);
  div.appendChild(button);
  
  return div;
}

async function executeFix(option) {
  showSection('progress');
  appendLog(`Executing ${option.title}...`);
  
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
      showComplete(true);
    } else {
      appendLog('Fix completed but verification failed. Please check manually.');
      setTimeout(() => location.reload(), 3000);
    }
  } catch (error) {
    showError(`Failed to execute fix: ${error.message}`);
  }
}

function showComplete(success) {
  showSection('complete');
  document.getElementById('complete-text').textContent = 
    success 
      ? '✨ Your OpenClaw system is now healthy!' 
      : 'Diagnosis complete. Review the findings above.';
}

function showError(message) {
  showSection('error');
  document.getElementById('error-text').textContent = message;
}
