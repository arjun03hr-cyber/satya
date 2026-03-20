import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || "";

class ApiService {
  private async getAuthHeader(): Promise<Record<string, string>> {
    // Local development bypass support
    if (localStorage.getItem('admin_bypass') === 'true') {
      return {
        'Authorization': 'Bearer mock-token'
      };
    }

    // Attempt to get our primary Custom JWT token first
    let token = localStorage.getItem('satyakavach_token');
    
    // Fallback to Supabase session (if it exists)
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token || null;
    }
    
    if (!token) return {};

    return {
      'Authorization': `Bearer ${token}`
    };
  }

  async fetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers = await this.getAuthHeader();

    const response = await fetch(`${API_BASE}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('satyakavach_token');
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  }

  // --- Scans ---
  async analyzeText(text: string, forceAI: boolean = false): Promise<any> {
    try {
      const res = await this.fetch('/analyze', {
        method: 'POST',
        body: JSON.stringify({ text, forceAI }),
      });

      // Response validation and schema guard
      if (!res || typeof res !== 'object') {
        throw new Error("Invalid API response format");
      }

      // Ensure all required fields exist with safe defaults
      return {
        verdict: res.verdict || 'UNVERIFIED',
        confidence: typeof res.confidence === 'number' ? res.confidence : 0,
        explanation: res.explanation || "No clarification available.",
        keyPoints: Array.isArray(res.keyPoints) ? res.keyPoints : [],
        sources: Array.isArray(res.sources) ? res.sources.map((s: any) => ({
          title: s?.title || "Verification Node",
          uri: s?.uri || "#",
          verified: !!s?.verified
        })) : [],
        categories: {
          bias: res.categories?.bias ?? 0,
          sensationalism: res.categories?.sensationalism ?? 0,
          logicalConsistency: res.categories?.logicalConsistency ?? 0,
        },
        cached: !!res.cached,
        search_count: res.search_count ?? 0
      };
    } catch (err) {
      console.error("ANALYZE API ERROR:", err);
      throw err;
    }
  }

  async getHistory() {
    return this.fetch('/history');
  }

  async getHistoryResult(id: string): Promise<any> {
    try {
      const res = await this.fetch(`/history?id=${id}`);
      
      // Response validation and schema guard
      if (!res || typeof res !== 'object') {
        throw new Error("Invalid API response format");
      }

      // Ensure all required fields exist with safe defaults
      return {
        verdict: res.verdict || 'UNVERIFIED',
        confidence: typeof res.confidence === 'number' ? res.confidence : 0,
        explanation: res.explanation || "No clarification available.",
        keyPoints: Array.isArray(res.keyPoints) ? res.keyPoints : [],
        sources: Array.isArray(res.sources) ? res.sources.map((s: any) => ({
          title: s?.title || "Verification Node",
          uri: s?.uri || "#",
          verified: !!s?.verified
        })) : [],
        categories: {
          bias: res.categories?.bias ?? 0,
          sensationalism: res.categories?.sensationalism ?? 0,
          logicalConsistency: res.categories?.logicalConsistency ?? 0,
        },
        cached: !!res.cached,
        search_count: res.search_count ?? 0
      };
    } catch (err) {
      console.error("GET HISTORY RESULT ERROR:", err);
      throw err;
    }
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
