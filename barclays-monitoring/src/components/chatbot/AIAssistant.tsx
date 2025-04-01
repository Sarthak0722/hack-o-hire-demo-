import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Anomaly, Alert } from '../../types/api';
import { AIAssistantPanel } from '../assistant/AIAssistantPanel';

interface AIAssistantProps {
  anomalies: Anomaly[];
  alerts: Alert[];
}

const AIAssistant = forwardRef<any, AIAssistantProps>(({ anomalies, alerts }, ref) => {
  const panelRef = useRef<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    handleAlertAnalysis: (alert: Alert) => {
      if (panelRef.current?.analyzeAlert) {
        panelRef.current.analyzeAlert(alert);
      }
    }
  }));

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${isOpen ? 'w-96' : 'w-auto'}`}>
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl h-[600px] flex flex-col">
          <AIAssistantPanel 
            ref={panelRef} 
            anomalies={anomalies} 
            alerts={alerts} 
            onClose={() => setIsOpen(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
          aria-label="Open AI Assistant"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
    </div>
  );
});

AIAssistant.displayName = 'AIAssistant';

export default AIAssistant; 