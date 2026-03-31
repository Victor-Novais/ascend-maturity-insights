const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const TOKEN_KEY = "ascend_token";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

class ApiClient {
  constructor(private readonly baseUrl: string) { }

  private buildUrl(endpoint: string, params?: RequestOptions["params"]): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (!params) return url.toString();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined) return;
      url.searchParams.set(key, String(value));
    });
    return url.toString();
  }

  private async parseBody<T>(response: Response): Promise<T> {
    if (response.status === 204) return {} as T;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return {} as T;
    return response.json() as Promise<T>;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers: customHeaders, ...fetchOptions } = options;
    const headers: HeadersInit = { ...(customHeaders || {}) };

    const token = getAuthToken();
    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
      (headers as Record<string, string>)["Content-Type"] = "application/json";
    }

    const response = await fetch(this.buildUrl(endpoint, params), {
      ...fetchOptions,
      headers,
    });

    if (response.status === 401) {
      clearAuthToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new ApiError("Sessão expirada. Faça login novamente.", 401);
    }

    if (!response.ok) {
      const payload = await this.parseBody<{ message?: string | string[] }>(response).catch(
        () => ({ message: "Erro na requisição" }),
      );
      const message = Array.isArray(payload.message)
        ? payload.message.join(", ")
        : payload.message || `HTTP ${response.status}`;
      throw new ApiError(message, response.status);
    }

    return this.parseBody<T>(response);
  }

  get<T>(endpoint: string, params?: RequestOptions["params"]) {
    return this.request<T>(endpoint, { method: "GET", params });
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient(API_BASE_URL);
