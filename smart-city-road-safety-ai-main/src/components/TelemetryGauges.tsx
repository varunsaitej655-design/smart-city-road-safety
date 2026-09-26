import React from 'react';
import { AreaStatus, PhysicsTelemetry, RiskLevel } from '../types/engine';
import {
  AlertOctagon,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity,
  Eye,
  Crosshair,
} from 'lucide-react';

interface TelemetryGaugesProps {
  riskLevel: RiskLevel;
  probabilityScore: number;
  areaStatus: AreaStatus;
  currentSpeed: number;
  targetAverageSpeed: number;
  maxSafeSpeed: number;
  speedDelta: number;
  physics: PhysicsTelemetry;
}

export const TelemetryGauges: React.FC<TelemetryGaugesProps> = ({
  riskLevel,
  probabilityScore,
  areaStatus,
  currentSpeed,
  targetAverageSpeed,
  maxSafeSpeed,
  speedDelta,
  physics,
}) => {
  // Color configuration
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-pink-50',
          border: 'border-pink-200',
          text: 'text-rose-700',
          gradient: 'from-rose-500 to-red-600',
          stroke: '#f43f5e',
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          gradient: 'from-orange-500 to-amber-600',
          stroke: '#f97316',
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-50/70',
          border: 'border-amber-200',
          text: 'text-amber-700',
          gradient: 'from-amber-400 to-yellow-500',
          stroke: '#eab308',
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          gradient: 'from-emerald-400 to-teal-500',
          stroke: '#10b981',
        };
    }
  };

  const riskTheme = getRiskColor(riskLevel);

  // SVG Gauge calculations
  const radius = 70;
  const strokeWidth = 14;
  const semiCircumference = Math.PI * radius;
  const strokeDashoffset = semiCircumference - (probabilityScore / 100) * semiCircumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Risk Level & Probability Radial Gauge */}
      <div className="bg-white/90 border border-sky-100 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-[0_8px_30px_rgb(224,242,254,0.3)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-center justify-between border-b border-sky-100 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Risk Probability Score
            </h3>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${riskTheme.bg} ${riskTheme.border} ${riskTheme.text}`}
          >
            {riskLevel} RISK
          </span>
        </div>

        {/* Circular / Semi-circular Gauge */}
        <div className="flex flex-col items-center justify-center my-3 relative">
          <svg className="w-44 h-24 overflow-visible" viewBox="0 0 160 85">
            {/* Background arc */}
            <path
              d="M 10 80 A 70 70 0 0 1 150 80"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <path
              d="M 10 80 A 70 70 0 0 1 150 80"
              fill="none"
              stroke={riskTheme.stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${semiCircumference}`}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>

          <div className="text-center mt-[-10px]">
            <div className="text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
              {probabilityScore}%
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Calculated Accident Probability
            </div>
          </div>
        </div>

        {/* Area Status Pill */}
        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between shadow-2xs ${
            areaStatus === 'IDENTIFIED BLACKSPOT'
              ? 'bg-pink-50 border-pink-200 text-rose-700'
              : areaStatus === 'MODERATE RISK' || (areaStatus as string) === 'MODERATE RISK ZONE'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {areaStatus === 'IDENTIFIED BLACKSPOT' ? (
              <AlertOctagon className="w-4 h-4 text-rose-600 animate-bounce" />
            ) : areaStatus === 'MODERATE RISK' || (areaStatus as string) === 'MODERATE RISK ZONE' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            )}
            <div>
              <span className="text-[10px] text-slate-500 block font-sans uppercase font-medium">Corridor Status</span>
              <span className="text-xs font-bold font-mono">{areaStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Speed Analysis & Safety Thresholds Visualizer */}
      <div className="bg-white/90 border border-sky-100 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-[0_8px_30px_rgb(224,242,254,0.3)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-center justify-between border-b border-sky-100 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Speed Compliance vs Thresholds
            </h3>
          </div>
          {speedDelta > 0 ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-rose-700 border border-pink-200">
              +{speedDelta} km/h DEFICIT
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              COMPLIANT
            </span>
          )}
        </div>

        <div className="space-y-3.5 my-2">
          {/* Target Average Speed */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">Target Average Speed (To Prevent Accident):</span>
              <span className="font-mono font-bold text-emerald-600">{targetAverageSpeed} km/h</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (targetAverageSpeed / 140) * 100)}%` }}
              />
            </div>
          </div>

          {/* Absolute Maximum Safe Speed */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">Absolute Maximum Safe Ceiling:</span>
              <span className="font-mono font-bold text-amber-600">{maxSafeSpeed} km/h</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-amber-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (maxSafeSpeed / 140) * 100)}%` }}
              />
            </div>
          </div>

          {/* Current Operating Speed */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-800 font-bold">Current Operating Speed:</span>
              <span
                className={`font-mono font-extrabold ${speedDelta > 0 ? 'text-rose-600' : 'text-sky-700'}`}
              >
                {currentSpeed} km/h
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  speedDelta > 0 ? 'bg-rose-500' : 'bg-gradient-to-r from-sky-400 to-pink-500'
                }`}
                style={{ width: `${Math.min(100, (currentSpeed / 140) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Speed Warning Callout */}
        <div
          className={`p-2.5 rounded-xl text-[11px] leading-tight border shadow-2xs ${
            speedDelta > 0
              ? 'bg-pink-50 border-pink-200 text-rose-800'
              : 'bg-[#FAF7F2] border-amber-200/60 text-slate-700'
          }`}
        >
          {speedDelta > 0
            ? `Decelerate immediately: Speed exceeds dynamic safe threshold by ${speedDelta} km/h under active surface friction (μ=${physics.frictionCoefficient}).`
            : `Speed is strictly within maximum safe parameters (${maxSafeSpeed} km/h) with safe stopping margin.`}
        </div>
      </div>

      {/* 3. Physics & Braking Distance Breakdown */}
      <div className="bg-white/90 border border-sky-100 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-[0_8px_30px_rgb(224,242,254,0.3)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-center justify-between border-b border-sky-100 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Crosshair className="w-4 h-4 text-pink-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Braking Physics & Sight Envelope
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-bold">
            μ = {physics.frictionCoefficient}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 my-2 text-center">
          <div className="p-2 rounded-xl bg-[#FFFDF9] border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 block">Reaction</span>
            <span className="text-xs font-bold font-mono text-slate-800">
              {physics.reactionDistanceMeters}m
            </span>
            <span className="text-[9px] text-slate-500 block">{physics.reactionTimeSeconds}s rx</span>
          </div>

          <div className="p-2 rounded-xl bg-[#FFFDF9] border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 block">Braking</span>
            <span className="text-xs font-bold font-mono text-amber-700">
              {physics.brakingDistanceMeters}m
            </span>
            <span className="text-[9px] text-slate-500 block">pavement drag</span>
          </div>

          <div
            className={`p-2 rounded-xl border shadow-2xs ${
              physics.isStoppingDistanceSafe
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-pink-50 border-pink-200 text-rose-800'
            }`}
          >
            <span className="text-[10px] block font-semibold">Total Stop</span>
            <span className="text-xs font-extrabold font-mono">
              {physics.totalStoppingDistanceMeters}m
            </span>
            <span className="text-[9px] block font-medium">
              {physics.isStoppingDistanceSafe ? '✓ Safe sight' : '⚠️ Blind deficit'}
            </span>
          </div>
        </div>

        {/* Sight Envelope Comparison Bar */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-600 flex items-center gap-1 font-medium">
              <Eye className="w-3 h-3 text-sky-600" />
              Available Sight Distance:
            </span>
            <span className="font-mono text-sky-700 font-bold">{physics.visibilityDistanceMeters}m</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden relative border border-slate-200">
            {/* Stopping distance marker */}
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                physics.isStoppingDistanceSafe ? 'bg-sky-500' : 'bg-rose-500'
              }`}
              style={{
                width: `${Math.min(100, (physics.totalStoppingDistanceMeters / Math.max(1, physics.visibilityDistanceMeters)) * 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
            <span>0m</span>
            <span>Stop: {physics.totalStoppingDistanceMeters}m</span>
            <span>Sight: {physics.visibilityDistanceMeters}m</span>
          </div>
        </div>

        {/* Lateral Skid Warnings */}
        {physics.isSkidRisk && (
          <div className="mt-1 text-[10px] px-2 py-1 rounded-lg bg-pink-50 border border-pink-200 text-rose-800">
            Lateral force ({physics.lateralGForce}g) exceeds curve adhesion limit!
          </div>
        )}
      </div>
    </div>
  );
};
