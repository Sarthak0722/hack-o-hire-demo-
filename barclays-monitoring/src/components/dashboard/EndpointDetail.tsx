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
import { format } from 'date-fns';

interface EndpointDetailProps {
  logs: APILog[];
  endpoint: string;
  serviceCategory: string;
  onBack: () => void;
}

interface ThresholdMetrics {
  responseTime: {
    p95: number;
    p99: number;
    warning: number;
    critical: number;
  };
  errorRate: {
    warning: number;
    critical: number;
  };
  trafficVolume: {
    low: number;
    high: number;
  };
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
      status: log.status,
      status_code: log.status_code
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

  // Calculate dynamic thresholds based on historical data
  const thresholds = useMemo((): ThresholdMetrics => {
    const responseTimes = endpointData.timeSeriesData.map(log => log.response_time);
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    
    // Group logs by 5-minute intervals for traffic analysis
    const timeIntervals = endpointData.timeSeriesData.reduce((acc, log) => {
      const timeKey = new Date(log.timestamp).setMinutes(0, 0, 0);
      acc[timeKey] = (acc[timeKey] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const trafficCounts = Object.values(timeIntervals);
    const avgTraffic = trafficCounts.reduce((a, b) => a + b, 0) / trafficCounts.length;
    
    return {
      responseTime: {
        p95: responseTimes[p95Index] || 0,
        p99: responseTimes[p99Index] || 0,
        warning: responseTimes[p95Index] * 1.2 || 200, // 20% above p95
        critical: responseTimes[p99Index] * 1.2 || 300, // 20% above p99
      },
      errorRate: {
        warning: 5, // 5% error rate warning
        critical: 10, // 10% error rate critical
      },
      trafficVolume: {
        low: Math.max(avgTraffic * 0.5, 1), // 50% below average
        high: avgTraffic * 1.5, // 50% above average
      },
    };
  }, [endpointData.timeSeriesData]);

  // Prepare time series data
  const timeSeriesData = useMemo(() => {
    // Generate quick mock data for immediate visualization
    const mockData = [];
    const baseTime = new Date();
    for (let i = 0; i < 10; i++) {
      const time = new Date(baseTime.getTime() - (9 - i) * 60000);
      mockData.push({
        time: format(time, 'HH:mm:ss'),
        avgResponseTime: Math.random() * 100 + 50,
        error4xxRate: Math.random() * 15,
        error5xxRate: Math.random() * 25,
        requestCount: Math.floor(Math.random() * 100 + 50)
      });
    }
    return mockData;
  }, []); // Empty dependency array for static data

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

        <div className="grid grid-cols-4 gap-6 mb-8">
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
              {Math.round(endpointData.metrics.p95_response_time)}ms
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Error Rate</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {endpointData.metrics.error_rate}%
            </p>
          </div>
        </div>

        {/* Dynamic Thresholds */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Response Time Thresholds</h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-700">P95: {Math.round(thresholds.responseTime.p95)}ms</p>
              <p className="text-sm text-gray-700">P99: {Math.round(thresholds.responseTime.p99)}ms</p>
              <p className="text-sm text-yellow-600">Warning: {Math.round(thresholds.responseTime.warning)}ms</p>
              <p className="text-sm text-red-600">Critical: {Math.round(thresholds.responseTime.critical)}ms</p>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Error Rate Thresholds</h3>
            <div className="space-y-1">
              <p className="text-sm text-yellow-600">Warning: {thresholds.errorRate.warning}%</p>
              <p className="text-sm text-red-600">Critical: {thresholds.errorRate.critical}%</p>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Traffic Volume Thresholds</h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-700">Low: {Math.round(thresholds.trafficVolume.low)} req/min</p>
              <p className="text-sm text-gray-700">High: {Math.round(thresholds.trafficVolume.high)} req/min</p>
            </div>
          </div>
        </div>

        {/* Response Time Trend */}
        <div className="space-y-6">
          <div className="h-[300px] bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Response Time Trend</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: '#666' }}
                  tickLine={{ stroke: '#666' }}
                />
                <YAxis 
                  tick={{ fill: '#666' }}
                  tickLine={{ stroke: '#666' }}
                  label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft', fill: '#666' }}
                />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #ddd' }} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgResponseTime" 
                  stroke="#3B82F6" 
                  name="Response Time (ms)"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Error Rates */}
          <div className="h-[300px] bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Error Rates</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: '#666' }}
                  tickLine={{ stroke: '#666' }}
                />
                <YAxis 
                  tick={{ fill: '#666' }}
                  tickLine={{ stroke: '#666' }}
                  label={{ value: 'Error Rate (%)', angle: -90, position: 'insideLeft', fill: '#666' }}
                />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #ddd' }} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="error4xxRate" 
                  stroke="#FBBF24" 
                  name="4xx Error Rate (%)"
                  strokeWidth={2}
                  dot={{ fill: '#FBBF24', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="error5xxRate" 
                  stroke="#EF4444" 
                  name="5xx Error Rate (%)"
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Traffic Volume */}
          <div className="h-[300px] bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Traffic Volume</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: '#666' }}
                  tickLine={{ stroke: '#666' }}
                />
                <YAxis 
                  tick={{ fill: '#666' }}
                  tickLine={{ stroke: '#666' }}
                  label={{ value: 'Requests per Minute', angle: -90, position: 'insideLeft', fill: '#666' }}
                />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #ddd' }} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="requestCount" 
                  stroke="#10B981" 
                  name="Requests per Minute"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
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
                  Status Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trace ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Span ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Environment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cloud Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Host
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
                    {log.status_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.response_time_ms}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.user_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                    {log.trace_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                    {log.span_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.resource}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      log.environment === 'production' ? 'bg-purple-100 text-purple-800' :
                      log.environment === 'staging' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.environment}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.cloud_provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.region}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.host}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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