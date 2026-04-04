import { create } from 'zustand';

// Initial state helpers
const generateHash = () => '0x' + Math.random().toString(16).substring(2, 10) + '...' + Math.random().toString(16).substring(2, 6);

// Initial coordinates for buoys around a central spill location
const BUOYS = {
  buoy_1: { id: 'B-01', lat: 7.02, lng: 79.80, status: 'SAFE', pH: 8.1, toxicityPpm: 0 },
  buoy_2: { id: 'B-02', lat: 6.98, lng: 79.85, status: 'SAFE', pH: 8.0, toxicityPpm: 2.1 },
  buoy_3: { id: 'B-03', lat: 6.90, lng: 79.79, status: 'SAFE', pH: 8.2, toxicityPpm: 0.5 },
  buoy_4: { id: 'B-04', lat: 7.05, lng: 79.88, status: 'SAFE', pH: 8.1, toxicityPpm: 1.0 },
};

export const useSimulation = create((set, get) => ({
  // Scenarios: NORMAL, MINOR_LEAK, CATASTROPHIC
  scenario: 'NORMAL',
  dronesDeployed: false,
  windDirection: 'NW',
  windSpeedKnots: 12,
  timeElapsed: 0,
  
  sensors: { ...BUOYS },
  
  blockchainLog: [
    {
      hash: generateHash(),
      timestamp: new Date().toISOString(),
      eventType: 'SYSTEM_BOOT',
      details: 'Blockchain integration active. Monitoring initialized.'
    }
  ],

  aiPredictions: {
    threatLevel: 'LOW',
    spreadRadius: 0, // km
    spreadCenter: [6.95, 79.82],
    probability: 0
  },

  // Active Drones
  dronePositions: [
    { id: 'd1', lat: 7.02, lng: 79.80 },
    { id: 'd2', lat: 6.98, lng: 79.83 },
    { id: 'd3', lat: 6.90, lng: 79.79 }
  ],

  // Actions
  setScenario: (newScenario) => {
    set({ scenario: newScenario, dronesDeployed: false });
    get().addLog(`SCENARIO_UPDATED`, `Simulation shifted to ${newScenario} protocol.`);
  },

  setWind: (direction, speed) => set({ windDirection: direction, windSpeedKnots: speed }),

  deployDrones: () => {
    if (get().dronesDeployed) return;
    set({ dronesDeployed: true });
    get().addLog('EMERGENCY_ACTION', 'Autonomous neutralizing drones deployed to hazard zone.');
  },

  addLog: (type, details) => {
    set((state) => ({
      blockchainLog: [
        {
          hash: generateHash(),
          timestamp: new Date().toISOString(),
          eventType: type,
          details
        },
        ...state.blockchainLog // prepend to list
      ]
    }));
  },

  // Game Engine Tick
  tick: () => set((state) => {
    const { scenario, dronesDeployed, sensors, aiPredictions, dronePositions } = state;
    
    // Simulate Data Progression based on Scenario
    let newSensors = { ...sensors };
    let newAIPredictions = { ...aiPredictions };
    let newDronePositions = [...dronePositions];
    let shouldLogCritical = false;

    // Simulate drone patrols if deployed
    if (dronesDeployed) {
      const t = state.timeElapsed * 0.15; // Speed multiplier
      newDronePositions[0] = { ...newDronePositions[0], lat: 7.02 + Math.sin(t)*0.015, lng: 79.80 + Math.cos(t)*0.015 };
      newDronePositions[1] = { ...newDronePositions[1], lat: 6.98 + Math.sin(t+2)*0.02, lng: 79.83 + Math.cos(t+2)*0.02 };
      newDronePositions[2] = { ...newDronePositions[2], lat: 6.90 + Math.sin(t+4)*0.025, lng: 79.79 + Math.cos(t+4)*0.025 };
    }

    if (scenario === 'NORMAL') {
      newAIPredictions.threatLevel = 'LOW';
      newAIPredictions.spreadRadius = 0;
      newAIPredictions.probability = 0;
      // Soft drift
      Object.keys(newSensors).forEach(key => {
        newSensors[key].status = 'SAFE';
        newSensors[key].toxicityPpm = Math.max(0, newSensors[key].toxicityPpm * 0.9);
        newSensors[key].pH = 8.0 + (Math.random() * 0.2 - 0.1);
      });
    }

    if (scenario === 'MINOR_LEAK') {
      newAIPredictions.threatLevel = 'MEDIUM';
      newAIPredictions.spreadRadius = Math.min(2000, aiPredictions.spreadRadius + 100);
      newAIPredictions.probability = 45;
      
      // Target buoy_2
      const target = newSensors.buoy_2;
      target.toxicityPpm = Math.min(30, target.toxicityPpm + 2);
      target.pH = Math.max(6.5, target.pH - 0.1);
      target.status = target.toxicityPpm > 15 ? 'WARN' : 'SAFE';
    }

    if (scenario === 'CATASTROPHIC') {
      const reductionFactor = dronesDeployed ? -5 : 5; 
      
      newAIPredictions.threatLevel = dronesDeployed ? 'CONTAINING' : 'CRITICAL';
      newAIPredictions.spreadRadius = Math.max(0, Math.min(8000, aiPredictions.spreadRadius + (dronesDeployed ? -200 : 400)));
      newAIPredictions.probability = dronesDeployed ? Math.max(10, aiPredictions.probability - 2) : Math.min(99, aiPredictions.probability + 5);

      Object.keys(newSensors).forEach((key, idx) => {
        const target = newSensors[key];
        // Center of spill is near buoy_1 and buoy_2
        if (key === 'buoy_1' || key === 'buoy_2') {
          target.toxicityPpm = Math.max(0, target.toxicityPpm + reductionFactor);
          target.pH = Math.max(4.0, target.pH - (reductionFactor > 0 ? 0.2 : -0.1));
          target.status = target.toxicityPpm > 80 ? 'DANGER' : (target.toxicityPpm > 30 ? 'WARN' : 'SAFE');
          if (target.toxicityPpm >= 100 && state.timeElapsed % 5 === 0 && !dronesDeployed) {
            shouldLogCritical = true;
          }
        }
      });
    }

    if (shouldLogCritical) {
      setTimeout(() => get().addLog('CRITICAL_HAZARD', 'Lethal toxicity levels detected! Imminent risk to marine life.'), 0);
    }

    return {
      timeElapsed: state.timeElapsed + 1,
      sensors: newSensors,
      aiPredictions: newAIPredictions,
      dronePositions: newDronePositions
    };
  })
}));
