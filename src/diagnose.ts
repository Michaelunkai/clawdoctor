import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ObservationData } from './observe';
import { applyRules } from './rules';

export interface DiagnosisResult {
  healthy: boolean;
  diagnosis: string;
  confidence: number;
  rootCause: string;
  reasoning: string[];
  warnings: string[];
  options: RepairOption[];
  ruleBasedFindings?: string[];
}

export interface RepairOption {
  id: string;
  title: string;
  description: string;
  recommended: boolean;
  risk: 'low' | 'medium' | 'high';
  autoExecute: boolean;
  steps: DiagnosticAction[];
}

export interface DiagnosticAction {
  description: string;
  command: string;
  type: 'cli' | 'system' | 'file_edit';
  risk: 'low' | 'medium' | 'high';
  backup: string | null;
}

function extractApiKey(): string | null {
  const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
  
  try {
    if (!fs.existsSync(configPath)) return null;
    
    const content = fs.readFileSync(configPath, 'utf-8');
    
    // Look for openrouter API key
    const patterns = [
      /"openrouter"\s*:\s*\{[^}]*"apiKey"\s*:\s*"([^"]+)"/s,
      /"apiKey"\s*:\s*"(sk-or-[^"]+)"/,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  } catch {
    return null;
  }
}

async function callOpenRouter(apiKey: string, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert OpenClaw diagnostician. Analyze system data and provide diagnosis in JSON format.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0,
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/clawdoctor/clawdoctor',
        'X-Title': 'ClawDoctor',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(`OpenRouter error: ${parsed.error.message}`));
            return;
          }
          const content = parsed.choices?.[0]?.message?.content;
          if (!content) {
            reject(new Error('No content in response'));
            return;
          }
          resolve(content);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('OpenRouter timeout'));
    });
    req.write(body);
    req.end();
  });
}

function parseJsonResponse(response: string): DiagnosisResult {
  let jsonStr = response.trim();
  
  // Remove markdown code blocks
  const jsonMatch = jsonStr.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${jsonStr.slice(0, 200)}`);
  }
}

export async function diagnose(
  observation: ObservationData,
  onProgress?: (msg: string) => void
): Promise<DiagnosisResult> {
  const log = (msg: string) => {
    if (onProgress) onProgress(msg);
  };
  
  // First, apply rule-based diagnostics
  log('Applying rule-based checks...');
  const ruleResults = applyRules(observation);
  
  // If critical rule found, return immediately
  if (ruleResults.critical) {
    log('Critical issue found by rule engine');
    return ruleResults.diagnosis;
  }
  
  // Try AI diagnosis
  log('Looking for OpenRouter API key...');
  const apiKey = extractApiKey();
  
  if (!apiKey) {
    log('No API key found, using rule-based diagnosis only');
    return ruleResults.diagnosis;
  }
  
  log('Calling OpenRouter AI (Claude Sonnet 4)...');
  
  const prompt = `Analyze this OpenClaw system diagnostic data and provide diagnosis:

${JSON.stringify(observation, null, 2)}

Rule-based findings:
${JSON.stringify(ruleResults.findings, null, 2)}

Return ONLY valid JSON matching this structure:
{
  "healthy": boolean,
  "diagnosis": "plain language description",
  "confidence": 0.0-1.0,
  "rootCause": "technical root cause",
  "reasoning": ["step 1", "step 2"],
  "warnings": ["warning 1"],
  "options": [
    {
      "id": "A",
      "title": "Fix title",
      "description": "What this does",
      "recommended": true,
      "risk": "low",
      "autoExecute": true,
      "steps": [
        {
          "description": "Step description",
          "command": "openclaw gateway restart",
          "type": "cli",
          "risk": "low",
          "backup": null
        }
      ]
    }
  ]
}

Prefer official CLI commands (openclaw doctor --yes, openclaw gateway restart) over system commands.`;

  try {
    const response = await callOpenRouter(apiKey, prompt);
    const diagnosis = parseJsonResponse(response);
    diagnosis.ruleBasedFindings = ruleResults.findings;
    return diagnosis;
  } catch (error: any) {
    log(`AI diagnosis failed: ${error.message}`);
    log('Falling back to rule-based diagnosis');
    return ruleResults.diagnosis;
  }
}
