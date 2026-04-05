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

  // Active Drones (Home base near Colombo coast: 6.93, 79.84)
  dronePositions: [
    { id: 'd1', name: 'Drone 1', lat: 6.93, lng: 79.84, baseLat: 6.93, baseLng: 79.84, battery: 100, status: 'IDLE', targetBuoy: null },
    { id: 'd2', name: 'Drone 2', lat: 6.93, lng: 79.84, baseLat: 6.93, baseLng: 79.84, battery: 100, status: 'IDLE', targetBuoy: null },
    { id: 'd3', name: 'Drone 3', lat: 6.93, lng: 79.84, baseLat: 6.93, baseLng: 79.84, battery: 100, status: 'IDLE', targetBuoy: null }
  ],

  // Actions
  setScenario: (newScenario) => {
    set((state) => ({ 
      scenario: newScenario, 
      dronesDeployed: false,
      dronePositions: state.dronePositions.map(d => ({ ...d, lat: d.baseLat, lng: d.baseLng, battery: 100, status: 'IDLE', targetBuoy: null }))
    }));
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
      // Natural ambient increase if not contained
      const spreadFactor = dronesDeployed ? -100 : 400; 
      
      newAIPredictions.threatLevel = dronesDeployed ? 'CONTAINING' : 'CRITICAL';
      newAIPredictions.spreadRadius = Math.max(0, Math.min(8000, aiPredictions.spreadRadius + spreadFactor));
      newAIPredictions.probability = dronesDeployed ? Math.max(10, aiPredictions.probability - 2) : Math.min(99, aiPredictions.probability + 5);

      Object.keys(newSensors).forEach((key) => {
        const target = newSensors[key];
        // Ambient spill effect near buoy_1 and buoy_2
        if (key === 'buoy_1' || key === 'buoy_2') {
          target.toxicityPpm += 3; // steady leak
          target.pH = Math.max(4.0, target.pH - 0.1);
          target.status = target.toxicityPpm > 80 ? 'DANGER' : (target.toxicityPpm > 30 ? 'WARN' : 'SAFE');
          if (target.toxicityPpm >= 100 && state.timeElapsed % 5 === 0 && !dronesDeployed) {
            shouldLogCritical = true;
          }
        }
      });
    }

    // Swarm Logic: Simulate drone actions if deployed (runs after ambient spill effects to clean them up)
    if (dronesDeployed) {
      const toxicBuoys = Object.values(newSensors)
        .filter(b => b.toxicityPpm > 2 || b.status !== 'SAFE')
        .sort((a, b) => b.toxicityPpm - a.toxicityPpm);

      newDronePositions = newDronePositions.map((drone, idx) => {
        let updatedDrone = { ...drone };
        
        // Auto-assign task based on priority
        const target = toxicBuoys[idx] || toxicBuoys[0] || Object.values(newSensors)[idx % 4];
        if (target) {
          updatedDrone.targetBuoy = target.id;
          const currentTargetCoords = Object.values(newSensors).find(b => b.id === updatedDrone.targetBuoy);
          
          if (currentTargetCoords) {
            const dx = currentTargetCoords.lng - updatedDrone.lng;
            const dy = currentTargetCoords.lat - updatedDrone.lat;
            const distance = Math.sqrt(dx*dx + dy*dy);

            if (distance > 0.003) {
              // En route to target
              const speed = 0.003; 
              updatedDrone.lng += (dx / distance) * speed;
              updatedDrone.lat += (dy / distance) * speed;
              updatedDrone.status = 'EN ROUTE';
            } else {
              // Reached target, clean it
              updatedDrone.status = 'CLEANING';
              const sensorKey = Object.keys(newSensors).find(k => newSensors[k].id === target.id);
              if (sensorKey) {
                newSensors[sensorKey].toxicityPpm = Math.max(0, newSensors[sensorKey].toxicityPpm - 8); // Active suction/neutralizing
                newSensors[sensorKey].pH = Math.min(8.1, newSensors[sensorKey].pH + 0.2);
                newSensors[sensorKey].status = newSensors[sensorKey].toxicityPpm > 30 ? 'WARN' : 'SAFE';
              }
            }
          }
        }
        
        if (updatedDrone.status === 'CLEANING') {
          updatedDrone.battery = Math.max(0, updatedDrone.battery - 0.3); // High drain
        } else if (updatedDrone.status === 'EN ROUTE') {
          updatedDrone.battery = Math.max(0, updatedDrone.battery - 0.1); // Moving drain
        } else {
          updatedDrone.battery = Math.max(0, updatedDrone.battery - 0.02); // Standby drain
        }

        return updatedDrone;
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
