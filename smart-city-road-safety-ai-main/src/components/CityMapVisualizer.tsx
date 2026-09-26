import React, { useState } from 'react';
import { AccidentDatasetRecord, RiskLevel, VisualMapOverlay } from '../types/engine';
import {
  Compass,
  Radio,
  MapPin,
  CheckCircle2,
  Navigation,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface CityMapVisualizerProps {
  dataset: AccidentDatasetRecord[];
  currentLocationName: string;
  destinationName: string;
  alternateRouteCorridor: string;
  riskLevel: RiskLevel;
  currentSpeed: number;
  visualMapOverlay?: VisualMapOverlay;
  onSelectLocation: (locationName: string) => void;
}

export const CityMapVisualizer: React.FC<CityMapVisualizerProps> = ({
  dataset,
  currentLocationName,
  destinationName,
  alternateRouteCorridor,
  riskLevel,
  currentSpeed,
  visualMapOverlay,
  onSelectLocation,
}) => {
  const [hoveredNode, setHoveredNode] = useState<AccidentDatasetRecord | null>(null);

  // Find origin, destination, and alternate corridor nodes
  const originNode =
    dataset.find(
      (d) => d.locationName.toLowerCase() === currentLocationName.toLowerCase(),
    ) || dataset[0];

  const destinationNode =
    dataset.find(
      (d) => d.locationName.toLowerCase() === destinationName.toLowerCase(),
    ) || dataset[1] || dataset[0];

  const alternateNode =
    dataset.find(
      (d) => d.locationName.toLowerCase() === alternateRouteCorridor.toLowerCase(),
    ) || dataset.find((d) => !d.isBlackspot && d.locationName !== originNode.locationName) || dataset[2];

  // Coordinates
  const origX = originNode.coordinates?.x ?? 48;
  const origY = originNode.coordinates?.y ?? 32;
  const destX = destinationNode.coordinates?.x ?? 58;
  const destY = destinationNode.coordinates?.y ?? 55;
  const altX = alternateNode?.coordinates?.x ?? 50;
  const altY = alternateNode?.coordinates?.y ?? 28;

  // Midpoint curvature for the Green Alternate Route
  const greenMidX = (origX + destX) / 2 + (altX - origX) * 0.4;
  const greenMidY = (origY + destY) / 2 + (altY - origY) * 0.4;

  // Red path color styling based on risk severity
  const isHighOrCritical = riskLevel === 'HIGH' || riskLevel === 'CRITICAL' || originNode.isBlackspot;

  return (
    <div className="bg-white/90 border border-sky-100 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xs flex flex-col gap-3.5 transition-all">
      {/* Map Header with Overlay Status */}
      <div className="flex items-center justify-between border-b border-sky-100/90 pb-2.5">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-sky-600 animate-spin-slow" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Frontend Canvas Map Overlay (India Region)
          </h3>
        </div>
        <div className="flex items-center flex-wrap gap-2 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-rose-700 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200 font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> RED PATH: High-Risk
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> GREEN PATH: Safe Corridor
          </span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full h-[380px] bg-gradient-to-br from-[#FFFDF9] via-[#F8FAFC] to-[#F0F9FF] rounded-2xl border border-sky-100/90 overflow-hidden flex items-center justify-center shadow-inner">
        {/* Spatial background grid in soft sky-blue dots */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#f472b6 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px',
          }}
        />

        {/* Pan-India Sub-label */}
        <div className="absolute top-3 left-3 pointer-events-none z-10 flex flex-col">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            National Highway Grid & MoRTH Blackspots
          </span>
          <span className="text-[11px] font-mono text-slate-600">
            Golden Quadrilateral • North-South • East-West Corridors
          </span>
        </div>

        <svg viewBox="0 0 100 100" className="w-full h-full p-2 select-none">
          <defs>
            {/* Red Glow Filter for High Risk Zones */}
            <filter id="red-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Green Glow Filter for Safe Optimal Path */}
            <filter id="green-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.0" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Gradient for Red Path */}
            <linearGradient id="redPathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
            {/* Gradient for Green Path */}
            <linearGradient id="greenPathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* India Regional Highway Backbone (Stylized Golden Quadrilateral & Spine) */}
          <g stroke="#cbd5e1" strokeWidth="0.8" opacity="0.8">
            {/* Delhi to Mumbai (NH-48) */}
            <line x1="46" y1="30" x2="36" y2="35" strokeDasharray="1.5,1.5" />
            <line x1="36" y1="35" x2="26" y2="46" strokeDasharray="1.5,1.5" />
            <line x1="26" y1="46" x2="28" y2="55" strokeDasharray="1.5,1.5" />
            {/* Mumbai to Chennai (NH-48) */}
            <line x1="28" y1="55" x2="32" y2="58" strokeDasharray="1.5,1.5" />
            <line x1="32" y1="58" x2="42" y2="74" strokeDasharray="1.5,1.5" />
            <line x1="42" y1="74" x2="54" y2="80" strokeDasharray="1.5,1.5" />
            {/* Chennai to Kolkata (NH-16) */}
            <line x1="54" y1="80" x2="47" y2="65" strokeDasharray="1.5,1.5" />
            <line x1="47" y1="65" x2="74" y2="52" strokeDasharray="1.5,1.5" />
            {/* Kolkata to Delhi (NH-19 / GT Road) */}
            <line x1="74" y1="52" x2="48" y2="32" strokeDasharray="1.5,1.5" />
            <line x1="48" y1="32" x2="46" y2="30" strokeDasharray="1.5,1.5" />
            {/* North-South Spine: Delhi to Punjab & Kashmir */}
            <line x1="46" y1="30" x2="44" y2="24" strokeDasharray="1.5,1.5" />
            <line x1="44" y1="24" x2="45" y2="18" strokeDasharray="1.5,1.5" />
            {/* South Spine: Bengaluru to Kerala (NH-44 & NH-766) */}
            <line x1="44" y1="76" x2="46" y2="82" strokeDasharray="1.5,1.5" />
            <line x1="44" y1="76" x2="41" y2="86" strokeDasharray="1.5,1.5" />
            <line x1="41" y1="86" x2="42" y2="88" strokeDasharray="1.5,1.5" />
          </g>

          {/* 1. RED HIGHLIGHT PATH: High-Risk Corridor, Congested Segments & Blackspots */}
          <g>
            {/* Direct Line with glow and animated dash */}
            <line
              x1={origX}
              y1={origY}
              x2={destX}
              y2={destY}
              stroke="url(#redPathGrad)"
              strokeWidth={isHighOrCritical ? '2.8' : '2.0'}
              strokeLinecap="round"
              filter="url(#red-glow)"
              opacity="0.9"
            />
            {/* Animated collision/risk dashes */}
            <line
              x1={origX}
              y1={origY}
              x2={destX}
              y2={destY}
              stroke="#ffffff"
              strokeWidth="0.9"
              strokeDasharray="2,3"
              strokeLinecap="round"
              className="animate-dash"
            />
            {/* Blackspot Warning Pulsing Ring on Primary Path */}
            <circle
              cx={(origX + destX) / 2}
              cy={(origY + destY) / 2}
              r="4.5"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="0.8"
              className="animate-ping"
              opacity="0.8"
            />
            <circle
              cx={(origX + destX) / 2}
              cy={(origY + destY) / 2}
              r="2"
              fill="#e11d48"
            />
          </g>

          {/* 2. GREEN HIGHLIGHT PATH: Best Recommended Safe Route */}
          <g>
            {/* Curved Path through Safe Bypass Node */}
            <path
              d={`M ${origX} ${origY} Q ${greenMidX} ${greenMidY} ${destX} ${destY}`}
              fill="none"
              stroke="url(#greenPathGrad)"
              strokeWidth="3.2"
              strokeLinecap="round"
              filter="url(#green-glow)"
              opacity="0.95"
            />
            {/* Animated Flow Pulse Line */}
            <path
              d={`M ${origX} ${origY} Q ${greenMidX} ${greenMidY} ${destX} ${destY}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeDasharray="3,4"
              strokeLinecap="round"
              className="animate-dash"
            />
          </g>

          {/* Render All Dataset Highway Corridors as Interactive Nodes */}
          {dataset.map((rec) => {
            const x = rec.coordinates?.x ?? 50;
            const y = rec.coordinates?.y ?? 50;
            const isOrigin = rec.locationName === originNode.locationName;
            const isDestination = rec.locationName === destinationNode.locationName;
            const isAlternate = rec.locationName === alternateNode.locationName;

            let fill = rec.isBlackspot ? '#f43f5e' : '#38bdf8';
            if (isAlternate) fill = '#10b981';
            if (isOrigin) fill = '#0284c7';
            if (isDestination) fill = '#ec4899';

            return (
              <g
                key={rec.locationId}
                className="cursor-pointer transition-transform hover:scale-125"
                onMouseEnter={() => setHoveredNode(rec)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onSelectLocation(rec.locationName)}
              >
                {/* Outer Ring for Blackspots or Selected Nodes */}
                {(rec.isBlackspot || isOrigin || isDestination || isAlternate) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isOrigin || isDestination ? '4.8' : '3.8'}
                    fill="none"
                    stroke={fill}
                    strokeWidth="0.8"
                    opacity={rec.isBlackspot ? '0.7' : '0.5'}
                    className={rec.isBlackspot ? 'animate-ping' : ''}
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isOrigin || isDestination ? '3.2' : rec.isBlackspot ? '2.8' : '2.0'}
                  fill={fill}
                  stroke="#ffffff"
                  strokeWidth="1"
                />

                {/* Node Label Text */}
                {(isOrigin || isDestination || isAlternate) && (
                  <text
                    x={x}
                    y={y + 5.5}
                    fontSize="2.4"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#1e293b"
                    className="select-none font-mono"
                  >
                    {isOrigin ? 'ORIGIN' : isDestination ? 'DEST' : 'SAFE BYPASS'}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Information Tooltip */}
        {hoveredNode && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-white/95 border border-sky-200 p-3 rounded-xl shadow-lg backdrop-blur-md text-xs z-30 pointer-events-none transition-all">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-extrabold text-slate-800 line-clamp-1">
                {hoveredNode.locationName}
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  hoveredNode.isBlackspot
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {hoveredNode.isBlackspot ? 'MoRTH Blackspot' : 'Safe Corridor'}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 space-y-0.5 font-mono">
              <div>State: {hoveredNode.state} ({hoveredNode.highwayNumber || 'Corridor'})</div>
              <div>
                Potholes: {hoveredNode.potholeCount} | Diversion: {hoveredNode.suddenDiversion ? 'Yes' : 'No'} | Speed Limit: {hoveredNode.speedLimitKmh} km/h
              </div>
              <div className="text-slate-500 font-sans text-[10px] mt-1 line-clamp-2">
                {hoveredNode.segmentDescription || 'Surface parameters cross-referenced from dataset.'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Route Coordinates Breakdown Bar */}
      <div className="p-3 rounded-xl bg-[#FAF7F2] border border-amber-200/70 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono shadow-2xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="text-slate-700">
            <strong>Origin:</strong> {originNode.state} ({origX}°, {origY}°)
          </span>
          <span className="text-slate-400">➔</span>
          <span className="text-slate-700">
            <strong>Dest:</strong> {destinationNode.state} ({destX}°, {destY}°)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Alternate Green Safe Waypoint: {alternateNode.locationName}</span>
        </div>
      </div>
    </div>
  );
};
