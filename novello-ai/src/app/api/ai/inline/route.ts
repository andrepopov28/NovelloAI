import { NextResponse } from 'next/server';
import { POST as GeneratePOST } from '../generate/route';

export async function POST(req: Request) {
    const body = await req.json();
    body.endpointMode = 'inline';
    const modifiedReq = new Request(req.url, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify(body),
    });
    return GeneratePOST(modifiedReq as any);
}
