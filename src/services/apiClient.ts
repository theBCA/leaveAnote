import { auth } from '../config/firebase';
import { env } from '../config/env';

interface ApiErrorBody {
  error?: string;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseError(response: Response): Promise<never> {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  throw new ApiError(body?.error || `Request failed (${response.status})`, response.status);
}

function resolveApiUrl(input: string): string {
  if (/^https?:\/\//.test(input)) return input;
  if (!env.apiBaseUrl) return input;

  const normalizedBase = env.apiBaseUrl.endsWith('/') ? env.apiBaseUrl.slice(0, -1) : env.apiBaseUrl;
  const normalizedPath = input.startsWith('/') ? input : `/${input}`;
  return `${normalizedBase}${normalizedPath}`;
}

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

  const response = await fetch(resolveApiUrl(input), {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    return parseError(response);
  }

  return response.json() as Promise<T>;
}
