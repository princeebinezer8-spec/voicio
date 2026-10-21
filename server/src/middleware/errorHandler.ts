import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('API Error:', err);

  const status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Handle common Gemini API errors gracefully
  if (err?.message?.includes('API_KEY_INVALID') || err?.status === 400) {
    message = 'Invalid Gemini API Key. Please verify your GEMINI_API_KEY setting in the server configuration.';
  } else if (err?.message?.includes('RESOURCE_EXHAUSTED') || err?.status === 429) {
    message = 'Gemini API free tier rate limit or quota reached. Please wait a few moments before trying again.';
  } else if (err?.message?.includes('NOT_FOUND') || err?.status === 404) {
    message = 'The configured Gemini model is not accessible. Please check GEMINI_MODEL in your server configuration.';
  }

  res.status(status).json({
    success: false,
    error: err.name || 'Error',
    message,
    statusCode: status,
  });
}
