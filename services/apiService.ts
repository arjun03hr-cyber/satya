import { supabase } from '../lib/supabase';

const API_BASE = '/api'; // Vercel routes all /api requests automatically to the api directory

class ApiService {
  private async getAuthHeader(): Promise<Record<string, string>> {
    // Local development bypass support
    if (localStorage.getItem('admin_bypass') === 'true') {
      return {
        'Authorization': 'Bearer mock-token'
      };
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) return {};

    return {
      'Authorization': `Bearer ${token}`
    };
  }

  async fetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers = await this.getAuthHeader();

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  }

  // --- Scans ---
  async analyzeText(text: string) {
    return this.fetch('/analyze', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getHistory() {
    return this.fetch('/history');
  }

  async deleteHistory(id: string) {
    return this.fetch(`/history?id=${id}`, {
      method: 'DELETE',
    });
  }

  // --- Admin ---
  async getAdminStats() {
    return this.fetch('/admin/stats');
  }

  async getAllSubmissions(limit = 50) {
    return this.fetch(`/admin/submissions?limit=${limit}`);
  }

  async flagSubmission(id: string, flag: boolean) {
    return this.fetch(`/admin/submissions`, {
      method: 'PATCH',
      body: JSON.stringify({ action: flag ? 'flag' : 'unflag', id }),
    });
  }

  async deleteSubmission(id: string) {
    return this.fetch(`/admin/submissions?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Admin - Users
  async getAdminUsers() {
    return this.fetch('/admin/users');
  }

  async updateUserRole(uid: string, role: string) {
    return this.fetch('/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ uid, role })
    });
  }

  async updateUserStatus(uid: string, status: string) {
    return this.fetch('/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ uid, status })
    });
  }

  async deleteUser(uid: string) {
    return this.fetch(`/admin/users?uid=${uid}`, {
      method: 'DELETE'
    });
  }

  // Admin - System
  async getSystemStatus() {
    return this.fetch('/admin/system');
  }
}

export const apiService = new ApiService();
