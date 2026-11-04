import type { ApiResponse } from '../types/index.js';

class ApiClient {
  private baseUrl: string = (import.meta.env.VITE_API_URL as string) || '/api';

  private getToken(): string | null {
    return localStorage.getItem('datahub_token');
  }

  public setToken(token: string | null) {
    if (token) {
      localStorage.setItem('datahub_token', token);
    } else {
      localStorage.removeItem('datahub_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      this.setToken(null);
      window.dispatchEvent(new CustomEvent('auth_unauthorized'));
    }

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.message || data.error?.details || 'Có lỗi xảy ra khi gọi API');
    }

    return data.data;
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
