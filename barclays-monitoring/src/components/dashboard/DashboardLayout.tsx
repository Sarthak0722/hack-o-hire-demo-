import React, { useState, useEffect } from 'react';
import { APILog, APIMetrics, Anomaly, Alert } from '../../types/api';
import { generateMockAPILog, generateMockMetrics, generateMockAnomaly, generateMockAlert } from '../../data/mockData';
import { ServiceMetricsView } from './ServiceMetricsView';
import { ServiceOverview } from './ServiceOverview';
import { EndpointDetail } from './EndpointDetail';
import AIAssistant from '../chatbot/AIAssistant';
import { CriticalAlertsPanel } from '../alerts/CriticalAlertsPanel';

interface Service {
  name: string;
  category: string;
  successRate: number;
  responseTime: number;
  activeUsers: number;
  riskScore: number;
  anomalies: number;
}

export const DashboardLayout: React.FC = () => {
  const [logs, setLogs] = useState<APILog[]>([]);
  const [metrics, setMetrics] = useState<APIMetrics | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('1h');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('production');
  const [services] = useState<Service[]>([
    {
      name: 'Authentication Services',
      category: 'Authentication Services',
      successRate: 95.9,
      responseTime: 149,
      activeUsers: 73,
      riskScore: 2.5,
      anomalies: 7
    },
    {
      name: 'Account Services',
      category: 'Account Services',
      successRate: 97.5,
      responseTime: 149,
      activeUsers: 81,
      riskScore: 1.5,
      anomalies: 2
    },
    {
      name: 'Payment Services',
      category: 'Payment Services',
      successRate: 98.8,
      responseTime: 446,
      activeUsers: 86,
      riskScore: 0.7,
      anomalies: 1
    },
    {
      name: 'Risk & Compliance',
      category: 'Risk & Compliance',
      successRate: 98.9,
      responseTime: 491,
      activeUsers: 89,
      riskScore: 0.7,
      anomalies: 4
    }
  ]);
  const [showCriticalAlerts, setShowCriticalAlerts] = useState(false);
  const [aiAssistantRef, setAiAssistantRef] = useState<any>(null);

  useEffect(() => {
    const generateInitialData = () => {
      const initialLogs = Array.from({ length: 1000 }, generateMockAPILog)
        .filter(log => log.environment === selectedEnvironment);
      setLogs(initialLogs);
      setMetrics(generateMockMetrics(initialLogs));
      
      const initialAnomalies = initialLogs
        .filter(log => Math.random() < 0.05)
        .map(log => generateMockAnomaly(log));
      setAnomalies(initialAnomalies);
      
      setAlerts(initialAnomalies
        .filter(anomaly => anomaly.severity === 'high' || anomaly.severity === 'critical')
        .map(anomaly => generateMockAlert(anomaly)));
    };

    generateInitialData();
    const interval = setInterval(() => {
      const newLog = generateMockAPILog();
      if (newLog.environment === selectedEnvironment) {
        setLogs(prevLogs => [...prevLogs.slice(-1000), newLog]);
        setMetrics(prevMetrics => generateMockMetrics([...logs.slice(-1000), newLog]));
        
        if (Math.random() < 0.05) {
          const newAnomaly = generateMockAnomaly(newLog);
          setAnomalies(prev => [...prev.slice(-50), newAnomaly]);
          if (newAnomaly.severity === 'high' || newAnomaly.severity === 'critical') {
            setAlerts(prev => [...prev.slice(-50), generateMockAlert(newAnomaly)]);
          }
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedEnvironment]);

  const getServiceRiskScore = (serviceCategory: string) => {
    if (!metrics?.metrics_by_category[serviceCategory]) return 0;
    return metrics.metrics_by_category[serviceCategory].risk_score;
  };

  const sortedServices = Object.keys(metrics?.metrics_by_category || {})
    .sort((a, b) => getServiceRiskScore(b) - getServiceRiskScore(a));

  const handleAlertClick = (alert: Alert) => {
    if (aiAssistantRef?.current?.handleAlertAnalysis) {
      aiAssistantRef.current.handleAlertAnalysis(alert);
    }
    setShowCriticalAlerts(false);
  };

  const handleViewAPI = (service: string, endpoint: string) => {
    setSelectedService(service);
    if (endpoint) {
      setSelectedEndpoint(endpoint);
    }
    setShowCriticalAlerts(false);
  };

  const renderContent = () => {
    if (selectedEndpoint && selectedService) {
      return (
        <EndpointDetail
          logs={logs}
          endpoint={selectedEndpoint}
          serviceCategory={selectedService}
          onBack={() => setSelectedEndpoint(null)}
        />
      );
    }

    if (selectedService) {
      return (
        <ServiceMetricsView
          logs={logs}
          serviceCategory={selectedService}
          onEndpointSelect={setSelectedEndpoint}
          onBack={() => setSelectedService(null)}
        />
      );
    }

    return (
      <>
        {/* Critical Alerts Banner */}
        {alerts.some(a => a.severity === 'critical' && a.status === 'new') && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-lg font-medium text-red-800">Critical Alerts Detected</h3>
                  <p className="text-sm text-red-600">
                    {alerts.filter(a => a.severity === 'critical' && a.status === 'new').length} critical issues require immediate attention
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCriticalAlerts(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                View Alerts
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => {
            const serviceMetrics = metrics?.metrics_by_category[service.category] || {
              total_requests: 0,
              success_rate: service.successRate,
              avg_response_time: service.responseTime,
              active_users: service.activeUsers,
              risk_score: service.riskScore
            };
            
            return (
              <ServiceOverview
                key={service.category}
                serviceCategory={service.category}
                metrics={serviceMetrics}
                alerts={alerts.filter(a => a.affected_services.includes(service.category))}
                anomalies={anomalies.filter(a => a.service_category === service.category)}
                onClick={() => setSelectedService(service.category)}
              />
            );
          })}
        </div>
      </>
    );
  };

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedEndpoint ? 'Endpoint Details' :
                 selectedService ? `${selectedService} Overview` :
                 'Service Overview'}
              </h1>
              {(selectedService || selectedEndpoint) && (
                <div className="flex items-center space-x-2 mt-2">
                  <button
                    onClick={() => {
                      setSelectedService(null);
                      setSelectedEndpoint(null);
                    }}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200"
                  >
                    Dashboard
                  </button>
                  {selectedService && (
                    <>
                      <span className="text-gray-400">/</span>
                      <button
                        onClick={() => setSelectedEndpoint(null)}
                        className="px-3 py-1 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200"
                      >
                        {selectedService}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value)}
                className="px-3 py-1 bg-white border border-gray-300 rounded-md text-gray-700"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="dr">DR</option>
              </select>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-1 bg-white border border-gray-300 rounded-md text-gray-700"
              >
                <option value="1h">Last hour</option>
                <option value="6h">Last 6 hours</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {renderContent()}
      </main>

      {/* AI Assistant */}
      <AIAssistant
        ref={aiAssistantRef}
        anomalies={anomalies}
        alerts={alerts}
      />

      {/* Critical Alerts Panel */}
      {showCriticalAlerts && (
        <CriticalAlertsPanel
          alerts={alerts}
          anomalies={anomalies}
          onAlertClick={handleAlertClick}
          onClose={() => setShowCriticalAlerts(false)}
          onViewAPI={handleViewAPI}
        />
      )}
    </div>
  );
}; 