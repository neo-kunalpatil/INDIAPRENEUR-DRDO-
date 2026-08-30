export interface FaultDefinition {
  id: string;
  name: string;
  description: string;
  severity: string;
  degradationRate: number;
  effects: string[];
  recoveryBehavior: string;
}

export const faultRegistry: FaultDefinition[] = [
  { id: 'Oil Leak', name: 'Oil Leak', description: 'Engine oil leaking', severity: 'MEDIUM', degradationRate: 0.1, effects: ['Oil pressure drops'], recoveryBehavior: 'Gradual' },
  { id: 'Fuel Leak', name: 'Fuel Leak', description: 'Fuel leaking', severity: 'MEDIUM', degradationRate: 0.1, effects: ['Fuel flow drops'], recoveryBehavior: 'Gradual' },
  { id: 'Turbo Failure', name: 'Turbo Failure', description: 'Turbo compressor fails', severity: 'HIGH', degradationRate: 0.3, effects: ['MAP drops', 'Power drops'], recoveryBehavior: 'Gradual' },
  { id: 'Injector Failure', name: 'Injector Failure', description: 'Fuel injector fails', severity: 'HIGH', degradationRate: 0.2, effects: ['RPM drops'], recoveryBehavior: 'Gradual' },
  { id: 'Spark Plug Failure', name: 'Spark Plug Failure', description: 'Spark plug fails', severity: 'MEDIUM', degradationRate: 0.1, effects: ['Misfire'], recoveryBehavior: 'Gradual' },
  { id: 'Battery Failure', name: 'Battery Failure', description: 'Battery fails', severity: 'CRITICAL', degradationRate: 0.5, effects: ['Voltage drops'], recoveryBehavior: 'Gradual' },
  { id: 'Alternator Failure', name: 'Alternator Failure', description: 'Alternator fails', severity: 'HIGH', degradationRate: 0.1, effects: ['Battery discharges'], recoveryBehavior: 'Gradual' },
  { id: 'RPM Sensor Failure', name: 'RPM Sensor Failure', description: 'RPM sensor noise', severity: 'LOW', degradationRate: 0.0, effects: ['Telemetry noise'], recoveryBehavior: 'Instant' },
  { id: 'EGT Sensor Failure', name: 'EGT Sensor Failure', description: 'EGT sensor noise', severity: 'LOW', degradationRate: 0.0, effects: ['Telemetry noise'], recoveryBehavior: 'Instant' },
  { id: 'CHT Sensor Failure', name: 'CHT Sensor Failure', description: 'CHT sensor noise', severity: 'LOW', degradationRate: 0.0, effects: ['Telemetry noise'], recoveryBehavior: 'Instant' },
  { id: 'Oil Pressure Loss', name: 'Oil Pressure Loss', description: 'Loss of oil pressure', severity: 'HIGH', degradationRate: 0.4, effects: ['Overheating'], recoveryBehavior: 'Gradual' },
  { id: 'Overheating', name: 'Overheating', description: 'Engine overheating', severity: 'HIGH', degradationRate: 0.2, effects: ['Engine damage'], recoveryBehavior: 'Gradual' },
  { id: 'Excessive Vibration', name: 'Excessive Vibration', description: 'High vibration', severity: 'MEDIUM', degradationRate: 0.1, effects: ['Damage over time'], recoveryBehavior: 'Gradual' },
  { id: 'Throttle Failure', name: 'Throttle Failure', description: 'Throttle stuck', severity: 'CRITICAL', degradationRate: 1.0, effects: ['Loss of control'], recoveryBehavior: 'Instant' },
  { id: 'MAP Sensor Failure', name: 'MAP Sensor Failure', description: 'MAP sensor fails', severity: 'LOW', degradationRate: 0.0, effects: ['Telemetry noise'], recoveryBehavior: 'Instant' },
  { id: 'Fuel Pump Failure', name: 'Fuel Pump Failure', description: 'Fuel pump fails', severity: 'CRITICAL', degradationRate: 0.5, effects: ['Engine stops'], recoveryBehavior: 'Gradual' },
  { id: 'Fuel Filter Clogging', name: 'Fuel Filter Clogging', description: 'Filter clogs', severity: 'MEDIUM', degradationRate: 0.05, effects: ['Fuel pressure drops'], recoveryBehavior: 'Gradual' },
  { id: 'Air Filter Blockage', name: 'Air Filter Blockage', description: 'Air filter blocks', severity: 'MEDIUM', degradationRate: 0.1, effects: ['Power loss'], recoveryBehavior: 'Gradual' },
  { id: 'Turbo Boost Leak', name: 'Turbo Boost Leak', description: 'Boost leaks', severity: 'HIGH', degradationRate: 0.2, effects: ['MAP drops'], recoveryBehavior: 'Gradual' },
  { id: 'Turbo Overspeed', name: 'Turbo Overspeed', description: 'Turbo overspeeds', severity: 'CRITICAL', degradationRate: 0.4, effects: ['Turbo failure'], recoveryBehavior: 'Instant' },
  { id: 'Cylinder Compression Loss', name: 'Cylinder Compression Loss', description: 'Compression lost', severity: 'HIGH', degradationRate: 0.2, effects: ['Power loss'], recoveryBehavior: 'Gradual' },
  { id: 'Valve Timing Fault', name: 'Valve Timing Fault', description: 'Valve timing off', severity: 'HIGH', degradationRate: 0.3, effects: ['Misfire'], recoveryBehavior: 'Instant' },
  { id: 'Piston Ring Wear', name: 'Piston Ring Wear', description: 'Ring wear', severity: 'LOW', degradationRate: 0.01, effects: ['Oil consumption'], recoveryBehavior: 'Gradual' },
  { id: 'Bearing Wear', name: 'Bearing Wear', description: 'Bearing wear', severity: 'LOW', degradationRate: 0.01, effects: ['Vibration'], recoveryBehavior: 'Gradual' },
  { id: 'Crankshaft Imbalance', name: 'Crankshaft Imbalance', description: 'Crankshaft imbalance', severity: 'MEDIUM', degradationRate: 0.05, effects: ['Vibration'], recoveryBehavior: 'Gradual' },
  { id: 'Connecting Rod Damage', name: 'Connecting Rod Damage', description: 'Connecting rod damage', severity: 'CRITICAL', degradationRate: 0.5, effects: ['Engine failure'], recoveryBehavior: 'Instant' },
  { id: 'Starter Failure', name: 'Starter Failure', description: 'Starter fails', severity: 'LOW', degradationRate: 1.0, effects: ['Cannot start'], recoveryBehavior: 'Instant' },
  { id: 'Ignition Coil Failure', name: 'Ignition Coil Failure', description: 'Ignition coil fails', severity: 'HIGH', degradationRate: 0.3, effects: ['Misfire'], recoveryBehavior: 'Instant' },
  { id: 'ECU Failure', name: 'ECU Failure', description: 'ECU fails', severity: 'CRITICAL', degradationRate: 1.0, effects: ['Engine shutdown'], recoveryBehavior: 'Instant' },
  { id: 'FADEC Communication Loss', name: 'FADEC Communication Loss', description: 'FADEC comms lost', severity: 'CRITICAL', degradationRate: 1.0, effects: ['Loss of control'], recoveryBehavior: 'Instant' },
  { id: 'CAN Bus Failure', name: 'CAN Bus Failure', description: 'CAN bus fails', severity: 'HIGH', degradationRate: 1.0, effects: ['Telemetry loss'], recoveryBehavior: 'Instant' },
  { id: 'Power Bus Failure', name: 'Power Bus Failure', description: 'Power bus fails', severity: 'CRITICAL', degradationRate: 1.0, effects: ['Total failure'], recoveryBehavior: 'Instant' },
  { id: 'Voltage Regulator Failure', name: 'Voltage Regulator Failure', description: 'Voltage regulator fails', severity: 'HIGH', degradationRate: 0.2, effects: ['Voltage spikes'], recoveryBehavior: 'Instant' },
  { id: 'Alternator Belt Slip', name: 'Alternator Belt Slip', description: 'Alternator belt slips', severity: 'MEDIUM', degradationRate: 0.1, effects: ['Low charge'], recoveryBehavior: 'Gradual' },
  { id: 'Battery Cell Degradation', name: 'Battery Cell Degradation', description: 'Battery cell degraded', severity: 'LOW', degradationRate: 0.02, effects: ['Lower capacity'], recoveryBehavior: 'Gradual' },
  { id: 'Oil Pump Failure', name: 'Oil Pump Failure', description: 'Oil pump fails', severity: 'CRITICAL', degradationRate: 0.5, effects: ['Oil pressure loss'], recoveryBehavior: 'Gradual' },
  { id: 'Oil Filter Blockage', name: 'Oil Filter Blockage', description: 'Oil filter blocks', severity: 'HIGH', degradationRate: 0.1, effects: ['Oil pressure loss'], recoveryBehavior: 'Gradual' },
  { id: 'Oil Cooler Failure', name: 'Oil Cooler Failure', description: 'Oil cooler fails', severity: 'HIGH', degradationRate: 0.1, effects: ['Overheating'], recoveryBehavior: 'Gradual' },
  { id: 'Cooling System Failure', name: 'Cooling System Failure', description: 'Cooling fails', severity: 'HIGH', degradationRate: 0.2, effects: ['Overheating'], recoveryBehavior: 'Gradual' },
  { id: 'CHT Overlimit', name: 'CHT Overlimit', description: 'CHT overlimit', severity: 'HIGH', degradationRate: 0.2, effects: ['Engine damage'], recoveryBehavior: 'Gradual' },
  { id: 'EGT Overlimit', name: 'EGT Overlimit', description: 'EGT overlimit', severity: 'HIGH', degradationRate: 0.2, effects: ['Turbo damage'], recoveryBehavior: 'Gradual' },
  { id: 'Detonation Event', name: 'Detonation Event', description: 'Detonation', severity: 'CRITICAL', degradationRate: 0.5, effects: ['Engine damage'], recoveryBehavior: 'Instant' },
  { id: 'Pre-Ignition Event', name: 'Pre-Ignition Event', description: 'Pre-ignition', severity: 'CRITICAL', degradationRate: 0.5, effects: ['Engine damage'], recoveryBehavior: 'Instant' },
  { id: 'Combustion Instability', name: 'Combustion Instability', description: 'Combustion unstable', severity: 'MEDIUM', degradationRate: 0.1, effects: ['Power loss'], recoveryBehavior: 'Gradual' },
  { id: 'Throttle Servo Jam', name: 'Throttle Servo Jam', description: 'Throttle servo jammed', severity: 'CRITICAL', degradationRate: 1.0, effects: ['Loss of control'], recoveryBehavior: 'Instant' },
  { id: 'Throttle Sensor Failure', name: 'Throttle Sensor Failure', description: 'Throttle sensor fails', severity: 'HIGH', degradationRate: 0.0, effects: ['Unstable power'], recoveryBehavior: 'Instant' },
  { id: 'Propeller Imbalance', name: 'Propeller Imbalance', description: 'Propeller imbalanced', severity: 'MEDIUM', degradationRate: 0.1, effects: ['Vibration'], recoveryBehavior: 'Gradual' },
  { id: 'Propeller Damage', name: 'Propeller Damage', description: 'Propeller damaged', severity: 'CRITICAL', degradationRate: 0.5, effects: ['Vibration', 'Power loss'], recoveryBehavior: 'Instant' },
  { id: 'Vibration Spike Event', name: 'Vibration Spike Event', description: 'Vibration spike', severity: 'HIGH', degradationRate: 0.2, effects: ['Structural stress'], recoveryBehavior: 'Instant' },
  { id: 'GPS Failure', name: 'GPS Failure', description: 'GPS fails', severity: 'HIGH', degradationRate: 1.0, effects: ['Navigation lost'], recoveryBehavior: 'Instant' },
  { id: 'Pitot Tube Blockage', name: 'Pitot Tube Blockage', description: 'Pitot blocked', severity: 'HIGH', degradationRate: 0.5, effects: ['Airspeed lost'], recoveryBehavior: 'Instant' },
  { id: 'Static Port Blockage', name: 'Static Port Blockage', description: 'Static port blocked', severity: 'HIGH', degradationRate: 0.5, effects: ['Altitude lost'], recoveryBehavior: 'Instant' },
  { id: 'Altitude Sensor Failure', name: 'Altitude Sensor Failure', description: 'Altitude sensor fails', severity: 'HIGH', degradationRate: 0.0, effects: ['Altitude lost'], recoveryBehavior: 'Instant' },
  { id: 'Airspeed Sensor Failure', name: 'Airspeed Sensor Failure', description: 'Airspeed sensor fails', severity: 'HIGH', degradationRate: 0.0, effects: ['Airspeed lost'], recoveryBehavior: 'Instant' },
  { id: 'Temperature Sensor Drift', name: 'Temperature Sensor Drift', description: 'Temp sensor drifts', severity: 'LOW', degradationRate: 0.01, effects: ['Telemetry error'], recoveryBehavior: 'Gradual' },
  { id: 'Humidity Sensor Failure', name: 'Humidity Sensor Failure', description: 'Humidity sensor fails', severity: 'LOW', degradationRate: 0.0, effects: ['Telemetry error'], recoveryBehavior: 'Instant' },
  { id: 'Pressure Sensor Failure', name: 'Pressure Sensor Failure', description: 'Pressure sensor fails', severity: 'LOW', degradationRate: 0.0, effects: ['Telemetry error'], recoveryBehavior: 'Instant' }
];

console.log("Total Fault Definitions Loaded:", faultRegistry.length);
console.log("Fault Registry Size:", faultRegistry.length);
