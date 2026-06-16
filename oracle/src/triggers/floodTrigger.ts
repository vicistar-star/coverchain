import { WeatherData } from "../providers/weather.js";

export interface FloodTriggerResult {
  triggered: boolean;
  severity: number;
  rainfallMm: number;
  thresholdMm: number;
  reason: string;
}

export interface FloodThreshold {
  warningMm: number;
  criticalMm: number;
  severeMm: number;
  lookbackHours: number;
}

const FLOOD_SHIELD_THRESHOLDS: FloodThreshold = {
  warningMm: 80,
  criticalMm: 130,
  severeMm: 200,
  lookbackHours: 6,
};

export function evaluateFloodRisk(
  weatherData: WeatherData,
  thresholds?: Partial<FloodThreshold>
): FloodTriggerResult {
  const t: FloodThreshold = { ...FLOOD_SHIELD_THRESHOLDS, ...thresholds };
  const { rainfallMm } = weatherData;

  if (rainfallMm >= t.severeMm) {
    return {
      triggered: true,
      severity: 3,
      rainfallMm,
      thresholdMm: t.severeMm,
      reason: `SEVERE: Rainfall ${rainfallMm}mm exceeds severe threshold ${t.severeMm}mm`,
    };
  }

  if (rainfallMm >= t.criticalMm) {
    return {
      triggered: true,
      severity: 2,
      rainfallMm,
      thresholdMm: t.criticalMm,
      reason: `CRITICAL: Rainfall ${rainfallMm}mm exceeds critical threshold ${t.criticalMm}mm`,
    };
  }

  if (rainfallMm >= t.warningMm) {
    return {
      triggered: true,
      severity: 1,
      rainfallMm,
      thresholdMm: t.warningMm,
      reason: `WARNING: Rainfall ${rainfallMm}mm exceeds warning threshold ${t.warningMm}mm`,
    };
  }

  return {
    triggered: false,
    severity: 0,
    rainfallMm,
    thresholdMm: t.warningMm,
    reason: `NORMAL: Rainfall ${rainfallMm}mm below warning threshold ${t.warningMm}mm`,
  };
}

export function assessContinuousRainfall(
  samples: { rainfallMm: number; timestamp: number }[],
  thresholds?: Partial<FloodThreshold>
): FloodTriggerResult {
  const t: FloodThreshold = { ...FLOOD_SHIELD_THRESHOLDS, ...thresholds };
  const totalRainfall = samples.reduce((sum, s) => sum + s.rainfallMm, 0);
  const lookbackEnd = Date.now() / 1000;
  const lookbackStart = lookbackEnd - t.lookbackHours * 3600;
  const inWindow = samples.filter((s) => s.timestamp >= lookbackStart && s.timestamp <= lookbackEnd);
  const windowRainfall = inWindow.reduce((sum, s) => sum + s.rainfallMm, 0);

  if (windowRainfall >= t.severeMm / 2 && inWindow.length >= 3) {
    return {
      triggered: true,
      severity: 3,
      rainfallMm: windowRainfall,
      thresholdMm: t.severeMm,
      reason: `SEVERE: ${windowRainfall}mm over ${t.lookbackHours}h from ${inWindow.length} readings`,
    };
  }

  return evaluateFloodRisk(
    { rainfallMm: windowRainfall } as WeatherData,
    thresholds
  );
}

export function getFloodThresholds(): FloodThreshold {
  return { ...FLOOD_SHIELD_THRESHOLDS };
}
