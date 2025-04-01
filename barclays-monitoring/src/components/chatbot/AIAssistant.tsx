import React from 'react';
import { Anomaly, Alert } from '../../types/api';
import { AIAssistantPanel } from '../assistant/AIAssistantPanel';

interface AIAssistantProps {
  anomalies: Anomaly[];
  alerts: Alert[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ anomalies, alerts }) => {
  return <AIAssistantPanel anomalies={anomalies} alerts={alerts} />;
};

export default AIAssistant; 