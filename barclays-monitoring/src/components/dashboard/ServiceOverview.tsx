import React from 'react';
import { Anomaly, Alert } from '../../types/api';

interface ServiceOverviewProps {
  serviceCategory: string;
  metrics: {
    total_requests: number;
    success_rate: number;
    avg_response_time: number;
    risk_score: number;
    active_users: number;
  };
  alerts: Alert[];
  anomalies: Anomaly[];
  onClick: () => void;
}

export const ServiceOverview: React.FC<ServiceOverviewProps> = ({
  serviceCategory,
  metrics,
  alerts,
  anomalies,
  onClick
}) => {
  const getStatusColor = (value: number, type: 'success' | 'response' | 'risk') => {
    if (type === 'success') {
      return value >= 99 ? 'text-green-600' :
             value >= 95 ? 'text-yellow-600' : 'text-red-600';
    }
    if (type === 'response') {
      return value <= 200 ? 'text-green-600' :
             value <= 500 ? 'text-yellow-600' : 'text-red-600';
    }
    // Risk score
    return value <= 20 ? 'text-green-600' :
           value <= 50 ? 'text-yellow-600' : 'text-red-600';
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'new').length;
  const recentAnomalies = anomalies.filter(a => {
    const anomalyTime = new Date(a.timestamp).getTime();
    const hourAgo = Date.now() - 60 * 60 * 1000;
    return anomalyTime > hourAgo;
  }).length;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow duration-200"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{serviceCategory}</h3>
          {(criticalAlerts > 0 || recentAnomalies > 0) && (
            <div className="flex space-x-2">
              {criticalAlerts > 0 && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                  {criticalAlerts} Critical
                </span>
              )}
              {recentAnomalies > 0 && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                  {recentAnomalies} Anomalies
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Success Rate</p>
            <p className={`text-lg font-semibold ${getStatusColor(metrics.success_rate, 'success')}`}>
              {metrics.success_rate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Response Time</p>
            <p className={`text-lg font-semibold ${getStatusColor(metrics.avg_response_time, 'response')}`}>
              {metrics.avg_response_time.toFixed(0)}ms
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Users</p>
            <p className="text-lg font-semibold text-gray-900">
              {metrics.active_users}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Risk Score</p>
            <p className={`text-lg font-semibold ${getStatusColor(metrics.risk_score, 'risk')}`}>
              {metrics.risk_score.toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 