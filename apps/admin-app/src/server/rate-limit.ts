// Simple in-memory rate limiter
// For production, use Redis or a dedicated rate-limiting service

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number = 60000 // Default 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries
  if (entry && entry.resetTime < now) {
    rateLimitStore.delete(identifier);
  }

  const currentEntry = rateLimitStore.get(identifier);

  if (!currentEntry) {
    // First request in window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
    };
  }

  if (currentEntry.count >= limit) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: currentEntry.resetTime,
    };
  }

  // Increment count
  currentEntry.count++;
  return {
    allowed: true,
    remaining: limit - currentEntry.count,
    resetTime: currentEntry.resetTime,
  };
}

// Get identifier from request (IP address or user ID)
export function getRateLimitIdentifier(request: Request): string {
  // Try to get IP from headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // If authenticated, use user ID instead of IP
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    // Extract user ID from JWT (simplified - in production, verify token)
    return `user:${authHeader.substring(7).substring(0, 20)}`;
  }
  
  return `ip:${ip}`;
}

// Rate limit middleware for Next.js API routes
export function withRateLimit(limit: number, windowMs?: number) {
  return (request: Request) => {
    const identifier = getRateLimitIdentifier(request);
    const result = rateLimit(identifier, limit, windowMs);
    
    if (!result.allowed) {
      throw new RateLimitError('Too many requests', result.resetTime);
    }
    
    return result;
  };
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public resetTime: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export function handleRateLimitError(error: unknown): Response | null {
  if (error instanceof RateLimitError) {
    const retryAfter = Math.ceil((error.resetTime - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        retry_after: retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }
  return null;
}
