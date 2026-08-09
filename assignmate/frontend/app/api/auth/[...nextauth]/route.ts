// Simplified auth setup for development
// Full NextAuth setup requires additional dependencies

export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(
    JSON.stringify({ 
      message: 'Auth endpoint - Configure NextAuth properly for production' 
    }),
    { status: 200 }
  );
}

export async function POST() {
  return new Response(
    JSON.stringify({ 
      message: 'Auth endpoint - Configure NextAuth properly for production' 
    }),
    { status: 200 }
  );
}
