import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code;
  
  if (!code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    // Call the backend to register the click and get the actual Shopify URL
    const backendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
    const res = await fetch(`${backendUrl}/api/shopify/affiliates/resolve/${code}`, {
      method: 'GET',
      cache: 'no-store'
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.shopifyUrl) {
        // Redirect the user to the Shopify destination URL
        return NextResponse.redirect(data.shopifyUrl);
      }
    }
  } catch (error) {
    console.error(`Failed to resolve tracking link for code: ${code}`, error);
  }
  
  // Fallback if anything goes wrong
  return NextResponse.redirect(new URL('/', request.url));
}
