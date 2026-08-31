

export interface GarudaAnalysisPayload {
  command?: string;
  selectedCommand?: string;
  telemetry?: any;
  health?: any;
  faults?: any[];
  activeFaults?: any[];
  mission?: any;
}

export const streamGarudaCommand = async (
  command: string, 
  contextData: any, 
  onChunk: (chunk: string) => void
): Promise<void> => {
  try {
    const payload: GarudaAnalysisPayload = {
      command: command,
      selectedCommand: command.toUpperCase(),
      telemetry: contextData?.telemetry || {},
      health: contextData?.health || {},
      faults: contextData?.activeFaults || [],
      activeFaults: contextData?.activeFaults || [],
      mission: contextData?.mission || {}
    };

    const response = await fetch(`${API_BASE_URL}/api/garuda/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.analysis || data.response || "GARUDA-AI > ANALYSIS COMPLETE\nNo detailed telemetry anomaly detected.";
    
    // Simulate natural typing stream animation for frontend UI consistency
    const chunkSize = 8;
    for (let i = 0; i < resultText.length; i += chunkSize) {
      const chunk = resultText.slice(i, i + chunkSize);
      onChunk(chunk);
      await new Promise(resolve => setTimeout(resolve, 15));
    }
  } catch (error: any) {
    console.error('[GARUDA-AI] Backend communication error:', error);
    onChunk("GARUDA AI temporarily unavailable.\n\nUnable to reach AI backend.\n\nRetry.");
  }
};
