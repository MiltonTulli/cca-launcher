export async function linkLaunchToDraft(
  orchestratorAddress: string,
  draftId: string,
): Promise<void> {
  await fetch("/api/launch-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orchestratorAddress, draftId }),
  });
}

export async function getDraftForLaunch(orchestratorAddress: string): Promise<string | null> {
  const params = new URLSearchParams({ address: orchestratorAddress });
  const resp = await fetch(`/api/launch-draft?${params}`);
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.draftId ?? null;
}
