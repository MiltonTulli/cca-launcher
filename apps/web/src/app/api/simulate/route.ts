import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { from, to, input, networkId, gas, value } = await req.json();

  const accessKey = process.env.TENDERLY_ACCESS_KEY;
  const accountSlug = process.env.TENDERLY_ACCOUNT_SLUG;
  const projectSlug = process.env.TENDERLY_PROJECT_SLUG;

  if (!accessKey || !accountSlug || !projectSlug) {
    return NextResponse.json(
      {
        error:
          "Tenderly not configured. Set TENDERLY_ACCESS_KEY, TENDERLY_ACCOUNT_SLUG, and TENDERLY_PROJECT_SLUG.",
      },
      { status: 500 },
    );
  }

  if (!from || !to || !input || !networkId) {
    return NextResponse.json(
      { error: "Missing required fields: from, to, input, networkId" },
      { status: 400 },
    );
  }

  const url = `https://api.tenderly.co/api/v1/account/${accountSlug}/project/${projectSlug}/simulate`;

  const body = {
    network_id: String(networkId),
    from,
    to,
    input,
    gas: gas || 15_000_000,
    gas_price: "0",
    value: value || "0",
    simulation_type: "full",
    save: true,
    save_if_fails: true,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Key": accessKey,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json(
      { error: `Tenderly API error: ${resp.status}`, details: text },
      { status: resp.status },
    );
  }

  const data = await resp.json();
  const simulation = data.simulation;
  const transaction = data.transaction;

  return NextResponse.json({
    success: simulation.status === true,
    gasUsed: simulation.gas_used,
    error: transaction?.error_message || null,
    errorInfo: transaction?.error_info || null,
    simulationId: simulation.id,
    simulationUrl: `https://dashboard.tenderly.co/${accountSlug}/${projectSlug}/simulator/${simulation.id}`,
  });
}
