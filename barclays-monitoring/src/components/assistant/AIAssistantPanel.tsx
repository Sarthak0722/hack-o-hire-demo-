import React, { useState } from 'react';
import { Anomaly, Alert } from '../../types/api';

interface AIAssistantPanelProps {
  anomalies: Anomaly[];
  alerts: Alert[];
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  anomalies,
  alerts,
  isOpen,
  onClose,
}) => {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'assistant'; content: string }>>([
    {
      type: 'assistant',
      content: 'Hello! I am your AI Assistant for API monitoring. I can help you analyze anomalies, investigate alerts, and suggest possible solutions. How can I help you today?'
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: userInput }]);

    // Generate AI response based on context
    const response = generateResponse(userInput, anomalies, alerts);
    setMessages(prev => [...prev, { type: 'assistant', content: response }]);
    setUserInput('');
  };

  const generateResponse = (input: string, anomalies: Anomaly[], alerts: Alert[]): string => {
    const lowercaseInput = input.toLowerCase();
    
    // Check for specific keywords and generate appropriate responses
    if (lowercaseInput.includes('anomaly') || lowercaseInput.includes('anomalies')) {
      const recentAnomalies = anomalies.slice(-3);
      return `I've analyzed recent anomalies:\n\n${recentAnomalies.map(anomaly => 
        `- ${anomaly.type} detected in ${anomaly.service_name} (${anomaly.severity} severity)\n  Root cause: ${getRootCause(anomaly)}\n  Recommendation: ${getRecommendation(anomaly)}`
      ).join('\n\n')}`;
    }

    if (lowercaseInput.includes('alert') || lowercaseInput.includes('alerts')) {
      const activeAlerts = alerts.filter(alert => alert.status === 'new');
      return `There are ${activeAlerts.length} active alerts:\n\n${activeAlerts.map(alert =>
        `- ${alert.title}\n  Impact: ${getAlertImpact(alert)}\n  Suggested action: ${getSuggestedAction(alert)}`
      ).join('\n\n')}`;
    }

    if (lowercaseInput.includes('performance') || lowercaseInput.includes('slow')) {
      const performanceAnomalies = anomalies.filter(a => 
        a.type === 'response_time' || a.type === 'performance'
      );
      return generatePerformanceAnalysis(performanceAnomalies);
    }

    return 'I can help you analyze anomalies, investigate alerts, and suggest solutions. What specific aspect would you like to know more about?';
  };

  const getRootCause = (anomaly: Anomaly): string => {
    switch (anomaly.type) {
      case 'response_time':
        return `High latency detected (${anomaly.metric_value}ms vs threshold ${anomaly.threshold_value}ms)`;
      case 'error_rate':
        return 'Increased error rate above normal threshold';
      case 'traffic_spike':
        return 'Unusual traffic pattern detected';
      case 'security':
        return 'Potential security threat detected';
      default:
        return 'Unknown anomaly type';
    }
  };

  const getRecommendation = (anomaly: Anomaly): string => {
    switch (anomaly.type) {
      case 'response_time':
        return 'Check database query performance and API endpoint optimization';
      case 'error_rate':
        return 'Review error logs and recent deployments';
      case 'traffic_spike':
        return 'Verify auto-scaling settings and capacity planning';
      case 'security':
        return 'Review security logs and access patterns';
      default:
        return 'Monitor the situation and investigate logs';
    }
  };

  const getAlertImpact = (alert: Alert): string => {
    switch (alert.severity) {
      case 'critical':
        return 'Service disruption affecting multiple users';
      case 'high':
        return 'Significant performance degradation';
      case 'medium':
        return 'Minor service impact';
      case 'low':
        return 'Potential issue requiring attention';
      default:
        return 'Unknown impact';
    }
  };

  const getSuggestedAction = (alert: Alert): string => {
    if (alert.severity === 'critical' || alert.severity === 'high') {
      return 'Immediate investigation required - escalate to on-call team';
    }
    return 'Monitor and investigate during business hours';
  };

  const generatePerformanceAnalysis = (performanceAnomalies: Anomaly[]): string => {
    if (performanceAnomalies.length === 0) {
      return 'No significant performance issues detected at this time.';
    }

    const analysis = performanceAnomalies.map(anomaly => ({
      service: anomaly.service_name,
      region: anomaly.region,
      severity: anomaly.severity,
      value: anomaly.metric_value
    }));

    return `Performance Analysis:\n\n${analysis.map(a =>
      `- ${a.service} (${a.region})\n  Current latency: ${a.value}ms\n  Severity: ${a.severity}`
    ).join('\n\n')}\n\nRecommendations:\n1. Review database query optimization\n2. Check network latency between regions\n3. Verify cache hit rates`;
  };

  return (
    <div
      className={`fixed right-0 top-0 h-screen w-96 bg-white shadow-lg transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-900 text-white">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-100 ml-8'
                  : 'bg-gray-100 mr-8'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {message.content}
              </pre>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask about anomalies, alerts, or performance..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 