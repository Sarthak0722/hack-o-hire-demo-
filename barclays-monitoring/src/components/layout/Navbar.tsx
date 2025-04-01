import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navigationItems = [
  { name: 'Overview', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'API Services', path: '/services', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { name: 'Logs Explorer', path: '/logs', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { name: 'Anomaly Detection', path: '/anomalies', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  { name: 'Infrastructure', path: '/infrastructure', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01' },
  { name: 'Settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
];

export const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bg-gray-900 text-white h-screen w-64 fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold mb-8">Barclays API Monitoring</h1>
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={item.icon}
                />
              </svg>
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Environment Selector */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-800">
        <select className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700">
          <option value="prod">Production</option>
          <option value="dr">Disaster Recovery</option>
          <option value="staging">Staging</option>
          <option value="dev">Development</option>
        </select>
      </div>
    </nav>
  );
}; 