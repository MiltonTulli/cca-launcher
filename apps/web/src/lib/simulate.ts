export interface SimulationResult {
  success: boolean;
  gasUsed: number;
  error: string | null;
  errorInfo: { address: string; error_message: string } | null;
  simulationId: string;
  simulationUrl: string;
}

export async function simulateTransaction(params: {
  from: string;
  to: string;
  input: string;
  networkId: number;
  gas?: number;
  value?: string;
}): Promise<SimulationResult> {
  const resp = await fetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || `Simulation failed: ${resp.status}`);
  }

  return resp.json();
}
