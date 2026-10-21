import dotenv from 'dotenv';
import path from 'path';

export function reloadEnv(): void {
  // Try loading from all possible locations
  dotenv.config();
  dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '../server/.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
}

// Initial load
reloadEnv();

export interface AppConfig {
  port: number;
  clientOrigin: string;
  geminiApiKey: string | undefined;
  geminiModel: string;
  maxHistoryLength: number;
  isGeminiConfigured: boolean;
}

export const config = {
  get port(): number {
    return parseInt(process.env.PORT || '5000', 10);
  },
  get clientOrigin(): string {
    return process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  },
  get geminiApiKey(): string | undefined {
    reloadEnv();
    return process.env.GEMINI_API_KEY?.trim();
  },
  get geminiModel(): string {
    return process.env.GEMINI_MODEL?.trim() || 'gemini-flash-lite-latest';
  },
  get maxHistoryLength(): number {
    return parseInt(process.env.MAX_HISTORY_LENGTH || '12', 10);
  },
  get isGeminiConfigured(): boolean {
    const key = this.geminiApiKey;
    return Boolean(key && key.length > 5 && !key.includes('your_'));
  },
};
