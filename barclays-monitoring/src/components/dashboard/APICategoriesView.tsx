import React, { useState } from 'react';
import { APIMetrics } from '../../types/api';

interface APICategoriesViewProps {
  metrics: APIMetrics;
}

export const APICategoriesView: React.FC<APICategoriesViewProps> = ({ metrics }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'risk' | 'requests' | 'success'>('risk');

  const categories = Object.entries(metrics.metrics_by_category)
    .filter(([category]) => 
      category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort(([, a], [, b]) => {
      switch (sortBy) {
        case 'risk':
          return b.risk_score - a.risk_score;
        case 'requests':
          return b.total_requests - a.total_requests;
        case 'success':
          return b.success_rate - a.success_rate;
        default:
          return 0;
      }
    });

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">API Categories</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search categories..."
            className="px-3 py-2 border rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="px-3 py-2 border rounded-lg"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="risk">Sort by Risk</option>
            <option value="requests">Sort by Requests</option>
            <option value="success">Sort by Success Rate</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Risk Score</th>
              <th className="px-4 py-2 text-left">Active Users</th>
              <th className="px-4 py-2 text-left">Success Rate</th>
              <th className="px-4 py-2 text-left">Avg Response Time</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(([category, data]) => (
              <tr key={category} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{category}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    data.risk_score > 70 ? 'bg-red-100 text-red-800' :
                    data.risk_score > 40 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {data.risk_score.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-2">{data.active_users}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    data.success_rate < 95 ? 'bg-red-100 text-red-800' :
                    data.success_rate < 98 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {data.success_rate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-2">{data.avg_response_time.toFixed(1)}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 