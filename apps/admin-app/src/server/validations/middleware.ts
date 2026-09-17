import { NextRequest } from 'next/server';
import { ZodError } from 'zod';

export function validateBody<T>(schema: any) {
  return async (request: NextRequest): Promise<T> => {
    try {
      const body = await request.json();
      return schema.parse(body) as T;
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((e: any) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        throw new ValidationError('Validation failed', errors);
      }
      throw error;
    }
  };
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function handleValidationError(error: unknown): Response | null {
  if (error instanceof ValidationError) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: error.errors,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  return null;
}
