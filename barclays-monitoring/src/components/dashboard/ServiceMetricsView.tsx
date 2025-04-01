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

    return {
      endpoints,
      overall: {
        total_requests: totalRequests,
        success_rate: overallSuccess.toFixed(2),
        avg_response_time: overallResponseTime.toFixed(2)
      }
    };
  }, [logs, serviceCategory]);

  return (
    <div className="space-y-8">
      {/* Service Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{serviceCategory} Overview</h2>
            <p className="mt-1 text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
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
      </div>

      {/* Performance Charts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Response Time Distribution</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={serviceData.endpoints[0]?.timestamps.map((timestamp, i) => ({
              timestamp,
              ...serviceData.endpoints.reduce((acc, endpoint) => ({
                ...acc,
                [endpoint.endpoint]: endpoint.response_times[i]
              }), {})
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
              />
              <Legend />
              {serviceData.endpoints.map((endpoint, i) => (
                <Line
                  key={endpoint.endpoint}
                  type="monotone"
                  dataKey={endpoint.endpoint}
                  stroke={`hsl(${(i * 137) % 360}, 70%, 50%)`}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
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