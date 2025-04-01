import React, { useState, useEffect } from 'react';
import { APILog, APIMetrics, Anomaly, Alert } from '../../types/api';
import { generateMockAPILog, generateMockMetrics, generateMockAnomaly, generateMockAlert } from '../../data/mockData';
import { ServiceMetricsView } from './ServiceMetricsView';
import { ServiceOverview } from './ServiceOverview';
import { EndpointDetail } from './EndpointDetail';
import AIAssistant from '../chatbot/AIAssistant';

export const DashboardLayout: React.FC = () => {
  const [logs, setLogs] = useState<APILog[]>([]);
  const [metrics, setMetrics] = useState<APIMetrics | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('1h');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('production');

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
        {sortedServices.map(serviceCategory => (
          <ServiceOverview
            key={serviceCategory}
            serviceCategory={serviceCategory}
            metrics={metrics!.metrics_by_category[serviceCategory]}
            alerts={alerts.filter(a => a.affected_services.includes(serviceCategory))}
            anomalies={anomalies.filter(a => a.service_category === serviceCategory)}
            onClick={() => setSelectedService(serviceCategory)}
          />
        ))}
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
                <nav className="flex mt-2" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-4">
                    <li>
                      <button
                        onClick={() => {
                          setSelectedEndpoint(null);
                          setSelectedService(null);
                        }}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Dashboard
                      </button>
                    </li>
                    {selectedService && (
                      <li className="flex items-center">
                        <span className="mx-2 text-gray-400">/</span>
                        <button
                          onClick={() => setSelectedEndpoint(null)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          {selectedService}
                        </button>
                      </li>
                    )}
                    {selectedEndpoint && (
                      <li className="flex items-center">
                        <span className="mx-2 text-gray-400">/</span>
                        <span className="text-sm font-medium text-gray-500">
                          {selectedEndpoint}
                        </span>
                      </li>
                    )}
                  </ol>
                </nav>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value)}
                className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="dr">DR</option>
              </select>

              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                <option value="15m">Last 15 minutes</option>
                <option value="1h">Last hour</option>
                <option value="6h">Last 6 hours</option>
                <option value="24h">Last 24 hours</option>
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