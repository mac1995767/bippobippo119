import React, { useState, useCallback } from 'react';
import { FaLayerGroup, FaTimes } from 'react-icons/fa';

function LayerControl({ onToggleLayers }) {
  const [isOpen, setIsOpen] = useState(false);
  const [layers, setLayers] = useState({
    hospitals: true,
    pharmacies: true,
    publicTransport: false,
    heatmap: false
  });

  const handleLayerToggle = useCallback((layerName) => {
    setLayers(prev => {
      const newLayers = { ...prev, [layerName]: !prev[layerName] };
      onToggleLayers?.(newLayers);
      return newLayers;
    });
  }, [onToggleLayers]);

  return (
    <>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="레이어"
        className="flex items-center justify-center w-14 h-12 hover:bg-gray-100 transition"
      >
        <div className="flex flex-col items-center text-sm">
          <div className="mb-1">
            <FaLayerGroup size={18} />
          </div>
          <span className="text-xs">레이어</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-16 top-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">레이어 설정</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={20} />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">병원</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={layers.hospitals}
                  onChange={() => handleLayerToggle('hospitals')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">약국</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={layers.pharmacies}
                  onChange={() => handleLayerToggle('pharmacies')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">대중교통</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={layers.publicTransport}
                  onChange={() => handleLayerToggle('publicTransport')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">히트맵</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={layers.heatmap}
                  onChange={() => handleLayerToggle('heatmap')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LayerControl; 