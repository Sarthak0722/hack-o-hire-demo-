import React, { useState, useEffect } from 'react';
import { APILog, APIMetrics, Anomaly, Alert } from '../../types/api';
import { generateMockAPILog, generateMockMetrics, generateMockAnomaly, generateMockAlert } from '../../data/mockData';
import { ServiceMetricsView } from './ServiceMetricsView';
import { ServiceOverview } from './ServiceOverview';
import { EndpointDetail } from './EndpointDetail';
import AIAssistant from '../chatbot/AIAssistant';

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
                  <span className="text-gray-400">/</span>
                  {selectedService && (
                    <>
                      <button
                        onClick={() => setSelectedEndpoint(null)}
                        className="px-3 py-1 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200"
                      >
                        {selectedService}
                      </button>
                      {selectedEndpoint && (
                        <>
                          <span className="text-gray-400">/</span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md">
                            {selectedEndpoint}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1h">Last hour</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Critical Alerts Banner */}
          {alerts.some(alert => alert.severity === 'critical' && alert.status === 'new') && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Critical Alerts Detected</h3>
                  <div className="mt-2 text-sm text-red-700">
                    {alerts.filter(alert => alert.severity === 'critical' && alert.status === 'new').length} critical issues require immediate attention
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          {renderContent()}
        </div>
      </main>

      {/* AI Assistant */}
      <AIAssistant anomalies={anomalies} alerts={alerts} />
    </div>
  );
}; 