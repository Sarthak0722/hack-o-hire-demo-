import { APILog, APIMetrics, Anomaly, Alert } from '../types/api';
import { v4 as uuidv4 } from 'uuid';

const API_SERVICES = {
  'Payment Services': {
    'Card Payments': ['/api/v2/cards/authorize', '/api/v2/cards/capture', '/api/v2/cards/refund'],
    'SWIFT Transfers': ['/api/v1/swift/transfer', '/api/v1/swift/status', '/api/v1/swift/reconcile'],
    'Domestic Payments': ['/api/v2/domestic/transfer', '/api/v2/domestic/status', '/api/v2/domestic/batch']
  },
  'Authentication Services': {
    'OAuth Service': ['/api/v2/oauth/token', '/api/v2/oauth/refresh', '/api/v2/oauth/revoke'],
    'MFA Service': ['/api/v1/mfa/initiate', '/api/v1/mfa/verify', '/api/v1/mfa/status'],
    'SSO Service': ['/api/v2/sso/login', '/api/v2/sso/validate', '/api/v2/sso/logout']
  },
  'Account Services': {
    'Current Accounts': ['/api/v2/accounts/details', '/api/v2/accounts/balance', '/api/v2/accounts/transactions'],
    'Savings Accounts': ['/api/v2/savings/summary', '/api/v2/savings/interest', '/api/v2/savings/transfer'],
    'Investment Accounts': ['/api/v1/investments/portfolio', '/api/v1/investments/orders', '/api/v1/investments/execute']
  },
  'Risk & Compliance': {
    'AML Screening': ['/api/v2/aml/screen', '/api/v2/aml/report', '/api/v2/aml/audit'],
    'Fraud Detection': ['/api/v2/fraud/analyze', '/api/v2/fraud/report', '/api/v2/fraud/investigate'],
    'KYC Service': ['/api/v2/kyc/verify', '/api/v2/kyc/update', '/api/v2/kyc/documents']
  }
};

const CLOUD_PROVIDERS = ['AWS', 'Azure', 'GCP'] as const;

const REGIONS = {
  'Europe': ['uk-london-1', 'eu-frankfurt-1', 'eu-dublin-1'],
  'Americas': ['us-east-1', 'us-west-1', 'ca-central-1'],
  'Asia-Pacific': ['ap-singapore-1', 'ap-mumbai-1', 'ap-sydney-1']
};

const ENVIRONMENTS = ['production', 'staging', 'dr'] as const;

const CLIENT_TYPES = ['web', 'mobile', 'api'] as const;
const CLIENT_VERSIONS = ['1.0.0', '1.1.0', '2.0.0'] as const;

export const generateMockAPILog = (): APILog => {
  // Select random service category and specific service
  const serviceCategory = Object.keys(API_SERVICES)[Math.floor(Math.random() * Object.keys(API_SERVICES).length)];
  const services = API_SERVICES[serviceCategory as keyof typeof API_SERVICES];
  const serviceName = Object.keys(services)[Math.floor(Math.random() * Object.keys(services).length)];
  const endpoints = services[serviceName as keyof typeof services] as string[];
  const api_endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  // Generate realistic response times based on service type
  let base_response_time = 100; // base 100ms
  if (serviceCategory === 'Payment Services') base_response_time = 300;
  if (api_endpoint.includes('fraud') || api_endpoint.includes('aml')) base_response_time = 500;
  const response_time = base_response_time + (Math.random() * base_response_time);

  // Generate realistic error rates based on service criticality
  const error_probability = serviceCategory === 'Payment Services' ? 0.01 : 
                          serviceCategory === 'Risk & Compliance' ? 0.02 : 0.05;
  const status_code = Math.random() > (1 - error_probability) ? 
                     (Math.random() > 0.5 ? 500 : 400) : 200;

  // Select region based on time of day to simulate global traffic patterns
  const hour = new Date().getHours();
  const region_category = hour >= 16 ? 'Americas' : 
                         hour >= 8 ? 'Europe' : 'Asia-Pacific';
  const region = REGIONS[region_category][Math.floor(Math.random() * REGIONS[region_category].length)];
  const cloud_provider = CLOUD_PROVIDERS[Math.floor(Math.random() * CLOUD_PROVIDERS.length)];
  const host = `${region}-server-${Math.floor(Math.random() * 10)}`;

  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    service_category: serviceCategory,
    service_name: serviceName,
    api_endpoint,
    http_method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)] as any,
    user_id: `USER${Math.floor(Math.random() * 1000)}`,
    transaction_id: `TXN${Math.floor(Math.random() * 10000)}`,
    response_time_ms: response_time,
    status: status_code >= 500 ? 'error' : status_code >= 400 ? 'warning' : 'success',
    status_code,
    error_message: status_code >= 400 ? 
      `Error processing request: ${status_code === 500 ? 'Internal Server Error' : 'Invalid Request'}` : 
      undefined,
    trace_id: uuidv4(),
    span_id: uuidv4(),
    resource: `${region}-server-${Math.floor(Math.random() * 10)}`,
    environment: ENVIRONMENTS[Math.floor(Math.random() * ENVIRONMENTS.length)],
    region,
    metadata: {
      datacenter: region.split('-')[0],
      client_type: CLIENT_TYPES[Math.floor(Math.random() * CLIENT_TYPES.length)],
      client_version: CLIENT_VERSIONS[Math.floor(Math.random() * CLIENT_VERSIONS.length)]
    },
    cloud_provider,
    host
  };
};

export const generateMockMetrics = (logs: APILog[]): APIMetrics => {
  const total = logs.length;
  const successful = logs.filter(log => log.status === 'success').length;
  const response_times = logs.map(log => log.response_time_ms);
  
  // Calculate active users (unique users in last 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const active_users = new Set(logs
    .filter(log => new Date(log.timestamp) > new Date(fiveMinutesAgo))
    .map(log => log.user_id)).size;

  // Calculate time-based metrics
  const lastHourLogs = logs.filter(log => 
    new Date(log.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
  );
  const lastHourSuccessRate = (lastHourLogs.filter(log => log.status === 'success').length / lastHourLogs.length) * 100;
  const lastHourAvgResponseTime = lastHourLogs.reduce((sum, log) => sum + log.response_time_ms, 0) / lastHourLogs.length;
  
  // Calculate metrics by category and region
  const metrics_by_category = logs.reduce((acc, log) => {
    if (!acc[log.service_category]) {
      acc[log.service_category] = {
        total_requests: 0,
        success_rate: 0,
        avg_response_time: 0,
        risk_score: 0,
        active_users: 0
      };
    }
    acc[log.service_category].total_requests++;
    acc[log.service_category].success_rate = (acc[log.service_category].success_rate * (acc[log.service_category].total_requests - 1) + (log.status === 'success' ? 100 : 0)) / acc[log.service_category].total_requests;
    acc[log.service_category].avg_response_time = (acc[log.service_category].avg_response_time * (acc[log.service_category].total_requests - 1) + log.response_time_ms) / acc[log.service_category].total_requests;
    
    // Calculate risk score based on error rate and response time
    const errorRate = ((acc[log.service_category].total_requests - (acc[log.service_category].success_rate * acc[log.service_category].total_requests / 100)) / acc[log.service_category].total_requests) * 100;
    acc[log.service_category].risk_score = (errorRate * 0.6) + (acc[log.service_category].avg_response_time > 500 ? 40 : 0);
    
    // Update active users for category
    if (new Date(log.timestamp) > new Date(fiveMinutesAgo)) {
      acc[log.service_category].active_users++;
    }
    
    return acc;
  }, {} as Record<string, { 
    total_requests: number; 
    success_rate: number; 
    avg_response_time: number;
    risk_score: number;
    active_users: number;
  }>);

  const metrics_by_region = logs.reduce((acc, log) => {
    if (!acc[log.region]) {
      acc[log.region] = {
        total_requests: 0,
        success_rate: 0,
        avg_response_time: 0
      };
    }
    acc[log.region].total_requests++;
    acc[log.region].success_rate = (acc[log.region].success_rate * (acc[log.region].total_requests - 1) + (log.status === 'success' ? 100 : 0)) / acc[log.region].total_requests;
    acc[log.region].avg_response_time = (acc[log.region].avg_response_time * (acc[log.region].total_requests - 1) + log.response_time_ms) / acc[log.region].total_requests;
    return acc;
  }, {} as Record<string, { total_requests: number; success_rate: number; avg_response_time: number }>);
  
  return {
    total_requests: total % 1000000, // Reset after 1M requests
    success_rate: (successful / total) * 100,
    error_rate: ((total - successful) / total) * 100,
    avg_response_time: response_times.reduce((a, b) => a + b, 0) / total,
    p95_response_time: response_times.sort((a, b) => a - b)[Math.floor(total * 0.95)],
    p99_response_time: response_times.sort((a, b) => a - b)[Math.floor(total * 0.99)],
    requests_per_minute: total / 60,
    errors_last_hour: logs.filter(log => log.status === 'error').length,
    availability: (successful / total) * 100,
    active_users,
    last_hour_success_rate: lastHourSuccessRate,
    last_hour_avg_response_time: lastHourAvgResponseTime,
    metrics_by_category,
    metrics_by_region
  };
};

export const generateMockAnomaly = (log: APILog): Anomaly => {
  const types = ['response_time', 'error_rate', 'traffic_spike', 'security', 'performance'] as const;
  const type = types[Math.floor(Math.random() * types.length)];
  
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    type,
    severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
    service_category: log.service_category,
    service_name: log.service_name,
    api_endpoint: log.api_endpoint,
    description: `Detected unusual ${type} pattern in ${log.service_name}`,
    metric_value: log.response_time_ms,
    threshold_value: 500,
    confidence_score: Math.random() * 100,
    affected_users: Math.floor(Math.random() * 1000),
    status: 'detected',
    region: log.region,
    environment: log.environment
  };
};

export const generateMockAlert = (anomaly: Anomaly): Alert => {
  return {
    id: uuidv4(),
    anomaly_id: anomaly.id,
    timestamp: new Date().toISOString(),
    title: `${anomaly.severity.toUpperCase()} Alert: ${anomaly.type} in ${anomaly.service_name}`,
    description: anomaly.description,
    severity: anomaly.severity,
    status: 'new',
    affected_services: [anomaly.service_name],
    tags: [anomaly.type, anomaly.severity, anomaly.service_name],
    region: anomaly.region,
    environment: anomaly.environment
  };
}; 