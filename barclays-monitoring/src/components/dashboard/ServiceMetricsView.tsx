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
  Area,
  BarChart,
  Bar
} from 'recharts';

interface ServiceMetricsViewProps {
  logs: APILog[];
  serviceCategory: string;
  onEndpointSelect: (endpoint: string) => void;
  onBack: () => void;
}

export const ServiceMetricsView: React.FC<ServiceMetricsViewProps> = ({
  logs,
  serviceCategory,
  onEndpointSelect,
  onBack
}) => {
  const serviceData = useMemo(() => {
    const filteredLogs = logs.filter(log => log.service_category === serviceCategory);
    
    // Group by endpoint
    const endpointMetrics = filteredLogs.reduce((acc, log) => {
      const endpoint = log.api_endpoint;
      if (!acc[endpoint]) {
        acc[endpoint] = {
          total: 0,
          errors: 0,
          response_times: [],
          timestamps: []
        };
      }
      
      acc[endpoint].total++;
      if (log.status === 'error') acc[endpoint].errors++;
      acc[endpoint].response_times.push(log.response_time_ms);
      acc[endpoint].timestamps.push(log.timestamp);
      
      return acc;
    }, {} as Record<string, {
      total: number;
      errors: number;
      response_times: number[];
      timestamps: string[];
    }>);

    // Calculate metrics for each endpoint
    const endpoints = Object.entries(endpointMetrics).map(([endpoint, data]) => {
      const sortedTimes = [...data.response_times].sort((a, b) => a - b);
      const p95Index = Math.floor(sortedTimes.length * 0.95);
      const p99Index = Math.floor(sortedTimes.length * 0.99);
      
      return {
        endpoint,
        total_requests: data.total,
        success_rate: ((data.total - data.errors) / data.total * 100).toFixed(2),
        avg_response_time: (data.response_times.reduce((a, b) => a + b, 0) / data.total).toFixed(2),
        p95_response_time: sortedTimes[p95Index] || 0,
        p99_response_time: sortedTimes[p99Index] || 0,
        min_response_time: Math.min(...data.response_times),
        max_response_time: Math.max(...data.response_times),
        timestamps: data.timestamps,
        response_times: data.response_times
      };
    });

    // Calculate overall service metrics
    const totalRequests = endpoints.reduce((sum, ep) => sum + ep.total_requests, 0);
    const overallSuccess = endpoints.reduce((sum, ep) => 
      sum + (ep.total_requests * (parseFloat(ep.success_rate) / 100)), 0) / totalRequests * 100;
    const overallResponseTime = endpoints.reduce((sum, ep) => 
      sum + (ep.total_requests * parseFloat(ep.avg_response_time)), 0) / totalRequests;

    // Calculate overall P95 and P99
    const allResponseTimes = endpoints.flatMap(ep => ep.response_times).sort((a, b) => a - b);
    const p95Index = Math.floor(allResponseTimes.length * 0.95);
    const p99Index = Math.floor(allResponseTimes.length * 0.99);

    return {
      endpoints,
      overall: {
        total_requests: totalRequests,
        success_rate: overallSuccess.toFixed(2),
        avg_response_time: overallResponseTime.toFixed(2),
        p95_response_time: allResponseTimes[p95Index] || 0,
        p99_response_time: allResponseTimes[p99Index] || 0
      }
    };
  }, [logs, serviceCategory]);

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="px-3 py-1 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200 flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">{serviceCategory}</h2>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {serviceData.overall.total_requests.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {serviceData.overall.success_rate}%
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Avg Response Time</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {serviceData.overall.avg_response_time}ms
            </p>
          </div>
        </div>

        {/* Dynamic Thresholds */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Response Time Thresholds</h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-700">P95: {Math.round(serviceData.overall.p95_response_time)}ms</p>
              <p className="text-sm text-gray-700">P99: {Math.round(serviceData.overall.p99_response_time)}ms</p>
              <p className="text-sm text-yellow-600">Warning: {Math.round(serviceData.overall.p95_response_time * 1.2)}ms</p>
              <p className="text-sm text-red-600">Critical: {Math.round(serviceData.overall.p99_response_time * 1.2)}ms</p>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Error Rate Thresholds</h3>
            <div className="space-y-1">
              <p className="text-sm text-yellow-600">Warning: 5%</p>
              <p className="text-sm text-red-600">Critical: 10%</p>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Traffic Volume Thresholds</h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-700">Low: {Math.round(serviceData.overall.total_requests * 0.5)} req/min</p>
              <p className="text-sm text-gray-700">High: {Math.round(serviceData.overall.total_requests * 1.5)} req/min</p>
            </div>
          </div>
        </div>

        {/* Response Time Distribution */}
        <div className="space-y-6">
          <div className="h-[300px] bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Response Time Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="timestamp"
                  tick={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#666', fontSize: 12 }}
                  tickLine={{ stroke: '#666' }}
                  label={{ 
                    value: 'Response Time (ms)', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: '#666',
                    style: { textAnchor: 'middle' },
                    offset: -45
                  }}
                />
                <Tooltip 
                  contentStyle={{ background: 'white', border: '1px solid #ddd' }}
                  labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                />
                <Legend />
                {serviceData.endpoints.map((endpoint, i) => (
                  <Line
                    key={endpoint.endpoint}
                    type="monotone"
                    dataKey="response_time"
                    data={endpoint.timestamps.map((t, idx) => ({
                      timestamp: new Date(t).getTime(),
                      response_time: endpoint.response_times[idx]
                    }))}
                    name={endpoint.endpoint}
                    stroke={`hsl(${(i * 137) % 360}, 70%, 50%)`}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Error Rates */}
          <div className="h-[300px] bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Error Rates</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="timestamp"
                  tick={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#666', fontSize: 12 }}
                  tickLine={{ stroke: '#666' }}
                  label={{ 
                    value: 'Error Rate (%)', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: '#666',
                    style: { textAnchor: 'middle' },
                    offset: -45
                  }}
                />
                <Tooltip 
                  contentStyle={{ background: 'white', border: '1px solid #ddd' }}
                  labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                />
                <Legend />
                {serviceData.endpoints.map((endpoint, i) => (
                  <Line
                    key={endpoint.endpoint}
                    type="monotone"
                    dataKey="error_rate"
                    data={endpoint.timestamps.map((t) => ({
                      timestamp: new Date(t).getTime(),
                      error_rate: 100 - parseFloat(endpoint.success_rate)
                    }))}
                    name={endpoint.endpoint}
                    stroke={`hsl(${(i * 137) % 360}, 70%, 50%)`}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Traffic Volume */}
          <div className="h-[300px] bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Traffic Volume</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="timestamp"
                  tick={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#666', fontSize: 12 }}
                  tickLine={{ stroke: '#666' }}
                  label={{ 
                    value: 'Requests per Minute', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: '#666',
                    style: { textAnchor: 'middle' },
                    offset: -45
                  }}
                />
                <Tooltip 
                  contentStyle={{ background: 'white', border: '1px solid #ddd' }}
                  labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                />
                <Legend />
                {serviceData.endpoints.map((endpoint, i) => (
                  <Line
                    key={endpoint.endpoint}
                    type="monotone"
                    dataKey="requests"
                    data={endpoint.timestamps.map((t) => ({
                      timestamp: new Date(t).getTime(),
                      requests: endpoint.total_requests
                    }))}
                    name={endpoint.endpoint}
                    stroke={`hsl(${(i * 137) % 360}, 70%, 50%)`}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Endpoint Metrics Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Endpoint Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg (ms)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P95 (ms)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P99 (ms)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min (ms)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max (ms)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {serviceData.endpoints.map((endpoint) => (
                <tr
                  key={endpoint.endpoint}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onEndpointSelect(endpoint.endpoint)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {endpoint.endpoint}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {endpoint.total_requests.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {endpoint.success_rate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {endpoint.avg_response_time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {endpoint.p95_response_time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {endpoint.p99_response_time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {endpoint.min_response_time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {endpoint.max_response_time}
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