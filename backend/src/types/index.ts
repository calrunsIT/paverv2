export interface BusinessLocation {
  lat: number;
  lng: number;
  radius: number;
}

export interface ScanRequest {
  area?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  county?: string;
}

export interface ScanResult {
  scanId: string;
  area: string;
  businessesFound: number;
  businessesProcessed: number;
  noWebsiteCount: number;
  message: string;
}

export interface BusinessQuery {
  status?: string;
  hasWebsite?: boolean;
  county?: string;
  websiteQuality?: 'none' | 'facebook_only' | 'poor' | 'decent';
  limit?: number;
  offset?: number;
}

export interface BusinessUpdate {
  status?: 'discovered' | 'preview_generated' | 'approved' | 'emailed' | 'responded' | 'converted' | 'skipped';
  notes?: string;
  email?: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface DashboardStats {
  overview: {
    totalBusinesses: number;
    potentialTargets: number;
    noWebsiteBusinesses: number;
    facebookOnlyBusinesses: number;
    previewsGenerated: number;
    approvedBusinesses: number;
    emailsSent: number;
    conversions: number;
  };
  metrics: {
    conversionRate: number;
    previewConversionRate: number;
    targetRate: number;
  };
  breakdowns: {
    byCounty: Array<{ county: string; count: number }>;
    byQuality: Array<{ quality: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
  };
  recentScans: Array<{
    id: string;
    area: string;
    businessCount: number;
    noWebsiteCount: number;
    scannedAt: string;
  }>;
  lastUpdated: string;
}

export type WebsiteQuality = 'none' | 'facebook_only' | 'poor' | 'decent';
export type BusinessStatus = 'discovered' | 'preview_generated' | 'approved' | 'emailed' | 'responded' | 'converted' | 'skipped';
export type EmailStatus = 'queued' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced';

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  variables: string[];
}