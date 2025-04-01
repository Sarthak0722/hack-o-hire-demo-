export interface APILog {
  id: string;
  timestamp: string;
  service_category: string;
  service_name: string;
  api_endpoint: string;
  http_method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  user_id: string;
  transaction_id: string;
  response_time_ms: number;
  status: 'success' | 'warning' | 'error';
  status_code: number;
  error_message?: string;
  trace_id: string;
  span_id: string;
  resource: string;
  environment: 'production' | 'staging' | 'dr';
  region: string;
  metadata: {
    datacenter: string;
    client_type: 'web' | 'mobile' | 'api';
    client_version: string;
  };
}

export interface APIMetrics {
  total_requests: number;
  success_rate: number;
  error_rate: number;
  avg_response_time: number;
  p95_response_time: number;
  p99_response_time: number;
  requests_per_minute: number;
  errors_last_hour: number;
  availability: number;
  active_users: number;
  last_hour_success_rate: number;
  last_hour_avg_response_time: number;
  metrics_by_category: Record<string, {
    total_requests: number;
    success_rate: number;
    avg_response_time: number;
    risk_score: number;
    active_users: number;
  }>;
  metrics_by_region: Record<string, {
    total_requests: number;
    success_rate: number;
    avg_response_time: number;
  }>;
}

export interface Anomaly {
  id: string;
  timestamp: string;
  type: 'response_time' | 'error_rate' | 'traffic_spike' | 'security' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  service_category: string;
  service_name: string;
  api_endpoint: string;
  description: string;
  metric_value: number;
  threshold_value: number;
  confidence_score: number;
  affected_users: number;
  status: 'detected' | 'investigating' | 'resolved';
  region: string;
  environment: 'production' | 'staging' | 'dr';
}

export interface Alert {
  id: string;
  anomaly_id: string;
  timestamp: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'investigating' | 'resolved';
  affected_services: string[];
  tags: string[];
  region: string;
  environment: 'production' | 'staging' | 'dr';
  metadata?: {
    incident_id?: string;
    resolution_time?: number;
    assigned_team?: string;
  };
}

export interface ChatMessage {
  id: string;
  timestamp: string;
  type: 'user' | 'assistant';
  content: string;
  metadata?: any;
}

export interface ServiceMetrics {
  service_name: string;
  total_requests: number;
  success_rate: number;
  avg_response_time: number;
  error_count: number;
  p95_response_time: number;
  apdex_score: number;
}

export interface DashboardConfig {
  id: string;
  name: string;
  layout: 'grid' | 'list';
  widgets: DashboardWidget[];
  refresh_interval: number;
  user_id: string;
  is_default: boolean;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert_list' | 'anomaly_list';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  config: Record<string, any>;
  data_source: string;
} 