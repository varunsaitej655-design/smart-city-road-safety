import React, { useState } from 'react';
import { EngineAnalysisResult } from '../types/engine';
import {
  FileText,
  Code,
  Copy,
  Check,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Navigation,
  Compass,
  ArrowRight,
  Sparkles,
  Layers,
  CloudRain,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface StructuredOutputReportProps {
  analysis: EngineAnalysisResult;
  onApplyAlternateRoute?: () => void;
}

export const StructuredOutputReport: React.FC<StructuredOutputReportProps> = ({
  analysis,
  onApplyAlternateRoute,
}) => {
  const [activeTab, setActiveTab] = useState<'advisory' | 'markdown' | 'json'>('advisory');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-pink-50 text-rose-700 border-pink-300';
      case 'HIGH':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'MODERATE':
        return 'bg-amber-50/70 text-amber-700 border-amber-200';
      case 'LOW':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    }
  };

  const envMetrics = analysis.autoFetchedEnvironmentalMetrics;
  const overlay = analysis.visualMapOverlay;
  const hazardAlertsText =
    analysis.autoDetectedHazards || analysis.automatedHazardAlerts || 'Road hazards nominal';
  const driverAdvice = analysis.actionableDriverAdvice || analysis.recommendedActions || [];

  return (
    <div className="bg-white/92 border border-sky-100 rounded-2xl overflow-hidden backdrop-blur-md shadow-xs flex flex-col transition-all">
      {/* Header with Navigation Tabs and Copy Actions */}
      <div className="bg-[#FFFDF9] border-b border-sky-100/90 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              Accident Risk Analytics & Dynamic Route Advisory Output
              {analysis.generatedByAi && (
                <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-pink-500" /> AI Synthesized
                </span>
              )}
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">
              Wide Line-Spacing • Clear Card Separation • Side-by-Side Dashboard Layout • 7 Mandatory Sections
            </span>
          </div>
        </div>

        {/* Tab Controls & Copy Buttons */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('advisory')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeTab === 'advisory'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Side-by-Side Cards
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeTab === 'markdown'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mandatory Markdown
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Structured JSON
            </button>
          </div>

          {/* Quick Copy Buttons */}
          <button
            onClick={() => copyToClipboard(analysis.markdownOutput, 'markdown')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer shadow-2xs hover:-translate-y-0.5"
            title="Copy exact Markdown format"
          >
            {copiedType === 'markdown' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-mono">Copied MD</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>

          <button
            onClick={() => copyToClipboard(analysis.jsonOutput, 'json')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer shadow-2xs hover:-translate-y-0.5"
            title="Copy structured JSON payload"
          >
            {copiedType === 'json' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-mono">Copied JSON</span>
              </>
            ) : (
              <>
                <Code className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Side-by-Side Analytics Cards View (7 Mandatory Sections) */}
      {activeTab === 'advisory' && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* SECTION 1: VISUAL MAP OVERLAY COORDINATES (FOR FRONTEND CANVAS) */}
          <div className="bg-[#FAF7F2] border border-amber-200/50 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-amber-200/60 pb-3 mb-4">
              <Layers className="w-4 h-4 text-sky-600" />
              1. VISUAL MAP OVERLAY COORDINATES (FOR FRONTEND CANVAS)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* RED HIGHLIGHT PATH */}
              <div className="p-4 rounded-xl bg-pink-50/80 border border-pink-200 flex flex-col gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                  <span className="text-xs font-extrabold text-rose-800 uppercase tracking-wide">
                    RED HIGHLIGHT PATH:
                  </span>
                </div>
                <div className="text-xs text-rose-950 leading-relaxed font-mono bg-white/90 p-3 rounded-lg border border-pink-200 break-words">
                  {overlay.redHighlightPath}
                </div>
                <span className="text-[11px] text-rose-700 font-medium pl-1">
                  High-risk corridor, congested segments, and localized MoRTH blackspot nodes marked in RED.
                </span>
              </div>

              {/* GREEN HIGHLIGHT PATH */}
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide">
                    GREEN HIGHLIGHT PATH:
                  </span>
                </div>
                <div className="text-xs text-emerald-950 leading-relaxed font-mono bg-white/90 p-3 rounded-lg border border-emerald-200 break-words">
                  {overlay.greenHighlightPath}
                </div>
                <span className="text-[11px] text-emerald-700 font-medium pl-1">
                  Best recommended safe route rendered in BRIGHT GREEN with optimal grade-separation.
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: DYNAMIC LOCATION & ENVIRO-TIME METRICS */}
          <div className="bg-[#FAF7F2] border border-amber-200/50 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center justify-between border-b border-amber-200/60 pb-3 mb-4">
              <span className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-sky-600" />
                2. DYNAMIC LOCATION & ENVIRO-TIME METRICS
              </span>
              <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                Auto-Fetched
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Origin Location */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex flex-col justify-between shadow-2xs">
                <span className="text-[10px] uppercase text-slate-500 block font-bold tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  Origin Location:
                </span>
                <div className="text-xs sm:text-sm font-bold font-mono text-slate-900 bg-[#FFFDF9] p-3 rounded-xl border border-sky-100">
                  [{envMetrics?.detectedLocation || '28.6139° N, 77.2090° E (Delhi NCR)'}]
                </div>
                <span className="text-[10px] text-slate-500 mt-2 block font-sans">
                  Auto-detected via HTML5 Browser GPS / Reverse Geocoded Coordinates.
                </span>
              </div>

              {/* Time Window */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex flex-col justify-between shadow-2xs">
                <span className="text-[10px] uppercase text-slate-500 block font-bold tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  Time Window:
                </span>
                <div className="text-xs sm:text-sm font-bold font-mono text-sky-900 bg-[#FFFDF9] p-3 rounded-xl border border-sky-100">
                  [{envMetrics?.timeWindow || 'Off-Peak Day Window'}]
                </div>
                <span className="text-[10px] text-slate-500 mt-2 block font-sans">
                  Indian Standard Time (IST) & Peak / Night Hazard classification.
                </span>
              </div>

              {/* Weather Status */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex flex-col justify-between shadow-2xs">
                <span className="text-[10px] uppercase text-slate-500 block font-bold tracking-wider mb-2 flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                  Weather Status:
                </span>
                <div className="text-xs sm:text-sm font-bold font-mono text-sky-900 bg-[#FFFDF9] p-3 rounded-xl border border-sky-100">
                  [{envMetrics?.currentWeatherConditions || 'Clear Skies / High Traction'}]
                </div>
                <span className="text-[10px] text-slate-500 mt-2 block font-sans">
                  Auto-fetched condition: {envMetrics?.weatherCondition || 'Clear'} ({envMetrics?.temperatureC ?? 26.5}°C, {envMetrics?.visibilityMeters ?? 2200}m visibility).
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: ACCIDENT RISK ANALYTICS */}
          <div className="bg-[#FAF7F2] border border-amber-200/50 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center justify-between border-b border-amber-200/60 pb-3 mb-4">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-sky-600" />
                3. ACCIDENT RISK ANALYTICS
              </span>
              <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                Spatial-Temporal Risk Matrix
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Calculated Risk Level */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex flex-col justify-between shadow-2xs">
                <span className="text-[10px] uppercase text-slate-500 block font-bold tracking-wider mb-2">
                  Calculated Risk Level:
                </span>
                <div>
                  <span
                    className={`inline-block text-base font-extrabold px-3.5 py-1 rounded-full border ${getRiskBadgeColor(
                      analysis.calculatedRiskLevel,
                    )}`}
                  >
                    [{analysis.calculatedRiskLevel}]
                  </span>
                </div>
              </div>

              {/* Accident Probability Score */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex flex-col justify-between shadow-2xs">
                <span className="text-[10px] uppercase text-slate-500 block font-bold tracking-wider mb-2">
                  Accident Probability Score:
                </span>
                <span className="text-2xl font-mono font-extrabold text-slate-900">
                  [{analysis.accidentProbabilityScore}%]
                </span>
              </div>

              {/* Accident Prone Zone */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex flex-col justify-between shadow-2xs">
                <span className="text-[10px] uppercase text-slate-500 block font-bold tracking-wider mb-2">
                  Accident Prone Zone:
                </span>
                <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                  [{analysis.accidentProneZone}]
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4: MAIN CAUSATIVE RISK FACTORS */}
          <div className="bg-[#FAF7F2] border border-amber-200/50 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-amber-200/60 pb-3 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              4. MAIN CAUSATIVE RISK FACTORS
            </h3>

            <ul className="space-y-3">
              {analysis.causativeRiskFactors.map((factor, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200/80 leading-relaxed font-sans shadow-2xs"
                >
                  <span className="w-2 h-2 rounded-full bg-pink-500 mt-2 shrink-0 animate-pulse" />
                  <span className="leading-relaxed">{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* SECTION 5: TIME-AWARE SPEED ANALYSIS */}
          <div className="bg-[#FAF7F2] border border-amber-200/50 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-amber-200/60 pb-3 mb-4">
              <Zap className="w-4 h-4 text-emerald-600" />
              5. TIME-AWARE SPEED ANALYSIS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Target Average Speed */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] uppercase text-slate-500 block font-bold tracking-wider mb-1.5">
                  Target Average Speed (To Prevent Accidents):
                </span>
                <span className="text-2xl font-mono font-extrabold text-emerald-700">
                  [{analysis.targetAverageSpeedKmh} km/h]
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Adjusted for traffic shockwave prevention and pedestrian protection.
                </span>
              </div>

              {/* Absolute Maximum Safe Speed */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] uppercase text-slate-500 block font-bold tracking-wider mb-1.5">
                  Absolute Maximum Safe Speed:
                </span>
                <span className="text-2xl font-mono font-extrabold text-amber-700">
                  [{analysis.maxSafeSpeedKmh} km/h]
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Condition-based physical braking ceiling (friction & sight envelope).
                </span>
              </div>
            </div>

            {/* Speed Compliance Warning */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] uppercase text-slate-500 block font-bold tracking-wider mb-1.5">
                Speed Compliance Warning:
              </span>
              <p className="text-xs sm:text-sm font-mono text-rose-800 bg-pink-50 p-3 rounded-xl border border-pink-200 leading-relaxed font-semibold">
                [{analysis.speedComplianceWarning}]
              </p>
            </div>
          </div>

          {/* SECTION 6: AUTOMATED HAZARD BRIEFING */}
          <div className="bg-[#FAF7F2] border border-amber-200/50 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-amber-200/60 pb-3 mb-4">
              <Compass className="w-4 h-4 text-sky-600" />
              6. AUTOMATED HAZARD BRIEFING
            </h3>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] uppercase text-slate-500 block font-bold tracking-wider mb-2">
                Auto-Detected Hazards:
              </span>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans bg-[#FFFDF9] p-3.5 rounded-xl border border-sky-100">
                [{hazardAlertsText}]
              </p>
            </div>
          </div>

          {/* SECTION 7: RECOMMENDED ACTIONS & ROUTE ADVISORY */}
          <div className="bg-[#FAF7F2] border border-amber-200/50 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-amber-200/60 pb-3 mb-4">
              <Navigation className="w-4 h-4 text-pink-600" />
              7. RECOMMENDED ACTIONS & ROUTE ADVISORY
            </h3>

            {/* Actionable Driver Advice */}
            <div className="mb-4">
              <span className="text-[10px] uppercase text-slate-500 block font-bold tracking-wider mb-2">
                Actionable Driver Advice:
              </span>
              <div className="space-y-2">
                {driverAdvice.map((action, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-white border border-slate-200/80 text-xs sm:text-sm text-slate-700 flex items-center gap-3 leading-relaxed shadow-2xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alternate Route (Green Path) */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-50 via-[#FFFDF9] to-sky-50 border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-2">
                <span className="text-[10px] uppercase text-slate-500 block font-bold tracking-wider">
                  Alternate Route (Green Path):
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Optimal Safe Corridor
                  </span>
                  <span className="text-xs font-mono text-emerald-700 font-bold">
                    -{analysis.alternateRouteSuggestion.riskReductionPercentage}% Risk Reduction
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {analysis.alternateRouteSuggestion.corridorName}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {analysis.alternateRouteSuggestion.roadConditionAdvantage}
                </p>
                <div className="text-[11px] text-slate-500 font-mono">
                  Distance: {analysis.alternateRouteSuggestion.distanceKm} km | Time diff: +{analysis.alternateRouteSuggestion.estimatedTimeDifferenceMinutes} mins buffer | Risk reduction: -{analysis.alternateRouteSuggestion.riskReductionPercentage}%
                </div>
              </div>

              {onApplyAlternateRoute && (
                <button
                  type="button"
                  onClick={onApplyAlternateRoute}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-2 shrink-0 self-start md:self-center shadow-md shadow-emerald-200/60 hover:shadow-lg cursor-pointer hover:-translate-y-0.5"
                >
                  <span>Switch To Green Route</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Mandatory Markdown View */}
      {activeTab === 'markdown' && (
        <div className="p-5 bg-[#FAF7F2] font-mono text-xs text-slate-800 leading-relaxed overflow-x-auto border-t border-amber-200/50">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-200/60 text-[11px] text-slate-500">
            <span>Enforced Markdown Format • 7 Mandatory Sections (India Region)</span>
            <button
              onClick={() => copyToClipboard(analysis.markdownOutput, 'markdown')}
              className="text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer font-bold"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy to clipboard</span>
            </button>
          </div>
          <pre className="whitespace-pre-wrap selection:bg-pink-200 selection:text-pink-900 leading-loose bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            {analysis.markdownOutput}
          </pre>
        </div>
      )}

      {/* Tab 3: Structured JSON View */}
      {activeTab === 'json' && (
        <div className="p-5 bg-[#FAF7F2] font-mono text-xs text-slate-800 leading-relaxed overflow-x-auto border-t border-amber-200/50">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-200/60 text-[11px] text-slate-500">
            <span>Structured JSON Payload (7-Section Schema)</span>
            <button
              onClick={() => copyToClipboard(analysis.jsonOutput, 'json')}
              className="text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer font-bold"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy JSON</span>
            </button>
          </div>
          <pre className="whitespace-pre selection:bg-sky-200 selection:text-sky-900 leading-normal bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-sky-900">
            {analysis.jsonOutput}
          </pre>
        </div>
      )}
    </div>
  );
};
