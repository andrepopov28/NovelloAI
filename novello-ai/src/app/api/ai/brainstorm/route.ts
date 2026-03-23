import { NextResponse } from 'next/server';
import { POST as GeneratePOST } from '../generate/route';

export async function POST(req: Request) {
    // Clone the request to modify the body
    const body = await req.json();
    body.endpointMode = 'brainstorm';

    // Create new request with modified body
    const modifiedReq = new Request(req.url, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify(body),
    });

    // Typecast to any as NextRequest is expected but Request works for body/headers reading
    return GeneratePOST(modifiedReq as any);
}
