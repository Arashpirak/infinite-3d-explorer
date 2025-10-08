import { NextResponse } from 'next/server';

async function fetchWithTimeout(resource: string, options: any) {
  const { timeout = 10000 } = options || {};
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, { ...options, signal: controller.signal });
  clearTimeout(id);
  return response;
}

async function handleRequest(request: Request) {
  try {
    let prompt = 'Give me one short motivational quote.';

    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      if (body?.prompt && typeof body.prompt === 'string') {
        prompt = body.prompt.trim();
      }
    }

    if (!prompt) {
      return NextResponse.json({ error: true, message: 'Prompt cannot be empty' }, { status: 400 });
    }

    const resp = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5.pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        timeout: 15000,
      }
    );

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => '');
      return NextResponse.json(
        { error: true, status: resp.status, message: 'Gemini API returned an error', details: errorText },
        { status: resp.status }
      );
    }

    const data = await resp.json().catch(() => null);
    const quote =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Stay motivated! (fallback)';

    return NextResponse.json({ quote });
  } catch (err: any) {
    return NextResponse.json(
      { error: true, message: 'Server error while calling Gemini API', details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}


