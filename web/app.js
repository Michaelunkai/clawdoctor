// State
let currentDiagnosis = null;
let fixesApplied = [];

// Show section
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(sectionId + '-state').classList.add('active');
}

// Start diagnosis
async function startDiagnosis() {
  showSection('scanning');
  
  const stepsContainer = document.getElementById('scan-steps');
  stepsContainer.innerHTML = '<div class="loading"><div class="loading-spinner spinner">🔄</div><p>Scanning system...</p></div>';
  
  try {
    // Connect to SSE
    const eventSource = new EventSource('/api/diagnose');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'step':
          addScanStep(data.data);
          break;
        
        case 'diagnosis':
          eventSource.close();
          currentDiagnosis = data.data;
          showResults(data.data);
          break;
        
        case 'error':
          eventSource.close();
          showError(data.data);
          break;
      }
    };
    
    eventSource.onerror = () => {
      eventSource.close();
      showError('Connection lost. Please try again.');
    };
    
  } catch (error) {
    showError(error.message);
  }
}

// Add scan step
function addScanStep(step) {
  const stepsContainer = document.getElementById('scan-steps');
  
  // Remove loading if present
  const loading = stepsContainer.querySelector('.loading');
  if (loading) loading.remove();
  
  const stepEl = document.createElement('div');
  stepEl.className = 'diagnostic-step info';
  stepEl.innerHTML = `
    <div class="step-header">
      <span class="step-icon">✓</span>
      <div class="step-content">
        <div class="step-title">${step}</div>
      </div>
    </div>
  `;
  
  stepsContainer.appendChild(stepEl);
  stepEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// Show results
function showResults(diagnosis) {
  showSection('results');
  
  const container = document.getElementById('diagnosis-steps');
  container.innerHTML = '';
  
  if (diagnosis.healthy) {
    container.innerHTML = `
      <div class="diagnostic-step">
        <div class="step-header">
          <span class="step-icon">✅</span>
          <div class="step-content">
            <div class="step-title">Everything looks good!</div>
            <div class="step-description">OpenClaw is healthy and ready to use. No issues found.</div>
          </div>
        </div>
      </div>
    `;
    
    // Show re-scan button
    const rescanBtn = document.createElement('button');
    rescanBtn.className = 'btn-primary';
    rescanBtn.textContent = '🔄 Scan Again';
    rescanBtn.style.marginTop = '20px';
    rescanBtn.onclick = () => location.reload();
    container.appendChild(rescanBtn);
    return;
  }
  
  // Show diagnosis details
  const issues = diagnosis.diagnosis || [];
  let hasFixableIssues = false;
  
  issues.forEach((issue, index) => {
    const severity = issue.severity || 'info';
    const hasAutomaticFix = issue.fix && issue.fix.automatic;
    
    if (hasAutomaticFix) hasFixableIssues = true;
    
    const stepEl = document.createElement('div');
    stepEl.className = `diagnostic-step ${severity}`;
    stepEl.innerHTML = `
      <div class="step-header">
        <span class="step-icon">${getSeverityIcon(severity)}</span>
        <div class="step-content">
          <div class="step-title">
            ${issue.message}
            ${hasAutomaticFix ? '<span class="step-badge running">Fixable</span>' : ''}
          </div>
          ${issue.details ? `<div class="step-description">${issue.details}</div>` : ''}
          ${issue.fix && issue.fix.command ? `<div class="step-command">$ ${issue.fix.command}</div>` : ''}
        </div>
      </div>
    `;
    
    container.appendChild(stepEl);
  });
  
  // Show apply fixes button if there are fixable issues
  if (hasFixableIssues) {
    const fixButton = document.createElement('button');
    fixButton.className = 'btn-primary';
    fixButton.textContent = '🔧 Apply Fixes';
    fixButton.style.marginTop = '20px';
    fixButton.onclick = () => applyFixes(issues);
    container.appendChild(fixButton);
  }
}

// Get severity icon
function getSeverityIcon(severity) {
  switch (severity) {
    case 'critical': return '🔴';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '✓';
  }
}

// Apply fixes
async function applyFixes(issues) {
  const container = document.getElementById('diagnosis-steps');
  
  // Count fixable issues
  const fixableCount = issues.filter(i => i.fix && i.fix.automatic).length;
  
  if (fixableCount === 0) {
    alert('No automatic fixes available for the detected issues.');
    return;
  }
  
  container.innerHTML = `<div class="loading"><div class="loading-spinner spinner">🔧</div><p>Applying ${fixableCount} fix${fixableCount > 1 ? 'es' : ''}...</p></div>`;
  
  fixesApplied = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const issue of issues) {
    if (!issue.fix || !issue.fix.automatic) continue;
    
    const stepEl = document.createElement('div');
    stepEl.className = 'diagnostic-step info';
    stepEl.innerHTML = `
      <div class="step-header">
        <span class="step-icon spinner">🔧</span>
        <div class="step-content">
          <div class="step-title">${issue.message}<span class="step-badge running">Running...</span></div>
          <div class="step-command">$ ${issue.fix.command}</div>
        </div>
      </div>
    `;
    
    container.innerHTML = '';
    container.appendChild(stepEl);
    
    try {
      const response = await fetch('/api/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: issue.fix.command })
      });
      
      const result = await response.json();
      
      if (result.success) {
        stepEl.className = 'diagnostic-step';
        stepEl.querySelector('.step-icon').textContent = '✅';
        stepEl.querySelector('.step-badge').className = 'step-badge success';
        stepEl.querySelector('.step-badge').textContent = 'Fixed';
        
        if (result.output && result.output.length < 200) {
          const outputEl = document.createElement('div');
          outputEl.className = 'step-output';
          outputEl.textContent = result.output;
          stepEl.querySelector('.step-content').appendChild(outputEl);
        }
        
        fixesApplied.push(issue.message);
        successCount++;
      } else {
        stepEl.className = 'diagnostic-step error';
        stepEl.querySelector('.step-icon').textContent = '❌';
        stepEl.querySelector('.step-badge').className = 'step-badge failed';
        stepEl.querySelector('.step-badge').textContent = 'Failed';
        
        if (result.error) {
          const errorEl = document.createElement('div');
          errorEl.className = 'step-description';
          errorEl.style.color = '#f44336';
          errorEl.textContent = result.error.length > 150 ? result.error.substring(0, 150) + '...' : result.error;
          stepEl.querySelector('.step-content').appendChild(errorEl);
        }
        
        failCount++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      stepEl.className = 'diagnostic-step error';
      stepEl.querySelector('.step-icon').textContent = '❌';
      stepEl.querySelector('.step-badge').className = 'step-badge failed';
      stepEl.querySelector('.step-badge').textContent = 'Failed';
      failCount++;
    }
  }
  
  // Show summary
  const summaryEl = document.createElement('div');
  summaryEl.className = successCount === fixableCount ? 'diagnostic-step' : 'diagnostic-step warning';
  summaryEl.innerHTML = `
    <div class="step-header">
      <span class="step-icon">${successCount === fixableCount ? '🎉' : '⚠️'}</span>
      <div class="step-content">
        <div class="step-title">Fixes applied: ${successCount} successful${failCount > 0 ? `, ${failCount} failed` : ''}</div>
        <div class="step-description">${successCount === fixableCount ? 'All fixes completed successfully!' : 'Some fixes failed. You may need to apply them manually.'}</div>
      </div>
    </div>
  `;
  container.appendChild(summaryEl);
  
  // Show feedback section if any fixes succeeded
  if (successCount > 0) {
    document.getElementById('feedback-section').classList.remove('hidden');
  }
}

// Feedback
function feedbackYes() {
  alert('Great! ClawDoctor successfully fixed your issue. 🎉\n\nReport saved to ~/.openclaw/clawdoctor-reports');
  location.reload();
}

function feedbackNo() {
  const issues = fixesApplied.join(', ');
  alert(`Sorry the fixes didn't work. 😔\n\nTried to fix: ${issues || 'No fixes applied'}\n\nPlease report this issue on GitHub:\nhttps://github.com/Michaelunkai/clawdoctor/issues`);
  location.reload();
}

// Show error
function showError(message) {
  showSection('results');
  
  const container = document.getElementById('diagnosis-steps');
  container.innerHTML = `
    <div class="diagnostic-step error">
      <div class="step-header">
        <span class="step-icon">❌</span>
        <div class="step-content">
          <div class="step-title">Diagnostic Failed</div>
          <div class="step-description">${message}</div>
        </div>
      </div>
    </div>
    <button class="btn-primary" onclick="location.reload()" style="margin-top: 20px;">Try Again</button>
  `;
}

// Show details
function showDetails() {
  if (!currentDiagnosis) return;
  
  const details = JSON.stringify(currentDiagnosis, null, 2);
  const win = window.open('', '_blank');
  win.document.write(`<pre style="background:#0a0a0a;color:#4caf50;padding:20px;font-family:monospace;">${details}</pre>`);
}
