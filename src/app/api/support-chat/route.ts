import { NextResponse } from 'next/server';
import { supportChat } from '@/ai/flows/support-chat';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = typeof body?.query === 'string' ? body.query : '';
    if (!query) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }
    const result = await supportChat({ query });
    return NextResponse.json(result);
  } catch (e) {
    console.error('support-chat API error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
