import React, { useMemo } from 'react';
import { APILog } from '../../types/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface EndpointDetailProps {
  logs: APILog[];
  endpoint: string;
  serviceCategory: string;
  onBack: () => void;
}

export const EndpointDetail: React.FC<EndpointDetailProps> = ({
  logs,
  endpoint,
  serviceCategory,
  onBack
}) => {
  const endpointData = useMemo(() => {
    const endpointLogs = logs.filter(
      log => log.service_category === serviceCategory && log.api_endpoint === endpoint
    );

    const timeSeriesData = endpointLogs.map(log => ({
      timestamp: log.timestamp,
      response_time: log.response_time_ms,
      status: log.status
    }));

    const total = endpointLogs.length;
    const errors = endpointLogs.filter(log => log.status === 'error').length;
    const responseTimes = endpointLogs.map(log => log.response_time_ms);
    const sortedTimes = [...responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    return {
      metrics: {
        total_requests: total,
        success_rate: total > 0 ? ((total - errors) / total * 100).toFixed(2) : '100.00',
        error_rate: total > 0 ? (errors / total * 100).toFixed(2) : '0.00',
        avg_response_time: total > 0 ? (responseTimes.reduce((a, b) => a + b, 0) / total).toFixed(2) : '0',
        p95_response_time: sortedTimes[p95Index] || 0,
        p99_response_time: sortedTimes[p99Index] || 0,
        min_response_time: Math.min(...responseTimes),
        max_response_time: Math.max(...responseTimes)
      },
      timeSeriesData,
      recentLogs: endpointLogs.slice(-10).reverse()
    };
  }, [logs, endpoint, serviceCategory]);

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="px-3 py-1 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200 flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Service Overview</span>
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">{endpoint}</h2>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {endpointData.metrics.success_rate}%
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Avg Response Time</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {endpointData.metrics.avg_response_time}ms
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">P95 Response Time</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {endpointData.metrics.p95_response_time}ms
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Error Rate</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {endpointData.metrics.error_rate}%
            </p>
          </div>
        </div>
      </div>

      {/* Response Time Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Response Time Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={endpointData.timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                formatter={(value: number) => `${value}ms`}
              />
              <Line
                type="monotone"
                dataKey="response_time"
                stroke="#4F46E5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error Message
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {endpointData.recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      log.status === 'success' ? 'bg-green-100 text-green-800' :
                      log.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.response_time_ms}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.user_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                    {log.error_message || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 