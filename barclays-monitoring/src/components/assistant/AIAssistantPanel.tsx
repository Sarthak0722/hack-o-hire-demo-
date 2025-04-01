import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Anomaly, Alert } from '../../types/api';

interface AIAssistantPanelProps {
  anomalies: Anomaly[];
  alerts: Alert[];
  onClose?: () => void;
}

interface Message {
  type: 'user' | 'assistant';
  content: string;
}

export const AIAssistantPanel = forwardRef<any, AIAssistantPanelProps>(({ 
  anomalies, 
  alerts,
  onClose 
}, ref) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'assistant',
      content: "Hello! I'm your AI assistant. I can help you analyze API performance, investigate anomalies, and understand alerts. How can I help you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = { type: 'user', content: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    // Generate AI response
    setTimeout(() => {
      const response = generateResponse(inputValue, anomalies, alerts);
      setMessages(prev => [...prev, { type: 'assistant' as const, content: response }]);
    }, 500);
  };

  const generateAlertAnalysis = (alert: Alert): string => {
    let analysis = `🚨 ${alert.title}\n\n`;
    analysis += `Description: ${alert.description}\n\n`;

    // Add category-specific analysis
    if (alert.tags.includes('performance')) {
      analysis += "Performance Impact Analysis:\n";
      analysis += "- Checking service dependencies\n";
      analysis += "- Monitoring resource utilization\n";
      analysis += "- Analyzing traffic patterns\n\n";
    } else if (alert.tags.includes('security')) {
      analysis += "Security Assessment:\n";
      analysis += "- Reviewing access patterns\n";
      analysis += "- Checking for potential breaches\n";
      analysis += "- Analyzing authentication logs\n\n";
    }

    // Add predictive insights if available
    if (alert.description.toLowerCase().includes('predict')) {
      analysis += "Predictive Analysis:\n";
      if (alert.description.includes('error rates')) {
        analysis += "- Based on historical error patterns\n";
        analysis += "- Service dependency analysis\n";
        analysis += "- Trend correlation with past incidents\n";
      } else if (alert.description.includes('fraud')) {
        analysis += "- Transaction pattern analysis\n";
        analysis += "- User behavior modeling\n";
        analysis += "- Geographic distribution analysis\n";
      }
      analysis += "\n";
    }

    // Add recommended actions
    analysis += "Recommended Actions:\n";
    if (alert.severity === 'critical') {
      analysis += "1. Immediate investigation required\n";
      analysis += "2. Escalate to on-call team\n";
      analysis += "3. Prepare incident response\n";
    } else {
      analysis += "1. Monitor the situation\n";
      analysis += "2. Review related metrics\n";
      analysis += "3. Update alert thresholds if needed\n";
    }

    return analysis;
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

  const generatePerformanceAnalysis = (anomalies: Anomaly[]): string => {
    if (anomalies.length === 0) {
      return 'No performance anomalies detected in the recent timeframe.';
    }

    return `Performance Analysis:\n\n${anomalies.map(anomaly => {
      const mockAlert: Alert = {
        id: anomaly.id,
        anomaly_id: anomaly.id,
        timestamp: anomaly.timestamp,
        title: `Performance Alert: ${anomaly.service_name}`,
        description: `Performance issue detected in ${anomaly.service_name}`,
        severity: anomaly.severity,
        status: 'new',
        affected_services: [anomaly.service_name],
        tags: [anomaly.type],
        region: anomaly.region,
        environment: anomaly.environment
      };

      return `Service: ${anomaly.service_name}\n` +
        `Endpoint: ${anomaly.api_endpoint}\n` +
        `Current Value: ${anomaly.metric_value}ms\n` +
        `Threshold: ${anomaly.threshold_value}ms\n` +
        `Impact: ${getAlertImpact(mockAlert)}\n` +
        `Recommendation: ${getRecommendation(anomaly)}`;
    }).join('\n\n')}`;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b bg-white">
        <h2 className="text-lg font-semibold text-gray-800">AI Assistant</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close AI Assistant"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'assistant' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'assistant'
                  ? 'bg-blue-50 text-gray-800'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about anomalies, alerts, or API performance..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}); 