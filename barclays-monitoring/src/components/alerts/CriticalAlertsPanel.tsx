import React from 'react';
import { Alert, Anomaly } from '../../types/api';

interface CriticalAlertsPanelProps {
  alerts: Alert[];
  anomalies: Anomaly[];
  onAlertClick: (alert: Alert) => void;
  onClose: () => void;
  onViewAPI: (service: string, endpoint: string) => void;
}

const AlertCategory = {
  PERFORMANCE: 'Performance-Based Alerts',
  SECURITY: 'Security-Based Alerts',
  COMPLIANCE: 'Compliance & Regulatory Alerts',
  INFRASTRUCTURE: 'Infrastructure & System Alerts',
  PREDICTIVE: 'Predictive Alerts (AI/ML)',
} as const;

const getAlertCategory = (alert: Alert): keyof typeof AlertCategory => {
  const tags = alert.tags.map(t => t.toLowerCase());
  
  if (tags.includes('security') || tags.includes('unauthorized')) {
    return 'SECURITY';
  }
  if (tags.includes('compliance') || tags.includes('regulatory')) {
    return 'COMPLIANCE';
  }
  if (tags.includes('infrastructure') || tags.includes('system')) {
    return 'INFRASTRUCTURE';
  }
  if (alert.title.toLowerCase().includes('predict') || alert.description.toLowerCase().includes('predict')) {
    return 'PREDICTIVE';
  }
  return 'PERFORMANCE';
};

const getPredictionParameters = (alert: Alert): string[] | null => {
  if (getAlertCategory(alert) !== 'PREDICTIVE') return null;
  
  const parameters = [];
  if (alert.description.includes('error rates')) {
    parameters.push('Historical error rate patterns');
    parameters.push('Service dependency graph analysis');
  }
  if (alert.description.includes('fraud')) {
    parameters.push('Transaction velocity');
    parameters.push('User behavior patterns');
    parameters.push('Geographic distribution');
  }
  if (alert.description.includes('degradation')) {
    parameters.push('Response time trend analysis');
    parameters.push('Resource utilization patterns');
    parameters.push('Traffic pattern correlation');
  }
  return parameters;
};

const getAlertCause = (alert: Alert): string => {
  if (alert.tags.includes('performance')) {
    return 'Response time has exceeded the configured threshold, indicating potential performance bottlenecks.';
  }
  if (alert.tags.includes('error_rate')) {
    return 'Error rate has spiked above normal levels, suggesting systemic issues.';
  }
  if (alert.tags.includes('security')) {
    return 'Unusual access patterns or security violations have been detected.';
  }
  if (alert.description.toLowerCase().includes('predict')) {
    return 'AI model has detected patterns indicating potential future issues.';
  }
  return 'Multiple metrics have deviated from their normal ranges.';
};

export const CriticalAlertsPanel: React.FC<CriticalAlertsPanelProps> = ({
  alerts,
  anomalies,
  onAlertClick,
  onClose,
  onViewAPI,
}) => {
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'new');
  const categorizedAlerts = criticalAlerts.reduce((acc, alert) => {
    const category = getAlertCategory(alert);
    if (!acc[category]) acc[category] = [];
    acc[category].push(alert);
    return acc;
  }, {} as Record<keyof typeof AlertCategory, Alert[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Critical Alerts</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-4rem)]">
          {Object.entries(AlertCategory).map(([key, category]) => {
            const categoryAlerts = categorizedAlerts[key as keyof typeof AlertCategory] || [];
            if (categoryAlerts.length === 0) return null;
            
            return (
              <div key={key} className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{category}</h3>
                <div className="space-y-4">
                  {categoryAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className="bg-white border border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-red-600 font-medium">{alert.title}</h4>
                          <p className="text-gray-600 mt-1">{alert.description}</p>
                          <div className="mt-2 bg-orange-50 border-l-4 border-orange-400 p-3">
                            <p className="text-sm text-orange-800">
                              <strong>Cause:</strong> {getAlertCause(alert)}
                            </p>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {alert.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          {key === 'PREDICTIVE' && (
                            <div className="mt-3 pl-4 border-l-2 border-blue-200">
                              <p className="text-sm font-medium text-blue-600 mb-1">Prediction based on:</p>
                              <ul className="list-disc list-inside text-sm text-gray-600">
                                {alert.metadata?.prediction_factors?.map(factor => (
                                  <li key={factor}>{factor}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          {alert.severity}
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-gray-500">
                        <span>Service: {alert.affected_services.join(', ')} | </span>
                        <span>Region: {alert.region} | </span>
                        <span>Environment: {alert.environment}</span>
                      </div>
                      <div className="mt-3 flex items-center space-x-3">
                        <button
                          onClick={() => onViewAPI(alert.affected_services[0], alert.description.includes('in') ? alert.description.split('in ')[1].split(' ')[0] : '')}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                        >
                          View Affected API
                        </button>
                        <button
                          onClick={() => onAlertClick(alert)}
                          className="px-3 py-1 text-sm bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors duration-200 flex items-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          <span>Get AI Help</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 