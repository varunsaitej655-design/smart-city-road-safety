import {
  AutomatedHazardInference,
  CurvatureRating,
  EngineUserInputs,
  PhysicsTelemetry,
  SurfaceQuality,
  VehicleType,
} from '../types/engine';

// Friction coefficients by road surface
export const FRICTION_COEFFICIENTS: Record<SurfaceQuality, number> = {
  'Dry Asphalt': 0.82,
  'Wet Pavement': 0.45,
  'Standing Water / Aquaplaning': 0.22,
  'Potholed Concrete': 0.48,
  'Gravel / Deteriorated': 0.35,
  'Dusty / Low Adhesion Pavement': 0.38,
};

// Vehicle inertia and braking multiplier tailored to Indian traffic modes
export const VEHICLE_BRAKING_FACTORS: Record<
  VehicleType,
  { distanceMultiplier: number; reactionSeconds: number; skidSens: number; maxSpeedCap: number; name: string }
> = {
  'Car': { distanceMultiplier: 1.0, reactionSeconds: 1.2, skidSens: 1.0, maxSpeedCap: 120, name: 'Passenger Car' },
  '2-Wheeler': { distanceMultiplier: 1.45, reactionSeconds: 1.1, skidSens: 2.1, maxSpeedCap: 70, name: '2-Wheeler (Motorcycle/Scooter)' },
  'Auto-Rickshaw': { distanceMultiplier: 1.35, reactionSeconds: 1.25, skidSens: 1.9, maxSpeedCap: 50, name: 'Auto-Rickshaw (3-Wheeler)' },
  'Bus': { distanceMultiplier: 1.50, reactionSeconds: 1.4, skidSens: 1.3, maxSpeedCap: 80, name: 'State/City Bus' },
  'Heavy Commercial Vehicle': { distanceMultiplier: 1.85, reactionSeconds: 1.7, skidSens: 1.5, maxSpeedCap: 75, name: 'Heavy Commercial Vehicle (Freight Truck)' },
  'Heavy Vehicle': { distanceMultiplier: 1.85, reactionSeconds: 1.7, skidSens: 1.5, maxSpeedCap: 75, name: 'Heavy Commercial Vehicle' },
};

// Curve effective radius in meters across Indian Highways & Ghats
export const CURVE_RADII: Record<CurvatureRating, number> = {
  'Straight': 2500,
  'Mild': 450,
  'Sharp Curve': 110,
  'Hairpin / Ghat': 35,
};

export function computePhysicsTelemetry(
  inputs: EngineUserInputs,
  inference: AutomatedHazardInference,
): PhysicsTelemetry {
  const g = 9.81; // m/s^2
  const speedKmh = Math.max(1, inputs.targetSpeed ?? inputs.speed ?? 80);
  const speedMs = speedKmh / 3.6;

  // 1. Friction coefficient based on auto-deduced road surface quality & weather
  let mu = FRICTION_COEFFICIENTS[inference.surfaceQuality] || 0.7;
  if (inputs.weatherCondition === 'Dust Storm') {
    mu = Math.min(mu, 0.38);
  } else if (inputs.weatherCondition === 'Heavy Monsoon' || inputs.weatherCondition === 'Heavy Downpour') {
    mu = Math.min(mu, 0.25);
  }
  if (inference.potholesCount > 5) mu = Math.max(0.22, mu - 0.08);

  const vehicleProfile =
    VEHICLE_BRAKING_FACTORS[inputs.vehicleType] || VEHICLE_BRAKING_FACTORS['Car'];

  // 2. Reaction time calculation adjusted by weather & visibility
  let reactionTime = vehicleProfile.reactionSeconds;
  if (inputs.weatherCondition === 'Dense Fog' || inputs.visibilityMeters < 100) {
    reactionTime += 0.55;
  } else if (
    inputs.weatherCondition === 'Heavy Monsoon' ||
    inputs.weatherCondition === 'Heavy Downpour' ||
    inputs.weatherCondition === 'Rain'
  ) {
    reactionTime += 0.35;
  } else if (inputs.weatherCondition === 'Dust Storm') {
    reactionTime += 0.45;
  }

  // 3. Indian Standard Time (IST) Night Hazard evaluation (22:00 - 05:00 IST)
  const travelHour = inputs.hour ?? 19;
  const isNightHours = travelHour >= 22 || travelHour <= 5;
  if (isNightHours) {
    // Human circadian delay + high beam glare from oncoming commercial vehicles
    reactionTime += 0.25;
  }

  // 4. Distances
  const reactionDist = speedMs * reactionTime;
  const brakingDist = ((speedMs * speedMs) / (2 * mu * g)) * vehicleProfile.distanceMultiplier;
  const totalStoppingDist = reactionDist + brakingDist;

  // 5. Stopping distance safety vs available visibility
  const visibility = Math.max(20, inputs.visibilityMeters);
  const isStoppingDistanceSafe = totalStoppingDist <= visibility;
  const stoppingSafetyMarginMeters = visibility - totalStoppingDist;

  // 6. Lateral acceleration on curves: a = v^2 / R
  const radius = CURVE_RADII[inference.curvature] || 1500;
  const lateralG = (speedMs * speedMs) / (radius * g);
  const maxLateralG = mu * (inputs.vehicleType === 'Auto-Rickshaw' ? 0.45 : 0.72);
  const isSkidRisk = lateralG > maxLateralG;

  // 7. Dynamic Aquaplaning Threshold
  let aquaplaningSpeedThreshold = 95;
  if (
    inference.surfaceQuality === 'Standing Water / Aquaplaning' ||
    inputs.weatherCondition === 'Heavy Monsoon' ||
    inputs.weatherCondition === 'Heavy Downpour'
  ) {
    aquaplaningSpeedThreshold =
      inputs.vehicleType === '2-Wheeler' ? 45 : inputs.vehicleType === 'Auto-Rickshaw' ? 40 : 65;
  } else if (inference.surfaceQuality === 'Wet Pavement' || inputs.weatherCondition === 'Rain') {
    aquaplaningSpeedThreshold =
      inputs.vehicleType === '2-Wheeler' ? 60 : inputs.vehicleType === 'Auto-Rickshaw' ? 48 : 80;
  }

  // Calculate Night / Weather reduction factor (20% - 35%)
  let nightReductionFactor = 0;
  if (isNightHours && (inputs.weatherCondition === 'Dense Fog' || inputs.weatherCondition === 'Heavy Monsoon' || inputs.weatherCondition === 'Rain')) {
    nightReductionFactor = 0.35; // Maximum 35% reduction
  } else if (isNightHours) {
    nightReductionFactor = 0.22; // 22% reduction for night commercial traffic
  } else if (inputs.weatherCondition === 'Dense Fog' || inputs.weatherCondition === 'Heavy Monsoon') {
    nightReductionFactor = 0.30; // 30% reduction for dense fog/monsoon
  } else if (inputs.weatherCondition === 'Dust Storm' || inputs.weatherCondition === 'Rain') {
    nightReductionFactor = 0.20; // 20% reduction
  }

  return {
    speedKmh,
    speedMs: Number(speedMs.toFixed(1)),
    frictionCoefficient: Number(mu.toFixed(2)),
    reactionTimeSeconds: Number(reactionTime.toFixed(1)),
    reactionDistanceMeters: Number(reactionDist.toFixed(1)),
    brakingDistanceMeters: Number(brakingDist.toFixed(1)),
    totalStoppingDistanceMeters: Number(totalStoppingDist.toFixed(1)),
    visibilityDistanceMeters: visibility,
    isStoppingDistanceSafe,
    stoppingSafetyMarginMeters: Number(stoppingSafetyMarginMeters.toFixed(1)),
    lateralGForce: Number(lateralG.toFixed(2)),
    isSkidRisk,
    aquaplaningSpeedThresholdKmh: aquaplaningSpeedThreshold,
    nightReductionFactor,
  };
}

// Compute Time-Aware Safe Speed Thresholds (India Specific Engine)
export function computeSafeSpeedThresholds(
  inputs: EngineUserInputs,
  inference: AutomatedHazardInference,
  physics: PhysicsTelemetry,
): {
  targetAverageSpeedKmh: number;
  maxSafeSpeedKmh: number;
  speedDeltaKmh: number;
  warning: string;
  nightReductionPercent: number;
  peakRushAdjustmentKmh: number;
} {
  const g = 9.81;
  const mu = physics.frictionCoefficient;
  const radius = CURVE_RADII[inference.curvature] || 1500;
  const vehicle = VEHICLE_BRAKING_FACTORS[inputs.vehicleType] || VEHICLE_BRAKING_FACTORS['Car'];

  // 1. Safe speed bounded by curve lateral friction
  const maxLateralG = mu * (inputs.vehicleType === 'Auto-Rickshaw' ? 0.45 : 0.65);
  const curveMaxSafeSpeed = Math.sqrt(maxLateralG * g * radius) * 3.6;

  // 2. Safe speed bounded by stopping distance sight envelope
  const safeSightDist = Math.max(25, inputs.visibilityMeters * 0.85);
  const a = vehicle.distanceMultiplier / (2 * mu * g);
  const b = physics.reactionTimeSeconds;
  const c = -safeSightDist;
  const discriminant = Math.max(0, b * b - 4 * a * c);
  const vSightMs = (-b + Math.sqrt(discriminant)) / (2 * a);
  const sightMaxSafeSpeed = Math.max(15, vSightMs * 3.6);

  // 3. Pavement / Diversion / Hazard cap (Auto-detected from Indian dataset)
  let hazardCapSpeed = inference.speedLimitKmh;
  if (inference.suddenDiversionDetected) hazardCapSpeed = Math.min(hazardCapSpeed, 35);
  if (inference.speedBreakersCount > 2) hazardCapSpeed = Math.min(hazardCapSpeed, 30);
  if (inference.potholesCount > 6) hazardCapSpeed = Math.min(hazardCapSpeed, 40);
  if (
    inference.surfaceQuality === 'Standing Water / Aquaplaning' ||
    inputs.weatherCondition === 'Heavy Monsoon'
  ) {
    hazardCapSpeed = Math.min(hazardCapSpeed, physics.aquaplaningSpeedThresholdKmh - 10);
  }

  // Cap at vehicle capability
  hazardCapSpeed = Math.min(hazardCapSpeed, vehicle.maxSpeedCap);

  // Preliminary Absolute maximum safe speed before time-aware adjustments
  let unadjustedMax = Math.min(
    inference.speedLimitKmh,
    curveMaxSafeSpeed,
    sightMaxSafeSpeed,
    hazardCapSpeed,
    vehicle.maxSpeedCap,
  );

  // TIME-AWARE SPEED RULE ENGINE (INDIA SPECIFIC):
  // Rule A: Night Hours (22:00 - 05:00 IST) / Fog / Rain / Heavy Monsoon:
  // Automatically reduce Maximum Safe Speed by 20% - 35% due to reduced visibility and higher incidence of commercial vehicle traffic.
  const travelHour = inputs.hour ?? 19;
  const isNightHours = travelHour >= 22 || travelHour <= 5;
  const hasAdverseWeather =
    inputs.weatherCondition === 'Dense Fog' ||
    inputs.weatherCondition === 'Heavy Monsoon' ||
    inputs.weatherCondition === 'Rain' ||
    inputs.weatherCondition === 'Dust Storm';

  let reductionRatio = 0;
  if (isNightHours && (inputs.weatherCondition === 'Dense Fog' || inputs.weatherCondition === 'Heavy Monsoon')) {
    reductionRatio = 0.35; // 35% reduction: extreme night fog/monsoon hazard
  } else if (isNightHours && (inputs.weatherCondition === 'Rain' || inputs.weatherCondition === 'Dust Storm')) {
    reductionRatio = 0.30; // 30% reduction
  } else if (isNightHours) {
    reductionRatio = 0.22; // 22% reduction: high commercial freight truck traffic
  } else if (inputs.weatherCondition === 'Dense Fog' || inputs.weatherCondition === 'Heavy Monsoon') {
    reductionRatio = 0.28; // 28% reduction
  } else if (hasAdverseWeather) {
    reductionRatio = 0.20; // 20% reduction
  }

  let absoluteMaxSafeSpeed = unadjustedMax * (1 - reductionRatio);
  absoluteMaxSafeSpeed = Math.max(15, Math.round(absoluteMaxSafeSpeed / 5) * 5);

  // Rule B: School / Peak Rush Hours (08:00 - 10:30 & 17:00 - 20:00 IST):
  // Adjust target average speeds to prevent rear-end collisions and pedestrian risks.
  const isMorningSchoolRush =
    (travelHour === 8 || travelHour === 9 || (travelHour === 10 && (inputs.timeOfTravel || '').includes('30')));
  const isEveningRush = travelHour >= 17 && travelHour <= 20;
  const isPeakRush = isMorningSchoolRush || isEveningRush || inputs.isPeakHour;

  let peakRushAdjustmentKmh = 0;
  let targetAverageSpeed: number;

  if (isPeakRush) {
    // School / Peak Rush hour: compress target average speed by 25-30% to prevent accordion braking & pedestrian strikes
    peakRushAdjustmentKmh = Math.round(absoluteMaxSafeSpeed * 0.28);
    targetAverageSpeed = Math.max(15, Math.round((absoluteMaxSafeSpeed * 0.72) / 5) * 5);
  } else {
    // Off-peak normal operating margin (18% below absolute ceiling)
    targetAverageSpeed = Math.max(15, Math.round((absoluteMaxSafeSpeed * 0.82) / 5) * 5);
  }

  // Speed compliance delta
  const currentSpeed = inputs.targetSpeed ?? inputs.speed ?? 80;
  const speedDelta = currentSpeed - absoluteMaxSafeSpeed;

  let warning = '';
  if (speedDelta > 25) {
    warning = `CRITICAL SPEED DISPARITY: Target speed (${currentSpeed} km/h) exceeds absolute safe speed (${absoluteMaxSafeSpeed} km/h) by +${speedDelta} km/h. High collision risk under ${isNightHours ? 'Night commercial traffic (22:00-05:00 IST)' : ''} ${inputs.weatherCondition} conditions.`;
  } else if (speedDelta > 0) {
    warning = `SPEED COMPLIANCE EXCEEDED: Target speed (${currentSpeed} km/h) exceeds safe threshold (${absoluteMaxSafeSpeed} km/h) by +${speedDelta} km/h. Decelerate to avoid severe stopping deficit.`;
  } else if (speedDelta === 0) {
    warning = `OPERATING AT LIMIT: Current speed (${currentSpeed} km/h) matches absolute safe threshold (${absoluteMaxSafeSpeed} km/h) with zero error margin.`;
  } else {
    warning = `SPEED COMPLIANT: Target speed (${currentSpeed} km/h) is safely within condition-based ceiling (${absoluteMaxSafeSpeed} km/h) with a ${Math.abs(speedDelta)} km/h safety cushion.`;
  }

  return {
    targetAverageSpeedKmh: targetAverageSpeed,
    maxSafeSpeedKmh: absoluteMaxSafeSpeed,
    speedDeltaKmh: speedDelta,
    warning,
    nightReductionPercent: Math.round(reductionRatio * 100),
    peakRushAdjustmentKmh,
  };
}
