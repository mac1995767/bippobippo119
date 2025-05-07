import React from 'react';

function ZoomControls({ onZoomIn, onZoomOut }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onZoomIn}
        aria-label="지도 확대"
        className="w-11 h-11 rounded-md bg-white shadow border border-gray-300 flex items-center justify-center text-2xl font-bold active:scale-95 transition"
      >
        +
      </button>
      <button
        onClick={onZoomOut}
        aria-label="지도 축소"
        className="w-11 h-11 rounded-md bg-white shadow border border-gray-300 flex items-center justify-center text-2xl font-bold active:scale-95 transition"
      >
        –
      </button>
    </div>
  );
}

export default ZoomControls; 