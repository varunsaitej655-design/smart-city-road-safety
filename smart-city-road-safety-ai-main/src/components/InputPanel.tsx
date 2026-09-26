import React, { useState } from 'react';
import {
  AutoFetchedEnvironmentalMetrics,
  AutomatedHazardInference,
  EngineUserInputs,
  RoadType,
  VehicleType,
  WeatherCondition,
} from '../types/engine';
import {
  Sliders,
  MapPin,
  Compass,
  Clock,
  CloudRain,
  Car,
  Bike,
  Bus,
  Truck,
  Zap,
  RefreshCw,
  Radio,
  Eye,
  AlertTriangle,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface InputPanelProps {
  inputs: EngineUserInputs;
  locationOptions: string[];
  maxSafeSpeed: number;
  isAiProcessing: boolean;
  automatedInference?: AutomatedHazardInference;
  environmentalMetrics?: AutoFetchedEnvironmentalMetrics;
  isSyncingFeeds?: boolean;
  onSyncFeeds?: () => void;
  onInputChange: <K extends keyof EngineUserInputs>(key: K, value: EngineUserInputs[K]) => void;
  onRunAiAnalysis: () => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  inputs,
  locationOptions,
  maxSafeSpeed,
  isAiProcessing,
  automatedInference,
  environmentalMetrics,
  isSyncingFeeds = false,
  onSyncFeeds,
  onInputChange,
  onRunAiAnalysis,
}) => {
  const currentSpeed = inputs.targetSpeed ?? inputs.speed ?? 80;
  const isSpeedExceeded = currentSpeed > maxSafeSpeed;
  const speedDifference = currentSpeed - maxSafeSpeed;

  const destination =
    inputs.destinationLocation || inputs.destination || locationOptions[1] || locationOptions[0] || '';

  // 5 Transport Modes specified in prompt
  const vehicleOptions: { type: VehicleType; label: string; icon: React.ElementType; note: string }[] = [
    { type: '2-Wheeler', label: '2-Wheeler', icon: Bike, note: 'Bike/Scooter • High Skid & Pothole Risk' },
    { type: 'Car', label: 'Car / SUV', icon: Car, note: 'Passenger Car • Standard Adhesion Profile' },
    { type: 'Bus', label: 'Bus', icon: Bus, note: 'State/City Transit • Passenger Inertia' },
    { type: 'Auto-Rickshaw', label: 'Auto-Rickshaw', icon: Car, note: '3-Wheeler • Rollover Risk >45 km/h' },
    { type: 'Heavy Commercial Vehicle', label: 'Heavy Vehicle', icon: Truck, note: 'Freight Truck • Extended Braking Gap' },
  ];

  const roadTypes: RoadType[] = ['Highway', 'Urban', 'Rural'];

  // Indian Standard Time (IST) Hours with Preset Windows
  const istTimeWindows = [
    { label: 'Night Hazard (03:00 IST)', hour: 3, flag: 'Night Hazard: 22:00 - 05:00 IST' },
    { label: 'Morning Peak (09:00 IST)', hour: 9, flag: 'Morning Peak: 08:00 - 11:00 IST' },
    { label: 'Off-Peak Day (14:00 IST)', hour: 14, flag: 'Off-Peak Day Window' },
    { label: 'Evening Peak (18:30 IST)', hour: 18, flag: 'Evening Peak: 17:00 - 20:00 IST' },
    { label: 'Late Night Hazard (23:00 IST)', hour: 23, flag: 'Night Hazard: 22:00 - 05:00 IST' },
  ];

  const handleHourChange = (hour: number) => {
    onInputChange('hour', hour);
    const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
    onInputChange('isPeakHour', isPeak);

    let windowLabel = 'Off-Peak Day Window';
    if (hour >= 22 || hour <= 5) {
      windowLabel = 'Night Hazard (22:00 - 05:00 IST)';
    } else if (hour >= 8 && hour <= 10) {
      windowLabel = 'Morning Peak (08:00 - 11:00 IST)';
    } else if (hour >= 17 && hour <= 20) {
      windowLabel = 'Evening Peak (17:00 - 20:00 IST)';
    }

    onInputChange(
      'timeOfTravel',
      `${hour.toString().padStart(2, '0')}:00 IST (${windowLabel})`,
    );
  };

  const detectedLocationText =
    environmentalMetrics?.detectedLocation ||
    inputs.originLocation ||
    '28.6139° N, 77.2090° E (Delhi NCR / NH-48 Corridor)';

  const weatherStatusText =
    environmentalMetrics?.currentWeatherConditions ||
    `${inputs.weatherCondition} Conditions`;

  return (
    <div className="bg-white/90 border border-sky-100 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xs flex flex-col gap-4.5 transition-all">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-sky-100/90 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Dynamic Travel Inputs & Live Feeds
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
          5 Dynamic UI Parameters
        </span>
      </div>

      {/* AUTO-FETCHED AMBIENT METRICS (Zero Manual Input Required) */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50/70 via-[#FAF7F2] to-pink-50/60 border border-sky-100/90 text-xs flex flex-col gap-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Radio className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            <span className="uppercase tracking-wider text-[10px] text-slate-500 font-mono">
              Auto-Fetched Live Feeds (No Manual Form Entry Required)
            </span>
          </div>
          {onSyncFeeds && (
            <button
              onClick={onSyncFeeds}
              disabled={isSyncingFeeds}
              className="flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-900 font-medium cursor-pointer transition"
              title="Resync GPS & Live Weather"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingFeeds ? 'animate-spin' : ''}`} />
              <span>{isSyncingFeeds ? 'Syncing...' : 'Sync GPS'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
          {/* Origin Pinpoint */}
          <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/70 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Auto-Detected Origin</span>
              <span className="font-semibold text-slate-800 text-[11px] line-clamp-1">{detectedLocationText}</span>
            </div>
          </div>

          {/* Live Weather */}
          <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/70 flex items-start gap-2">
            <CloudRain className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Live Weather API</span>
              <span className="font-semibold text-slate-800 text-[11px] line-clamp-1">{weatherStatusText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. DESTINATION LOCATION (Indian Highway / City / Corridor) */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-sky-600" />
            1. Destination Location (India Region)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Pan-India States & UTs</span>
        </label>
        <div className="relative">
          <select
            value={destination}
            onChange={(e) => {
              onInputChange('destinationLocation', e.target.value);
              onInputChange('destination', e.target.value);
            }}
            className="w-full bg-[#FAF7F2] border border-amber-200/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400 transition cursor-pointer appearance-none pr-8"
          >
            {locationOptions.map((loc, idx) => (
              <option key={idx} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* 2. TARGET SPEED (KM/H) & COMPLIANCE WARNING */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            2. Target Operating Speed
          </label>
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                isSpeedExceeded
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {currentSpeed} km/h
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Safe Ceiling: {maxSafeSpeed} km/h
            </span>
          </div>
        </div>

        <input
          type="range"
          min="20"
          max="140"
          step="5"
          value={currentSpeed}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            onInputChange('targetSpeed', val);
            onInputChange('speed', val);
          }}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
        />

        {isSpeedExceeded ? (
          <div className="p-2 rounded-lg bg-pink-50 border border-pink-200 text-rose-800 text-[11px] flex items-center gap-2 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span>Speed disparity: Exceeds safe condition-based ceiling by +{speedDifference} km/h.</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 font-mono pl-1">
            Compliant operating speed: {maxSafeSpeed - currentSpeed} km/h safety margin.
          </div>
        )}
      </div>

      {/* 3. SELECTED TRANSPORT MODE (5 Modes) */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span>3. Selected Transport Mode</span>
          <span className="text-[10px] text-slate-400 font-mono">India Traffic Fleet</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {vehicleOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = inputs.vehicleType === opt.type;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => onInputChange('vehicleType', opt.type)}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50 border-sky-400 shadow-2xs'
                    : 'bg-[#FAF7F2] border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-700' : 'text-slate-500'}`} />
                  <span className={`text-xs font-bold ${isSelected ? 'text-sky-900' : 'text-slate-800'}`}>
                    {opt.label}
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 leading-tight">{opt.note}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. INDIAN STANDARD TIME (IST) & PEAK / NIGHT HAZARD WINDOW */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            4. Time of Travel (Indian Standard Time)
          </label>
          <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            {(inputs.hour ?? 19).toString().padStart(2, '0')}:00 IST
          </span>
        </div>

        {/* Quick IST Window Preset Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {istTimeWindows.map((tw) => {
            const isActive = inputs.hour === tw.hour;
            return (
              <button
                key={tw.hour}
                type="button"
                onClick={() => handleHourChange(tw.hour)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer text-left truncate ${
                  isActive
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title={tw.flag}
              >
                {tw.label}
              </button>
            );
          })}
        </div>

        {/* Hour Slider */}
        <div className="pt-1">
          <input
            type="range"
            min="0"
            max="23"
            step="1"
            value={inputs.hour ?? 19}
            onChange={(e) => handleHourChange(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
            <span>00:00 (Night Hazard)</span>
            <span>08:00 (Morning Peak)</span>
            <span>14:00 (Off-Peak)</span>
            <span>20:00 (Evening)</span>
            <span>23:00 (Night)</span>
          </div>
        </div>
      </div>

      {/* 5. ROAD TYPE */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">5. Road Classification</label>
        <div className="grid grid-cols-3 gap-2">
          {roadTypes.map((rt) => {
            const isSelected = inputs.roadType === rt;
            return (
              <button
                key={rt}
                type="button"
                onClick={() => onInputChange('roadType', rt)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50 text-sky-900 border-sky-400 shadow-2xs'
                    : 'bg-[#FAF7F2] text-slate-700 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {rt === 'Highway' ? 'National Highway / Expy' : rt === 'Urban' ? 'Urban Arterial' : 'Rural Link Road'}
              </button>
            );
          })}
        </div>
      </div>

      {/* AUTO-DEDUCED HAZARDS INFO BADGE */}
      {automatedInference && (
        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-slate-700 text-xs space-y-1 shadow-2xs">
          <div className="flex items-center justify-between font-bold text-slate-800 text-[11px]">
            <span>Auto-Deduced Route Hazards:</span>
            <span className="text-[10px] font-mono text-amber-800 bg-amber-100/70 px-1.5 py-0.2 rounded">
              {automatedInference.blackspotDetected ? 'Blackspot Corridor' : 'Safe Corridor'}
            </span>
          </div>
          <div className="text-[11px] text-slate-600 leading-relaxed font-mono">
            Potholes: {automatedInference.potholesCount} | Speed Breakers: {automatedInference.speedBreakersCount} | Sudden Diversion: {automatedInference.suddenDiversionDetected ? 'Detected' : 'None'} | Annual Accidents: {automatedInference.historicalAccidentsAnnual}
          </div>
        </div>
      )}

      {/* EXECUTE SPATIAL ANALYSIS BUTTON */}
      <button
        type="button"
        onClick={onRunAiAnalysis}
        disabled={isAiProcessing}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-pink-500 to-rose-500 hover:from-sky-600 hover:via-pink-600 hover:to-rose-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-pink-200/60 hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
      >
        <Sparkles className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} />
        <span>{isAiProcessing ? 'Computing Spatial Risk Analytics...' : 'Run Spatial Risk Analytics & Route Advisory'}</span>
      </button>
    </div>
  );
};
