import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  AccidentDatasetRecord,
  AutoFetchedEnvironmentalMetrics,
  EngineAnalysisResult,
  EngineUserInputs,
} from './types/engine';
import { UserProfile, DbStatusResponse, UserLocationRecord } from './types/auth';
import { SMART_CITY_DATASET } from './data/smartCityDataset';
import { analyzeSmartCityRisk } from './engine/riskCalculator';
import { authService } from './services/authService';
import { liveFeedService } from './services/liveFeedService';
import { Header } from './components/Header';
import { PresetScenarios } from './components/PresetScenarios';
import { InputPanel } from './components/InputPanel';
import { TelemetryGauges } from './components/TelemetryGauges';
import { CityMapVisualizer } from './components/CityMapVisualizer';
import { StructuredOutputReport } from './components/StructuredOutputReport';
import { DatasetModal } from './components/DatasetModal';
import { LoginModal } from './components/LoginModal';
import { UserLocationHistoryDrawer } from './components/UserLocationHistoryDrawer';
import { Database, BookmarkCheck, Check } from 'lucide-react';

export default function App() {
  // Dataset state (preloaded with authentic Indian corridors, highways & blackspots)
  const [dataset, setDataset] = useState<AccidentDatasetRecord[]>(SMART_CITY_DATASET);

  // Authentication & session state
  const [user, setUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);

  // Auto-Fetched Environmental Metrics state (from IP Geolocation & Live Weather APIs)
  const [environmentalMetrics, setEnvironmentalMetrics] = useState<
    AutoFetchedEnvironmentalMetrics | undefined
  >(undefined);
  const [isSyncingFeeds, setIsSyncingFeeds] = useState(false);

  // 5 Dynamic User Inputs + Auto-Fetched parameters (Defaults: Vadlamudi, Guntur District, AP)
  const [inputs, setInputs] = useState<EngineUserInputs>({
    originLocation: '16.2359° N, 80.5516° E (Vadlamudi, Guntur District, Andhra Pradesh)',
    currentLocation: '16.2359° N, 80.5516° E (Vadlamudi, Guntur District, Andhra Pradesh)',
    destinationLocation: 'Vadlamudi - Chebrolu - Guntur Arterial Safe Corridor',
    destination: 'Vadlamudi - Chebrolu - Guntur Arterial Safe Corridor',
    targetSpeed: 65,
    speed: 65,
    vehicleType: 'Car',
    timeOfTravel: '20:00 hrs IST (Evening Peak: 17:00 - 20:00 IST)',
    hour: 20,
    dayOfWeek: 'Friday',
    isPeakHour: true,
    weatherCondition: 'Clear',
    visibilityMeters: 1800,
    roadType: 'Rural',
    curvature: 'Mild',
  });

  // UI state
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiReportMarkdown, setAiReportMarkdown] = useState<string | null>(null);

  // Check database status on mount
  useEffect(() => {
    authService.getDatabaseStatus().then(setDbStatus).catch(() => {});
  }, []);

  // Auto-detect Location & Live Weather on initial load
  const syncLiveEnvironmentalFeeds = useCallback(async () => {
    setIsSyncingFeeds(true);
    try {
      const { location, weather, metrics } = await liveFeedService.syncEnvironmentalFeeds();
      setEnvironmentalMetrics(metrics);
      setInputs((prev) => ({
        ...prev,
        originLocation: location.nearestCorridor || prev.originLocation,
        currentLocation: location.nearestCorridor || prev.currentLocation,
        weatherCondition: weather.weatherCondition,
        visibilityMeters: weather.visibilityMeters,
        environmentalMetrics: metrics,
      }));
    } catch (err) {
      console.warn('Live environmental feeds sync notice:', err);
    } finally {
      setIsSyncingFeeds(false);
    }
  }, []);

  useEffect(() => {
    syncLiveEnvironmentalFeeds();
  }, [syncLiveEnvironmentalFeeds]);

  // Extract corridor names for dropdowns
  const locationOptions = useMemo(() => {
    return dataset.map((d) => d.locationName);
  }, [dataset]);

  // Compute live deterministic spatial-temporal risk analysis
  const computedAnalysis = useMemo(() => {
    const res = analyzeSmartCityRisk(inputs, dataset);
    if (aiReportMarkdown) {
      return {
        ...res,
        markdownOutput: aiReportMarkdown,
        generatedByAi: true,
      };
    }
    return res;
  }, [inputs, dataset, aiReportMarkdown]);

  // Save current location choice and pace to MongoDB
  const saveLocationToBackend = useCallback(
    async (overrideInputs?: EngineUserInputs) => {
      const activeInputs = overrideInputs || inputs;
      if (!user) return;

      const origin = activeInputs.originLocation || activeInputs.currentLocation || '';
      const dest = activeInputs.destinationLocation || activeInputs.destination || '';
      const speed = activeInputs.targetSpeed ?? activeInputs.speed ?? 80;

      try {
        await authService.saveLocationChoice({
          userId: user.userId,
          mobileNumber: user.mobileNumber,
          email: user.email,
          currentLocation: origin,
          destination: dest,
          speed: speed,
          vehicleType: activeInputs.vehicleType,
          weatherCondition: activeInputs.weatherCondition,
          surfaceQuality: computedAnalysis.automatedInference.surfaceQuality,
          riskLevel: computedAnalysis.calculatedRiskLevel,
          accidentProbabilityScore: computedAnalysis.accidentProbabilityScore,
          alternateRouteCorridor: computedAnalysis.alternateRouteSuggestion.corridorName,
        });

        setLastSavedMessage(`Saved: ${origin} @ ${speed} km/h`);
        setTimeout(() => setLastSavedMessage(null), 3500);
      } catch (err: any) {
        console.warn('Backend save notice:', err.message);
      }
    },
    [user, inputs, computedAnalysis],
  );

  // Handle dynamic input changes
  const handleInputChange = useCallback(
    <K extends keyof EngineUserInputs>(key: K, value: EngineUserInputs[K]) => {
      setInputs((prev) => {
        const next = { ...prev, [key]: value };

        if (key === 'originLocation' || key === 'currentLocation') {
          const val = value as string;
          next.originLocation = val;
          next.currentLocation = val;
          // Auto-sync default corridor attributes if matched
          const match = dataset.find(
            (d) => d.locationName.toLowerCase() === val.toLowerCase(),
          );
          if (match) {
            next.roadType = match.roadType;
            next.curvature = match.curvature;
            next.weatherCondition = match.weather;
            next.visibilityMeters = match.visibilityMeters;
            next.hour = match.hour;
            next.dayOfWeek = match.dayOfWeek;
            next.isPeakHour = match.isPeakHour;
            next.timeOfTravel = `${match.hour.toString().padStart(2, '0')}:00 hrs (${match.dayOfWeek})`;
          }
        } else if (key === 'destinationLocation' || key === 'destination') {
          const val = value as string;
          next.destinationLocation = val;
          next.destination = val;
        } else if (key === 'targetSpeed' || key === 'speed') {
          const val = value as number;
          next.targetSpeed = val;
          next.speed = val;
        }

        return next;
      });
      // Invalidate AI cache on input change
      setAiReportMarkdown(null);
    },
    [dataset],
  );

  // Apply scenario preset
  const handleSelectPreset = (preset: Partial<EngineUserInputs>) => {
    setInputs((prev) => {
      const next = { ...prev, ...preset };
      if (preset.originLocation) {
        next.currentLocation = preset.originLocation;
      }
      if (preset.destinationLocation) {
        next.destination = preset.destinationLocation;
      }
      if (preset.targetSpeed !== undefined) {
        next.speed = preset.targetSpeed;
      }
      if (user) {
        saveLocationToBackend(next);
      }
      return next;
    });
    setAiReportMarkdown(null);
  };

  // Reset to default scenario (Vadlamudi, Guntur District)
  const handleResetDefaults = () => {
    setInputs({
      originLocation: '16.2359° N, 80.5516° E (Vadlamudi, Guntur District, Andhra Pradesh)',
      currentLocation: '16.2359° N, 80.5516° E (Vadlamudi, Guntur District, Andhra Pradesh)',
      destinationLocation: 'Vadlamudi - Chebrolu - Guntur Arterial Safe Corridor',
      destination: 'Vadlamudi - Chebrolu - Guntur Arterial Safe Corridor',
      targetSpeed: 65,
      speed: 65,
      vehicleType: 'Car',
      timeOfTravel: '20:00 hrs IST (Evening Peak: 17:00 - 20:00 IST)',
      hour: 20,
      dayOfWeek: 'Friday',
      isPeakHour: true,
      weatherCondition: 'Clear',
      visibilityMeters: 1800,
      roadType: 'Rural',
      curvature: 'Mild',
    });
    setAiReportMarkdown(null);
  };

  // Switch to Alternate Green Route
  const handleApplyAlternateRoute = () => {
    const altName = computedAnalysis.alternateRouteSuggestion.corridorName;
    const matched = dataset.find((d) => d.locationName === altName);
    if (matched) {
      setInputs((prev) => {
        const next = {
          ...prev,
          originLocation: matched.locationName,
          currentLocation: matched.locationName,
          roadType: matched.roadType,
          curvature: matched.curvature,
          targetSpeed: Math.min(prev.targetSpeed, matched.speedLimitKmh),
          speed: Math.min(prev.targetSpeed, matched.speedLimitKmh),
        };
        if (user) {
          saveLocationToBackend(next);
        }
        return next;
      });
      setAiReportMarkdown(null);
    }
  };

  // Load a saved route from the User History Drawer
  const handleSelectSavedRoute = (record: UserLocationRecord) => {
    setInputs((prev) => ({
      ...prev,
      originLocation: record.currentLocation,
      currentLocation: record.currentLocation,
      destinationLocation: record.destination,
      destination: record.destination,
      targetSpeed: record.speed,
      speed: record.speed,
      vehicleType: record.vehicleType as import('./types/engine').VehicleType,
      weatherCondition: record.weatherCondition as import('./types/engine').WeatherCondition,
    }));
    setIsHistoryDrawerOpen(false);
    setAiReportMarkdown(null);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  // Request backend route risk analysis
  const handleRunAiAnalysis = async () => {
    setIsAiProcessing(true);
    try {
      const response = await fetch('/api/analyze-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInputs: inputs,
          automatedInference: computedAnalysis.automatedInference,
          matchedRecords: [computedAnalysis.matchedRecord],
          datasetSummary: `Attached Indian Accident Dataset: 23 corridors across all Indian states with MoRTH Blackspots, night freight hazard ratings, and safe bypass alternatives.`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (data.reportMarkdown) {
        setAiReportMarkdown(data.reportMarkdown);
      }

      if (user) {
        saveLocationToBackend();
      }
    } catch (err: any) {
      console.warn('AI analysis fallback to deterministic engine:', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const blackspotsCount = dataset.filter((d) => d.isBlackspot).length;

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-slate-800 flex flex-col font-sans selection:bg-pink-200 selection:text-pink-900 relative overflow-x-hidden">
      {/* Ambient Animated Floating Pastel Orbs in Sky Blue, Baby Pink & Cream */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-[34rem] h-[34rem] rounded-full bg-gradient-to-br from-sky-200/50 via-sky-100/35 to-transparent blur-3xl animate-float-slow" />
        <div className="absolute top-8 -right-24 w-[36rem] h-[36rem] rounded-full bg-gradient-to-bl from-pink-200/45 via-rose-100/30 to-transparent blur-3xl animate-float-reverse" />
        <div className="absolute top-[40%] left-[15%] w-[40rem] h-[40rem] rounded-full bg-gradient-to-tr from-amber-100/45 via-pink-100/25 to-sky-100/20 blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-24 right-[5%] w-[32rem] h-[32rem] rounded-full bg-gradient-to-tl from-sky-200/45 via-pink-200/30 to-transparent blur-3xl animate-float-slow" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Header with Live IST Clock */}
        <Header
          recordsCount={dataset.length}
          blackspotsCount={blackspotsCount}
          isAiProcessing={isAiProcessing}
          user={user}
          dbStatus={dbStatus}
          currentHour={inputs.hour ?? 19}
          onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
          onResetDefaults={handleResetDefaults}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onOpenHistoryDrawer={() => setIsHistoryDrawerOpen(true)}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 sm:px-6 flex flex-col gap-5">
          {/* Backend MongoDB & User Persistence Toast Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-white/80 border border-sky-100/90 text-xs shadow-xs backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-600" />
              <span className="text-slate-600 font-medium">
                Backend Database Target:{' '}
                <code className="text-sky-800 font-mono text-[11px] bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-semibold">
                  mongodb://localhost:27017/smart_city_safety
                </code>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {lastSavedMessage && (
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold animate-pulse">
                  <Check className="w-3 h-3 text-emerald-600" />
                  {lastSavedMessage}
                </span>
              )}

              {user ? (
                <button
                  type="button"
                  onClick={() => saveLocationToBackend()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-bold transition cursor-pointer shadow-2xs hover:-translate-y-0.5"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Save Current Location & Pace</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-semibold transition cursor-pointer shadow-2xs hover:-translate-y-0.5"
                >
                  <span>Login to auto-save location history</span>
                </button>
              )}
            </div>
          </div>

          {/* Emergency & High-Risk Spatial-Temporal Presets */}
          <PresetScenarios onSelectPreset={handleSelectPreset} />

          {/* Dual-Panel UI: Clear Visual Map (Left) and Side-by-Side Analytics Cards (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Panel 1 (Left Column): Dynamic Controls & Visual Map Overlay Canvas (6 cols on lg) */}
            <div className="lg:col-span-6 flex flex-col gap-5">
              <InputPanel
                inputs={inputs}
                locationOptions={locationOptions}
                maxSafeSpeed={computedAnalysis.maxSafeSpeedKmh}
                isAiProcessing={isAiProcessing}
                automatedInference={computedAnalysis.automatedInference}
                environmentalMetrics={environmentalMetrics}
                isSyncingFeeds={isSyncingFeeds}
                onSyncFeeds={syncLiveEnvironmentalFeeds}
                onInputChange={handleInputChange}
                onRunAiAnalysis={handleRunAiAnalysis}
              />

              <CityMapVisualizer
                dataset={dataset}
                currentLocationName={inputs.originLocation || inputs.currentLocation || locationOptions[0]}
                destinationName={inputs.destinationLocation || inputs.destination || locationOptions[1]}
                alternateRouteCorridor={computedAnalysis.alternateRouteSuggestion.corridorName}
                riskLevel={computedAnalysis.calculatedRiskLevel}
                currentSpeed={inputs.targetSpeed ?? inputs.speed ?? 80}
                visualMapOverlay={computedAnalysis.visualMapOverlay}
                onSelectLocation={(loc) => handleInputChange('originLocation', loc)}
              />
            </div>

            {/* Panel 2 (Right Column): Real-Time Telemetry & Side-by-Side Analytics Cards (6 cols on lg) */}
            <div className="lg:col-span-6 flex flex-col gap-5">
              {/* Real-time Telemetry & Physics Status Gauges */}
              <TelemetryGauges
                riskLevel={computedAnalysis.calculatedRiskLevel}
                probabilityScore={computedAnalysis.accidentProbabilityScore}
                areaStatus={computedAnalysis.accidentProneZone}
                currentSpeed={inputs.targetSpeed ?? inputs.speed ?? 80}
                targetAverageSpeed={computedAnalysis.targetAverageSpeedKmh}
                maxSafeSpeed={computedAnalysis.maxSafeSpeedKmh}
                speedDelta={computedAnalysis.speedDeltaKmh}
                physics={computedAnalysis.physics}
              />

              {/* Mandatory Output Format Section (Side-by-side Analytics Cards, Markdown, JSON) */}
              <StructuredOutputReport
                analysis={computedAnalysis}
                onApplyAlternateRoute={
                  computedAnalysis.calculatedRiskLevel === 'HIGH' ||
                  computedAnalysis.calculatedRiskLevel === 'CRITICAL'
                    ? handleApplyAlternateRoute
                    : undefined
                }
              />
            </div>
          </div>
        </main>

        {/* Dataset Context Explorer Modal */}
        <DatasetModal
          isOpen={isDatasetModalOpen}
          onClose={() => setIsDatasetModalOpen(false)}
          dataset={dataset}
          onUpdateDataset={(newDataset) => {
            setDataset(newDataset);
          }}
        />

        {/* User Login Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            saveLocationToBackend();
          }}
        />

        {/* User Location History Drawer (MongoDB stored pace & locations) */}
        <UserLocationHistoryDrawer
          isOpen={isHistoryDrawerOpen}
          onClose={() => setIsHistoryDrawerOpen(false)}
          user={user}
          onSelectSavedRoute={handleSelectSavedRoute}
        />
      </div>
    </div>
  );
}
