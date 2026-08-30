export type HealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'MAINTENANCE';

export type AlertSeverity = 'CRITICAL' | 'MAJOR' | 'WARNING' | 'NOTICE' | 'INFO';

export type MissionPhase = 
  | 'PRE_FLIGHT' 
  | 'TAXI_TAKEOFF' 
  | 'CLIMB' 
  | 'INGRESS' 
  | 'HIGH_ALT_LOITER' 
  | 'RECON_SURVEILLANCE' 
  | 'EGRESS' 
  | 'DESCENT' 
  | 'RECOVERY_LANDING';

export type EngineComponentId = 
  | 'cylinder_1'
  | 'cylinder_2'
  | 'cylinder_3'
  | 'cylinder_4'
  | 'turbocharger'
  | 'crankcase'
  | 'intercooler'
  | 'fuel_injection_rail'
  | 'oil_cooling_circuit'
  | 'dual_cdi_ignition'
  | 'gearbox_prop_governor';

export interface UavUnit {
  id: string;
  callsign: string;
  model: string; // e.g. "DRDO TAPAS-BH-201 (Rustom-II)"
  serialNumber: string;
  registration?: string;
  squadron: string; // e.g. "144 Sqn 'Black Eagles'"
  base: string; // e.g. "Aeronautical Test Range, Chitradurga"
  currentMissionId: string;
  status: 'ACTIVE_MISSION' | 'STANDBY' | 'MAINTENANCE' | 'ALERT_RTB';
  altitudeFt: number;
  airspeedKts: number;
  speedKts?: number;
  flightHours?: number;
  fuelRemainingKg: number;
  engineHealthIndex: number; // 0-100
  missionRiskScore: number; // 0-100
  twinConfidenceScore: number; // 0-100
  predictedRulHours: number;
  activeFaultsCount: number;
  location: {
    lat: number;
    lng: number;
    region: string;
  };
}

export interface EngineTelemetry {
  timestamp: string;
  rpm: number; // 2200 - 5800 RPM
  manifoldPressureInHg: number; // 25 - 39 inHg
  throttlePercent: number; // 0 - 100%
  coolantTempC: number; // 80 - 115 °C
  oilTempC: number; // 90 - 130 °C
  oilPressureBar: number; // 2.0 - 5.5 bar
  fuelPressureBar: number; // 2.5 - 3.2 bar
  fuelFlowLitersHr: number; // 18 - 32 L/h
  chtC: [number, number, number, number]; // Cylinder Head Temps Cyl 1-4 (80-135°C)
  egtC: [number, number, number, number]; // Exhaust Gas Temps Cyl 1-4 (650-850°C)
  turbochargerRpm: number; // 60,000 - 145,000 RPM
  turboBoostBar: number; // 0.2 - 1.25 bar
  vibrationRmsMmS: number; // 1.2 - 8.5 mm/s (Overall engine vibration)
  vibrationFftPeakHz: number; // 45 - 280 Hz (Harmonic peak)
  knockIndex: number; // 0 - 1.0 (Pre-ignition knock intensity)
  lambdaAirFuelRatio: number; // 0.85 - 1.15
  ambientTempC: number; // -20 to +45 °C
  ambientPressureHpa: number; // 540 to 1013 hPa
}

export interface CylinderHealth {
  cylinderId: number;
  cht: number;
  egt: number;
  compressionRatio: number;
  sparkEfficiencyPercent: number;
  knockIntensity: number;
  thermalGradientStatus: 'OPTIMAL' | 'ELEVATED' | 'CRITICAL';
}

export interface PhysicsAiComparison {
  parameter: string;
  unit: string;
  physicsExpected: number;
  aiPredicted: number;
  actualTelemetry: number;
  divergencePercent: number;
  verificationStatus: 'VERIFIED_MATCH' | 'MINOR_VARIANCE' | 'SUSPICIOUS_DIVERGENCE' | 'ANOMALY_CONFIRMED';
  physicsConfidence: number;
  aiConfidence: number;
}

export interface MissionAwareRul {
  missionType: string;
  environmentalCondition: string;
  estimatedRulHours: number;
  confidencePercent: number;
  criticalLimitingComponent: string;
  riskFactor: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  wearAccelerationMultiplier: number;
}

export interface ExplainableAiAttribution {
  featureName: string;
  featureCategory: 'THERMAL' | 'MECHANICAL' | 'COMBUSTION' | 'FLUIDIC' | 'OPERATIONAL';
  contributionScore: number; // positive increases failure likelihood, negative decreases
  baselineValue: string;
  currentObservedValue: string;
  explanation: string;
}

export interface FailureTimelineEvent {
  id: string;
  stage: 'INITIATION' | 'PROPAGATION' | 'THRESHOLD_BREACH' | 'FUNCTIONAL_IMPAIRMENT' | 'CRITICAL_FAILURE';
  timeframeRemaining: string;
  component: string;
  triggerCause: string;
  observableSymptom: string;
  consequence: string;
  preventativeIntervention: string;
}

export interface MaintenanceAction {
  id: string;
  priority: 'EMERGENCY' | 'CRITICAL' | 'SCHEDULED' | 'ADVISORY';
  title: string;
  subsystem: string;
  prescribedProcedure: string;
  estimatedLaborHours: number;
  requiredParts: Array<{ partNumber: string; name: string; quantity: number; stockStatus: 'IN_STOCK' | 'DEPOT_ORDER' }>;
  urgencyTimeline: string;
  milStandardReference: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'IN_PROGRESS' | 'RESOLVED';
}

export interface InjectedFault {
  id: string;
  type: 
    | 'TURBO_WASTEGATE_STUCK' 
    | 'INJECTOR_3_CLOGGED' 
    | 'CYLINDER_2_PREIGNITION' 
    | 'OIL_PUMP_CAVITATION' 
    | 'INTERCOOLER_EFFICIENCY_DROP' 
    | 'COOLANT_RADIATOR_BYPASS' 
    | 'VALVE_SEAT_LEAKAGE';
  name: string;
  description: string;
  severityPercent: number; // 0-100%
  component: EngineComponentId;
  active: boolean;
  timestampInjected?: string;
  affectedParameters: string[];
}

export interface AlertNotification {
  id: string;
  timestamp: string;
  uavId: string;
  uavCallsign: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  description?: string;
  subsystem: string;
  suggestedAction: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface MissionProfile {
  id: string;
  codeName: string; // e.g. "OPERATION INDRADHANUSH - SURVEILLANCE SECTOR 7"
  uavId: string;
  phase: MissionPhase;
  status?: string;
  targetSector?: string;
  originBase?: string;
  startTime: string;
  estimatedDurationHours: number;
  durationHours?: number;
  elapsedTimeHours: number;
  altitudeFlightLevelFt: number;
  terrainType: 'HIGH_ALTITUDE_MOUNTAIN' | 'DESERT_HOT' | 'COASTAL_HUMID' | 'PLAINS';
  waypoints: Array<{ id?: string; name: string; lat: number; lng: number; altFt: number; altitudeFt?: number; eta: string; status: 'PASSED' | 'CURRENT' | 'PENDING'; completed?: boolean }>;
  goNoGoVerdict: 'GO_MISSION_NORMAL' | 'GO_WITH_OBSERVATION' | 'NO_GO_ABORT_RTB' | 'RESTRICT_ENVELOPE';
  missionRiskIndex: number; // 0-100
  weatherFactor: {
    oatC: number;
    windSpeedKts: number;
    densityAltitudeFt: number;
    turbulenceLevel: 'LIGHT' | 'MODERATE' | 'SEVERE';
  };
}

export interface MultiAgentStatus {
  agentName: string;
  role: string;
  status: 'ACTIVE' | 'PROCESSING' | 'SYNCHRONIZING' | 'IDLE';
  inferenceLatencyMs: number;
  lastDecision: string;
  confidenceScore: number;
}

export interface DemoTourStep {
  id: number;
  title: string;
  innovationNumber: number;
  innovationName: string;
  pageTarget: string;
  highlightSelector: string;
  summary: string;
  defenceImpact: string;
  demonstrationAction: string;
}
