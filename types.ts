
export interface AnalysisResult {
  verdict: 'REAL' | 'FAKE' | 'MISLEADING' | 'UNVERIFIED';
  confidence: number;
  explanation: string;
  keyPoints: string[];
  sources: { title: string; uri: string; verified: boolean }[];
  categories: {
    bias: number;
    sensationalism: number;
    logicalConsistency: number;
  };
}

// Database types
export interface Profile {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface AnalysisRecord {
  id: string;
  user_id: string;
  input_text: string;
  verdict: 'REAL' | 'FAKE' | 'MISLEADING' | 'UNVERIFIED';
  confidence: number;
  fake_risk_score: number;
  explanation: string;
  key_points: string[];
  sources: { title: string; uri: string; verified: boolean }[];
  categories: { bias: number; sensationalism: number; logicalConsistency: number };
  flagged: boolean;
  created_at: string;
  // Joined fields
  profiles?: { email: string };
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: 'delete' | 'flag' | 'unflag' | 'role_change';
  target_type: 'analysis' | 'user';
  target_id: string;
  details: string;
  created_at: string;
}

export interface DashboardStats {
  totalScans: number;
  highRiskCount: number;
  activeUsers: number;
  flaggedCount: number;
}
