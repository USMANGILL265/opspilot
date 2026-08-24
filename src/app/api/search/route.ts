import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { executeSearch } from '@/lib/search';
import { SearchQuerySchema } from '@/lib/validation';
import { logRequest } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const user = getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = SearchQuerySchema.parse(searchParams);

    const searchResults = await executeSearch(query.q, query.aiAssisted, query.type);

    logRequest({ requestId, method: 'GET', path: '/api/search', statusCode: 200, userId: user.userId, durationMs: Date.now() - start });

    return NextResponse.json({
      success: true,
      data: searchResults,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error executing search';
    logRequest({ requestId, method: 'GET', path: '/api/search', statusCode: 400, error: errorMsg, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
