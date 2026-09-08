import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

    const res = await axios.get(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
    return NextResponse.json(res.data);
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

