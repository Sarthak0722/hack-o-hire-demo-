import React, { useState } from 'react';
import { Anomaly, Alert } from '../../types/api';

interface AIAssistantProps {
  anomalies: Anomaly[];
  alerts: Alert[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ anomalies, alerts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string; isUser: boolean}>>([
    {text: "Hello! I'm your AI assistant. I can help you analyze API performance, investigate anomalies, and understand alerts. How can I help you today?", isUser: false}
  ]);
  const [input, setInput] = useState('');

  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    if (input.includes('anomaly') || input.includes('anomalies')) {
      return `Found ${anomalies.length} anomalies. Most recent: ${anomalies[0]?.description || 'None detected'}`;
    }
    if (input.includes('alert') || input.includes('alerts')) {
      return `There are ${alerts.length} active alerts. Latest: ${alerts[0]?.title || 'None active'}`;
    }
    return "I can help you analyze anomalies and alerts. What would you like to know?";
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 flex items-center justify-center z-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          )}
        </svg>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-xl z-50 flex flex-col">
          <div className="p-4 border-b bg-indigo-600 text-white rounded-t-lg">
            <h3 className="text-lg font-medium">AI Assistant</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  msg.isUser ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim()) return;
              
              const response = generateResponse(input);
              setMessages(prev => [...prev, 
                {text: input, isUser: true},
                {text: response, isUser: false}
              ]);
              setInput('');
            }}>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about anomalies, alerts, or API performance..."
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant; 