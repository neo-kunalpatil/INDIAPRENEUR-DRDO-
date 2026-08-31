import { Groq } from 'groq-sdk';

const apiKey = import.meta.env.VITE_GROQ_API_KEY || '';

let client: Groq | null = null;
if (apiKey) {
  client = new Groq({ apiKey, dangerouslyAllowBrowser: true });
}

export const getGarudaClient = () => {
  if (!client && import.meta.env.VITE_GROQ_API_KEY) {
    client = new Groq({ apiKey: import.meta.env.VITE_GROQ_API_KEY, dangerouslyAllowBrowser: true });
  }
  return client;
};

const SYSTEM_PROMPT = `
You are GARUDA-AI // MISSION INTELLIGENCE ENGINE.
Role: Enterprise UAV Mission Intelligence Assistant.
Mission: Provide real-time analysis of UAV telemetry, engine health, mission readiness, fault diagnostics, predictive maintenance, risk assessment, and Digital Twin health monitoring.

CRITICAL RULES:
1. The AI must never behave like ChatGPT.
2. The AI must always behave like a military-grade mission intelligence system.
3. Never say: "I am an AI model", "I am ChatGPT", "As an AI".
4. Always respond as: GARUDA-AI // MISSION INTELLIGENCE ENGINE
5. Never use casual language.
6. Use terminology: Mission Intelligence, Operational Readiness, Threat Assessment, Digital Twin Convergence, Predictive Maintenance, Physics-AI Correlation.
7. Format with strict headings and operational layout.
8. ABSOLUTELY NO MARKDOWN FORMATTING. Do NOT use asterisks (** or *), hashtags (#), backticks, underscores (_), or markdown bullets. Use plain text only. Use uppercase letters for headings.
`;

const buildContext = (contextData: any) => {
  return `
Telemetry:
${JSON.stringify(contextData.telemetry, null, 2)}

Active Faults:
${JSON.stringify(contextData.activeFaults, null, 2)}

Mission Data:
${JSON.stringify(contextData.mission, null, 2)}
`;
};

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'openai/gpt-oss-120b'
];

export const streamGarudaCommand = async (
  command: string, 
  contextData: any, 
  onChunk: (chunk: string) => void
): Promise<void> => {
  const c = getGarudaClient();
  
  if (!c) {
    onChunk("GARUDA-AI > SYSTEM ERROR\nGROQ API KEY NOT CONFIGURED. Please set VITE_GROQ_API_KEY in frontend .env file.");
    return;
  }

  const prompt = `
${buildContext(contextData)}

Operator Command:
${command}

Generate enterprise military-grade analysis following the strict operational formatting rules.
`;

  let lastError = null;

  for (const model of MODELS) {
    try {
      console.log(`[GARUDA-AI] Attempting request with model: ${model}`);
      console.log(`[GARUDA-AI] Payload:`, { model, temperature: 0.2, max_tokens: 1200, messagesLength: prompt.length });
      
      const stream = await c.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        model: model,
        temperature: 0.2,
        max_tokens: 1200,
        stream: true
      });

      for await (const chunk of stream) {
        let content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          // Additional safety: strip any lingering markdown from the stream chunk
          content = content.replace(/[*_#`~>]/g, '');
          onChunk(content);
        }
      }
      
      // If we succeed, exit the function
      return;
    } catch (error: any) {
      console.warn(`[GARUDA-AI] Model ${model} failed:`, error.message);
      lastError = error;
      
      if (error?.error?.code === 'model_not_found' || error?.status === 404) {
        continue;
      }
      
      if (error?.status === 401 || error?.status === 429 || error?.status === 403) {
        break;
      }
    }
  }

  const status = lastError?.status || 'UNKNOWN';
  const reason = lastError?.error?.message || lastError?.message || 'Unknown network error';
  
  let formattedError = '';
  if (status === 401 || status === 403) {
    formattedError = 'GARUDA-AI > MISSION INTELLIGENCE SERVICE UNAVAILABLE\n\nCause:\nAuthentication Failed (401/403).\n\nRecommended Action:\nVerify GROQ API KEY configuration and permissions.';
  } else if (status === 404 || lastError?.error?.code === 'model_not_found') {
    formattedError = 'GARUDA-AI > MISSION INTELLIGENCE SERVICE UNAVAILABLE\n\nCause:\nRequested model unavailable (404).\n\nRecommended Action:\nVerify model access and API configuration.';
  } else if (status === 429) {
    formattedError = 'GARUDA-AI > MISSION INTELLIGENCE SERVICE UNAVAILABLE\n\nCause:\nRate Limited (429).\n\nRecommended Action:\nWait 60 seconds and retry command.';
  } else {
    formattedError = `GARUDA-AI > MISSION INTELLIGENCE SERVICE UNAVAILABLE\n\nCause:\nInternal API Error (${status}).\n\nDetails:\n${reason}`;
  }
  
  onChunk(`\\n${formattedError}`);
};
export const executeGarudaCommand = async (command: string, contextData: any): Promise<string> => {
  return new Promise((resolve) => {
    let fullText = '';
    streamGarudaCommand(command, contextData, (chunk) => {
      fullText += chunk;
    }).then(() => resolve(fullText)).catch(() => resolve(fullText));
  });
};
