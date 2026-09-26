export type VehicleType =
  | '2-Wheeler'
  | 'Car'
  | 'Bus'
  | 'Auto-Rickshaw'
  | 'Heavy Commercial Vehicle'
  | 'Heavy Vehicle'; // alias for backwards compatibility

export type WeatherCondition =
  | 'Clear'
  | 'Heavy Monsoon'
  | 'Rain'
  | 'Heavy Downpour'
  | 'Dense Fog'
  | 'Dust Storm'
  | 'Mist'
  | 'High Winds';

export type SurfaceQuality =
  | 'Dry Asphalt'
  | 'Wet Pavement'
  | 'Standing Water / Aquaplaning'
  | 'Potholed Concrete'
  | 'Gravel / Deteriorated'
  | 'Dusty / Low Adhesion Pavement';

export type TrafficLevel = 'Low' | 'Medium' | 'High' | 'Congested';

export type RoadType = 'Highway' | 'Urban' | 'Rural' | 'Curvature';

export type CurvatureRating = 'Straight' | 'Mild' | 'Sharp Curve' | 'Hairpin / Ghat';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type AreaStatus =
  | 'IDENTIFIED BLACKSPOT'
  | 'MODERATE RISK'
  | 'MODERATE RISK ZONE'
  | 'SAFE CORRIDOR';

export type ISTTimeWindowType =
  | 'Morning Peak (08:00 - 11:00 IST)'
  | 'School / Peak Rush (08:00 - 10:30 & 17:00 - 20:00 IST)'
  | 'Evening Peak (17:00 - 20:00 IST)'
  | 'Night Hazard (22:00 - 05:00 IST)'
  | 'Off-Peak Day Window';

// CSV Dataset Row Schema for Indian Corridors & Blackspots
export interface AccidentDatasetRecord {
  locationId: string;
  locationName: string;
  state: string;
  highwayNumber?: string; // e.g. NH-44, NH-48, Mumbai-Pune Expressway
  hour: number;
  dayOfWeek: string;
  isPeakHour: boolean;
  weather: WeatherCondition;
  visibilityMeters: number;
  surfaceQuality: SurfaceQuality;
  potholeCount: number;
  suddenDiversion: boolean;
  speedBreakerCount: number;
  trafficLevel: TrafficLevel;
  speedLimitKmh: number;
  roadType: RoadType;
  curvature: CurvatureRating;
  historicalAccidentsAnnual: number;
  isBlackspot: boolean;
  historicalFatalities: number;
  coordinates?: { x: number; y: number }; // For canvas mapping
  geoCoords?: { lat: number; lng: number }; // GPS Coordinates
  safeBypassLocationId?: string;
  segmentDescription?: string;
}

// Auto-Fetched Environmental Metrics from IP Geolocation & Live Weather APIs
export interface AutoFetchedEnvironmentalMetrics {
  detectedLocation: string; // e.g. "28.6139° N, 77.2090° E (Delhi NCR / NH-48 Corridor)"
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
  country?: string;
  nearestCorridor?: string;
  currentWeatherConditions: string; // e.g. "Dense Fog, Visibility: 60m"
  weatherStatus: string;
  weatherCondition: WeatherCondition;
  temperatureC: number;
  visibilityMeters: number;
  precipitationMm?: number;
  windSpeedKmh?: number;
  relativeHumidity?: number;
  roadSurfaceImpact: string;
  isLiveApiFeed: boolean;
  timeWindow: string; // e.g. "Night Hazard: 23:30 IST"
  istTimeString: string; // e.g. "23:30 IST"
  fetchedAt: string;
}

// 5 Dynamic User Inputs Required from UI (Origin, Weather & Hazards are Auto-Fetched via APIs)
export interface EngineUserInputs {
  // Required from UI:
  destinationLocation: string; // 1. Destination Location (City, Highway, Urban/Rural Road in India)
  targetSpeed: number; // 2. Target Speed (km/h)
  vehicleType: VehicleType; // 3. Transport Mode (2-Wheeler, Car, Bus, Auto-Rickshaw, Heavy Commercial Vehicle)
  timeOfTravel: string; // 4. Time of Travel / IST Time
  roadType: RoadType; // 5. Road Type (Highway, Urban, Rural)

  // Auto-Fetched & Managed parameters (no manual user prompt needed):
  originLocation: string; // Auto-detected from HTML5 GPS / Reverse Geocoded Coordinates
  weatherCondition: WeatherCondition; // Auto-fetched from Live Weather API
  visibilityMeters: number; // Auto-fetched from Live Weather API
  environmentalMetrics?: AutoFetchedEnvironmentalMetrics; // Live feeds snapshot

  // Time-aware helper fields:
  hour?: number;
  dayOfWeek?: string;
  isPeakHour?: boolean;
  istWindow?: ISTTimeWindowType;
  curvature?: CurvatureRating;
  currentLocation?: string; // alias for backwards-compat
  destination?: string; // alias for backwards-compat
  speed?: number; // alias for backwards-compat
}

// Automated Backend Hazard Inference (Deducted from Dataset without user input)
export interface AutomatedHazardInference {
  potholesCount: number;
  speedBreakersCount: number;
  suddenDiversionDetected: boolean;
  surfaceQuality: SurfaceQuality;
  trafficLevel: TrafficLevel;
  blackspotDetected: boolean;
  historicalAccidentsAnnual: number;
  historicalFatalities: number;
  speedLimitKmh: number;
  curvature: CurvatureRating;
  deducedFromCorridor: string;
  highwayNumber?: string;
  state?: string;
}

// Mathematical Physics Telemetry
export interface PhysicsTelemetry {
  speedKmh: number;
  speedMs: number;
  frictionCoefficient: number;
  reactionTimeSeconds: number;
  reactionDistanceMeters: number;
  brakingDistanceMeters: number;
  totalStoppingDistanceMeters: number;
  visibilityDistanceMeters: number;
  isStoppingDistanceSafe: boolean;
  stoppingSafetyMarginMeters: number;
  lateralGForce: number;
  isSkidRisk: boolean;
  aquaplaningSpeedThresholdKmh: number;
  nightReductionFactor?: number; // 20% - 35% speed reduction
  peakRushAdjustmentKmh?: number;
}

// Alternate Green Route Details
export interface AlternateRouteDetails {
  corridorName: string;
  viaWaypoints: string;
  distanceKm: number;
  estimatedTimeDifferenceMinutes: number;
  estimatedTimeSavingMinutes?: number;
  riskReductionPercentage: number;
  projectedRiskLevel: RiskLevel;
  roadConditionAdvantage: string;
}

// Frontend Canvas Overlay Spec
export interface VisualMapOverlay {
  redHighlightPath: string; // Coordinates and segments for high-risk corridors, congested segments, and accident blackspots
  greenHighlightPath: string; // Best recommended safe route path
  redCoordinates?: { x: number; y: number; lat?: number; lng?: number; name?: string }[];
  greenCoordinates?: { x: number; y: number; lat?: number; lng?: number; name?: string }[];
  redHighlightZones?: string[]; // Backwards-compatible alias
  greenSuggestedPath?: string; // Backwards-compatible alias
}

// Complete Analysis Result
export interface EngineAnalysisResult {
  visualMapOverlay: VisualMapOverlay;
  autoFetchedEnvironmentalMetrics: AutoFetchedEnvironmentalMetrics;
  calculatedRiskLevel: RiskLevel;
  accidentProbabilityScore: number;
  accidentProneZone: AreaStatus; // 'IDENTIFIED BLACKSPOT' | 'MODERATE RISK' | 'SAFE CORRIDOR'
  accidentProneAreaStatus?: AreaStatus; // Backwards-compatible alias
  causativeRiskFactors: string[];
  targetAverageSpeedKmh: number;
  maxSafeSpeedKmh: number;
  speedComplianceWarning: string;
  speedDeltaKmh: number;
  autoDetectedHazards: string; // [Potentially hazardous potholes, un-marked speed breakers, or sudden diversions along the path]
  automatedHazardAlerts?: string; // Backwards-compatible alias
  surfaceHazardAlerts?: string; // Backwards-compatible alias
  automatedInference: AutomatedHazardInference;
  actionableDriverAdvice: string[];
  recommendedActions?: string[]; // Backwards-compatible alias
  alternateRouteSuggestion: AlternateRouteDetails;
  physics: PhysicsTelemetry;
  matchedRecord: AccidentDatasetRecord;
  datasetMatchConfidence: number;
  markdownOutput: string;
  jsonOutput: string;
  generatedByAi?: boolean;
}
