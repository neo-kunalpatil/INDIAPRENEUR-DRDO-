// Shared Telemetry Data Transfer Objects (DTO)

export interface TelemetryDto {
  timestamp: string;
  uavId: string;
  rpm: number;
  throttlePercent: number;
  manifoldPressureInHg: number;
  fuelFlowLitersHr: number;
  oilPressureBar: number;
  oilTempC: number;
  chtC: [number, number, number, number];
  egtC: [number, number, number, number];
  vibrationRmsMmS: number;
}
