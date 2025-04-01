import React from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { Tooltip } from 'react-tooltip';

interface ServerHealth {
  id: string;
  location: [number, number]; // [longitude, latitude]
  name: string;
  region: string;
  provider: string;
  health: number;
  responseTime: number;
  successRate: number;
}

interface WorldMapViewProps {
  onClose: () => void;
  serverHealth: ServerHealth[];
}

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

export const WorldMapView: React.FC<WorldMapViewProps> = ({ onClose, serverHealth }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Global API Health</h2>
            <p className="text-sm text-gray-500">Real-time health status across cloud regions</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600">Healthy Regions</h3>
              <p className="text-2xl font-semibold text-green-600">
                {serverHealth.filter(s => s.health >= 90).length}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600">Degraded Regions</h3>
              <p className="text-2xl font-semibold text-yellow-600">
                {serverHealth.filter(s => s.health >= 70 && s.health < 90).length}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600">Critical Regions</h3>
              <p className="text-2xl font-semibold text-red-600">
                {serverHealth.filter(s => s.health < 70).length}
              </p>
            </div>
          </div>

          <div className="h-[600px] bg-gray-50 rounded-lg overflow-hidden">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 150
              }}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#E5E7EB"
                      stroke="#D1D5DB"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none', fill: '#D1D5DB' },
                        pressed: { outline: 'none' }
                      }}
                    />
                  ))
                }
              </Geographies>
              {serverHealth.map((server) => (
                <Marker key={server.id} coordinates={server.location}>
                  <circle
                    r={6}
                    fill={
                      server.health >= 90 ? "#10B981" :
                      server.health >= 70 ? "#F59E0B" :
                      "#EF4444"
                    }
                    stroke="#FFF"
                    strokeWidth={2}
                    data-tooltip-id={`tooltip-${server.id}`}
                    className="cursor-pointer hover:r-8 transition-all duration-200"
                  />
                  <Tooltip id={`tooltip-${server.id}`}>
                    <div className="p-2">
                      <p className="font-semibold">{server.name}</p>
                      <p className="text-sm">{server.provider} - {server.region}</p>
                      <div className="mt-2 space-y-1">
                        <p>Health: {server.health}%</p>
                        <p>Response Time: {server.responseTime}ms</p>
                        <p>Success Rate: {server.successRate}%</p>
                      </div>
                    </div>
                  </Tooltip>
                </Marker>
              ))}
            </ComposableMap>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Healthy (≥90%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-gray-600">Degraded (70-89%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">Critical (≤69%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 