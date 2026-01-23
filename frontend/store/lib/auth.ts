import { setCookie, getCookie, deleteCookie } from './cookies';

// Use Vercel API Routes (same domain)
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export async function register(name: string, email: string, password: string, phone?: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password, phone }),
  });

  if (!response.ok) {
    let errorMessage = 'Registration failed';
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Handle both wrapped and unwrapped responses
  const responseData = data.data || data;

  if (!responseData || !responseData.access_token) {
    throw new Error('Invalid response format from server');
  }

  if (typeof window !== 'undefined') {
    // Store in both localStorage and cookies
    localStorage.setItem('token', responseData.access_token);
    localStorage.setItem('user', JSON.stringify(responseData.user));
    setCookie('token', responseData.access_token, 7);
  }

  return responseData;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let errorMessage = 'Login failed';
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Handle both wrapped and unwrapped responses
  const responseData = data.data || data;

  if (!responseData || !responseData.access_token) {
    throw new Error('Invalid response format from server');
  }

  if (typeof window !== 'undefined') {
    // Store in both localStorage and cookies
    localStorage.setItem('token', responseData.access_token);
    localStorage.setItem('user', JSON.stringify(responseData.user));
    setCookie('token', responseData.access_token, 7);
  }

  return responseData;
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    deleteCookie('token');
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    // Try localStorage first, then cookies
    return localStorage.getItem('token') || getCookie('token');
  }
  return null;
}

export function getUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    logout();
    throw new Error('Unauthorized');
  }

  return response;
}

