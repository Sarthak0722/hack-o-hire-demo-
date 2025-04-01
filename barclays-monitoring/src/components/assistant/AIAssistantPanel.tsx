import React, { useState } from 'react';
import { Anomaly, Alert } from '../../types/api';

interface AIAssistantPanelProps {
  anomalies: Anomaly[];
  alerts: Alert[];
}

interface Message {
  type: 'user' | 'assistant';
  content: string;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ anomalies, alerts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'assistant',
      content: "Hello! I'm your AI assistant. I can help you analyze API performance, investigate anomalies, and understand alerts. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = { type: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Generate and add AI response
    const aiResponse = generateResponse(input, anomalies, alerts);
    setMessages(prev => [...prev, { type: 'assistant', content: aiResponse }]);
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
    <>
      {/* Chat Icon - Only show when panel is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors duration-200 z-50"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chat Panel */}
      <div 
        className={`fixed bottom-0 right-0 w-96 bg-white shadow-lg transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ height: 'calc(100vh - 64px)' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b bg-white">
            <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${
                  msg.type === 'assistant' 
                    ? 'bg-blue-50 text-gray-800' 
                    : 'bg-blue-600 text-white ml-auto'
                } p-3 rounded-lg max-w-[80%] whitespace-pre-wrap`}
              >
                {msg.content}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about anomalies, alerts, or API performance..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}; 