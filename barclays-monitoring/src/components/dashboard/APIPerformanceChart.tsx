import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { APILog } from '../../types/api';

interface APIPerformanceChartProps {
  logs: APILog[];
}

const APIPerformanceChart: React.FC<APIPerformanceChartProps> = ({ logs }) => {
  // Process logs into time series data
  const processData = () => {
    const timeWindows = 20; // Show last 20 time windows
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const groupedData = sortedLogs.reduce((acc: any[], log) => {
      const timestamp = new Date(log.timestamp);
      const timeKey = timestamp.toLocaleTimeString();
      
      const existingEntry = acc.find(entry => entry.time === timeKey);
      if (existingEntry) {
        existingEntry.count += 1;
        existingEntry.avgResponseTime = (existingEntry.avgResponseTime * (existingEntry.count - 1) + log.response_time_ms) / existingEntry.count;
        existingEntry.errorCount += log.status === 'error' ? 1 : 0;
      } else {
        acc.push({
          time: timeKey,
          count: 1,
          avgResponseTime: log.response_time_ms,
          errorCount: log.status === 'error' ? 1 : 0
        });
      }
      return acc;
    }, []);

    return groupedData.slice(-timeWindows);
  };

  const data = processData();

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            yAxisId="left"
            label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: 'Request Count', angle: 90, position: 'insideRight' }}
          />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="avgResponseTime"
            stroke="#8884d8"
            name="Avg Response Time"
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="count"
            stroke="#82ca9d"
            name="Request Count"
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="errorCount"
            stroke="#ff7f7f"
            name="Error Count"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default APIPerformanceChart; 