import { create } from 'zustand';

// Initial state helpers
const generateHash = () => '0x' + Math.random().toString(16).substring(2, 10) + '...' + Math.random().toString(16).substring(2, 6);

// Initial coordinates for buoys around a central spill location
const BUOYS = {
  buoy_1: { id: 'B-01', lat: 7.02, lng: 79.80, status: 'SAFE', pH: 8.1, toxicityPpm: 0 },
  buoy_2: { id: 'B-02', lat: 6.98, lng: 79.85, status: 'SAFE', pH: 8.0, toxicityPpm: 0 },
  buoy_3: { id: 'B-03', lat: 6.90, lng: 79.79, status: 'SAFE', pH: 8.2, toxicityPpm: 0 },

  buoy_5: { id: 'B-05', lat: 6.93, lng: 79.81, status: 'SAFE', pH: 8.0, toxicityPpm: 0 },
  buoy_6: { id: 'B-06', lat: 6.97, lng: 79.83, status: 'SAFE', pH: 8.1, toxicityPpm: 0 },
  buoy_7: { id: 'B-07', lat: 6.91, lng: 79.84, status: 'SAFE', pH: 8.0, toxicityPpm: 0 },
  buoy_8: { id: 'B-08', lat: 7.00, lng: 79.78, status: 'SAFE', pH: 8.2, toxicityPpm: 0 },
  buoy_9: { id: 'B-09', lat: 6.88, lng: 79.80, status: 'SAFE', pH: 8.1, toxicityPpm: 0 },
  buoy_10: { id: 'B-10', lat: 7.08, lng: 79.82, status: 'SAFE', pH: 8.0, toxicityPpm: 0 },
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
    { id: 'd3', name: 'Drone 3', lat: 6.93, lng: 79.84, baseLat: 6.93, baseLng: 79.84, battery: 100, status: 'IDLE', targetBuoy: null },
    { id: 'd4', name: 'Drone 4', lat: 6.93, lng: 79.84, baseLat: 6.93, baseLng: 79.84, battery: 100, status: 'IDLE', targetBuoy: null },
    { id: 'd5', name: 'Drone 5', lat: 6.93, lng: 79.84, baseLat: 6.93, baseLng: 79.84, battery: 100, status: 'IDLE', targetBuoy: null }
  ],

  // Shipping Traffic
  ships: [
    { id: 'SHIP-01', lat: 6.75, lng: 79.81, status: 'NORMAL', targetWaypoint: null },
    { id: 'SHIP-02', lat: 6.95, lng: 79.78, status: 'NORMAL', targetWaypoint: null },
    { id: 'SHIP-03', lat: 7.15, lng: 79.76, status: 'NORMAL', targetWaypoint: null },
  ],

  sensorHistory: {},

  // Actions
  setScenario: (newScenario) => {
    set((state) => {
      // Instant clear all sensors on scenario reset
      const resetSensors = {};
      Object.keys(state.sensors).forEach(key => {
        resetSensors[key] = { ...state.sensors[key], toxicityPpm: 0, status: 'SAFE', pH: 8.1 };
      });

      return {
        scenario: newScenario,
        dronesDeployed: false,
        sensors: resetSensors,
        aiPredictions: {
          threatLevel: 'LOW',
          spreadRadius: 0,
          spreadCenter: [6.95, 79.82],
          probability: 0
        },
        dronePositions: state.dronePositions.map(d => ({ ...d, lat: d.baseLat, lng: d.baseLng, battery: 100, status: 'IDLE', targetBuoy: null }))
      };
    });
    get().addLog(`SCENARIO_UPDATED`, `Simulation shifted to ${newScenario} protocol.`);
  },

  setWind: (direction, speed) => set({ windDirection: direction, windSpeedKnots: speed }),

  deployDrones: () => {
    if (get().dronesDeployed) return;
    set({ dronesDeployed: true });
    get().addLog('EMERGENCY_ACTION', 'Autonomous neutralizing drones deployed to hazard zone.');
  },

  rerouteTraffic: () => {
    set((state) => {
      // Divert to a secondary safe lane waypoint (further offshore west)
      // We will push each ship's longitude westward horizontally so they move in parallel
      return {
        ships: state.ships.map(ship => ({
          ...ship,
          status: 'REROUTING',
          targetWaypoint: [ship.lat, ship.lng - 0.20] // maintain lat, move deeper west
        }))
      };
    });
    get().addLog('TRAFFIC_REROUTING', 'Shipping traffic diverted to secondary safe lane.');
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
    const { scenario, dronesDeployed, sensors, aiPredictions, dronePositions, sensorHistory, ships } = state;

    // Simulate Data Progression based on Scenario
    let newSensors = { ...sensors };
    let newAIPredictions = { ...aiPredictions };
    let newDronePositions = [...dronePositions];
    let shouldLogCritical = false;

    if (scenario === 'NORMAL') {
      newAIPredictions.threatLevel = 'LOW';
      newAIPredictions.spreadRadius = 0;
      newAIPredictions.probability = 0;
      // No natural decay - sensors stay toxic until drones handle them
      Object.keys(newSensors).forEach(key => {
        newSensors[key].status = newSensors[key].toxicityPpm > 10 ? 'WARN' : 'SAFE';
        newSensors[key].pH = 8.1;
      });
    }

    if (scenario === 'MINOR_LEAK' || scenario === 'CATASTROPHIC') {
      const isCatastrophic = scenario === 'CATASTROPHIC';
      const spreadFactor = dronesDeployed ? (isCatastrophic ? -300 : -150) : (isCatastrophic ? 400 : 100);
      const maxRadius = isCatastrophic ? 8000 : 2000;

      newAIPredictions.threatLevel = dronesDeployed ? 'CONTAINING' : (isCatastrophic ? 'CRITICAL' : 'MEDIUM');
      
      // Fixed shrinking is removed - Radius is now tied DYNAMICALLY to sensor purification
      if (!dronesDeployed) {
        newAIPredictions.spreadRadius = Math.max(0, Math.min(maxRadius, aiPredictions.spreadRadius + spreadFactor));
      }
      
      if (isCatastrophic) {
        newAIPredictions.probability = dronesDeployed ? Math.max(10, aiPredictions.probability - 2) : Math.min(99, aiPredictions.probability + 5);
      } else {
        newAIPredictions.probability = dronesDeployed ? Math.max(10, aiPredictions.probability - 1) : 45;
      }

      // Proximity-based toxicity calculation
      const spreadRadiusKm = newAIPredictions.spreadRadius / 1000;
      const fringeRadiusKm = 2.0; // Consistent early warning buffer
      const centerLat = aiPredictions.spreadCenter[0];
      const centerLng = aiPredictions.spreadCenter[1];

      let currentFarthestToxicDistKm = 0;

      Object.keys(newSensors).forEach((key) => {
        const sensor = newSensors[key];
        const distLat = sensor.lat - centerLat;
        const distLng = sensor.lng - centerLng;
        // Raw Euclidean distance
        const rawDistDeg = Math.sqrt(distLat * distLat + distLng * distLng);
        const rawDistKm = rawDistDeg * 111.32;
        
        // Expose rawDistKm for sorting later
        sensor.rawDistKm = rawDistKm;

        // Calculate Wind Reach in this direction (matching MapComponent stretch)
        const windStretchKm = 1.11; // Base 0.01 deg stretch in km
        const multi = (scenario === 'CATASTROPHIC' && !dronesDeployed) ? 3 : 1; // Match UI logic (1x during containment)
        
        let directionReachKm = spreadRadiusKm;
        
        const isUpwind = (state.windDirection === 'NW' && distLat > 0 && distLng < 0) ||
                         (state.windDirection === 'NE' && distLat > 0 && distLng > 0) ||
                         (state.windDirection === 'N' && distLat > 0);

        if (isUpwind) {
          directionReachKm += (windStretchKm * multi);
        }

        // Logic check:
        // Inside Spill = rawDistKm <= directionReachKm
        // Fringe Zone = rawDistKm <= directionReachKm + fringeRadiusKm

        if (rawDistKm <= directionReachKm) {
          // Inside the main (potentially stretched) spill zone
          if (newAIPredictions.spreadRadius > 0 || !dronesDeployed) {
            // Toxicity intensity is higher near the center
            const proximityFactor = 1 - (rawDistKm / Math.max(0.1, directionReachKm));
            const baseLeak = isCatastrophic ? 4 : 2;
            sensor.toxicityPpm += baseLeak + (proximityFactor * 3);
            sensor.pH = Math.max(isCatastrophic ? 4.0 : 6.5, sensor.pH - 0.1);
          }
        } else if (rawDistKm <= directionReachKm + fringeRadiusKm) {
          // Inside the "Fringe Zone" - trace amounts ahead of the spill
          // DISABLED during drone cleanup to prevent distractions
          if (!dronesDeployed) {
            sensor.toxicityPpm += 0.5; // low warning leak
            sensor.pH = Math.max(7.2, sensor.pH - 0.02);
          }
        } else {
          // Outside the zone, toxicity dissipates naturally
          sensor.toxicityPpm = Math.max(0, sensor.toxicityPpm - 1.5); // Natural hazard decay
          sensor.pH = Math.min(8.1, sensor.pH + 0.01);
        }

        // Update status thresholds - Unified logic for radius and assignment
        sensor.status = sensor.toxicityPpm > 80 ? 'DANGER' : (sensor.toxicityPpm > 10 ? 'WARN' : 'SAFE');
        
        // Track the farthest ACTIVE hazard for dynamic containment (ignore trace re-leakage)
        if (sensor.toxicityPpm > 10.0 && rawDistKm > currentFarthestToxicDistKm) {
          currentFarthestToxicDistKm = rawDistKm;
        }

        if (isCatastrophic && sensor.toxicityPpm >= 100 && state.timeElapsed % 5 === 0 && !dronesDeployed) {
          shouldLogCritical = true;
        }
      });

      // DYNAMIC CONTAINMENT: During cleanup, the range is defined by the farthest remaining SIGNIFICANT hazard
      if (dronesDeployed) {
        const targetRadiusMeters = Math.max(0, currentFarthestToxicDistKm * 1000);
        // During containment, the circle ONLY SHRINKS and follows the highest priority threats
        if (targetRadiusMeters < newAIPredictions.spreadRadius || newAIPredictions.spreadRadius === 0) {
          newAIPredictions.spreadRadius = targetRadiusMeters;
        }
      }
    }

    // Shipping Traffic Movement
    let newShips = [...ships].map(ship => {
      let updatedShip = { ...ship };
      if (updatedShip.status === 'REROUTING' && updatedShip.targetWaypoint) {
        const dx = updatedShip.targetWaypoint[1] - updatedShip.lng;
        const dy = updatedShip.targetWaypoint[0] - updatedShip.lat;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0.01) {
          const speed = 0.015; // Smooth incremental movement
          const moveStep = Math.min(speed, distance);
          updatedShip.lng += (dx / distance) * moveStep;
          updatedShip.lat += (dy / distance) * moveStep;
        } else {
          // Ship has reached its destination safe zone
          updatedShip.status = 'SAFE';
          updatedShip.targetWaypoint = null;
        }
      }
      return updatedShip;
    });

    // Swarm Logic: Simulate drone actions if deployed
    if (dronesDeployed) {
      const toxicBuoys = Object.values(newSensors)
        .filter(b => b.toxicityPpm > 10.0 || b.status === 'DANGER') // ONLY target real threats (ignore trace re-leakage)
        .sort((a, b) => (b.rawDistKm || 0) - (a.rawDistKm || 0)); // PRIORITY: Farthest first

      const isClean = newAIPredictions.spreadRadius <= 0 && toxicBuoys.length === 0;
      
      // Track which buoys are effectively "taken"
      // PRE-SCAN: Reserve all current targets from the state so nobody "steals" an active task
      let assignedBuoyIds = dronePositions
        .filter(d => d.targetBuoy && newSensors[Object.keys(newSensors).find(k => newSensors[k].id === d.targetBuoy)]?.toxicityPpm > 0.1)
        .map(d => d.targetBuoy);

      newDronePositions = newDronePositions.map((drone, idx) => {
        let updatedDrone = { ...drone };
        const dId = `Drone ${idx + 1}`;

        if (isClean) {
          updatedDrone.targetBuoy = null;
          const dx = updatedDrone.baseLng - updatedDrone.lng;
          const dy = updatedDrone.baseLat - updatedDrone.lat;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0.001) {
            const speed = 0.012;
            const moveStep = Math.min(speed, distance);
            updatedDrone.lng += (dx / distance) * moveStep;
            updatedDrone.lat += (dy / distance) * moveStep;
            updatedDrone.status = 'RETURNING';
          } else {
            updatedDrone.lng = updatedDrone.baseLng;
            updatedDrone.lat = updatedDrone.baseLat;
            updatedDrone.status = 'IDLE';
          }
        } else {
          // 1. Target Management: Stay on current target if it's still toxic
          let currentTarget = updatedDrone.targetBuoy ? Object.values(newSensors).find(b => b.id === updatedDrone.targetBuoy) : null;
          
          if (currentTarget && currentTarget.toxicityPpm <= 5.0) {
            get().addLog('MISSION_PURIFIED', `${dId} finalized cleanup at ${currentTarget.id}. Relocating...`);
            // Clear from reservation list so it's technically free (though it's clean anyway)
            assignedBuoyIds = assignedBuoyIds.filter(id => id !== updatedDrone.targetBuoy);
            updatedDrone.targetBuoy = null; // Mission complete
            currentTarget = null;
          }

          // 2. Assignment: If no target, pick the highest priority available buoy
          if (!updatedDrone.targetBuoy) {
            // Find buoys not already claimed in the pre-flight check or by previous drones this tick
            let availableBuoys = toxicBuoys.filter(b => !assignedBuoyIds.includes(b.id));
            if (availableBuoys.length > 0) {
              const bestTarget = availableBuoys[0]; // Farthest First
              updatedDrone.targetBuoy = bestTarget.id;
              currentTarget = bestTarget;
              assignedBuoyIds.push(bestTarget.id); // Reserve it immediately
              get().addLog('MISSION_START', `${dId} assigned to ${bestTarget.id} (Dist: ${bestTarget.rawDistKm.toFixed(1)}km)`);
            }
          }

          // Ensure current target is in the reservation list if it exists
          if (updatedDrone.targetBuoy && !assignedBuoyIds.includes(updatedDrone.targetBuoy)) {
            assignedBuoyIds.push(updatedDrone.targetBuoy);
          }

          // 3. Movement/Action
          if (currentTarget) {
            const dx = currentTarget.lng - updatedDrone.lng;
            const dy = currentTarget.lat - updatedDrone.lat;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0.002) {
              // En route to target (Move towards)
              const speed = 0.012;
              const moveStep = Math.min(speed, distance);
              updatedDrone.lng += (dx / distance) * moveStep;
              updatedDrone.lat += (dy / distance) * moveStep;
              updatedDrone.status = 'EN ROUTE';
            } else {
              // Reached target, snap to position and clean
              updatedDrone.status = 'CLEANING';
              updatedDrone.lng = currentTarget.lng;
              updatedDrone.lat = currentTarget.lat;
              
              const sensorKey = Object.keys(newSensors).find(k => newSensors[k].id === currentTarget.id);
              if (sensorKey) {
                // Sharpened high-performance purification
                const currentTox = newSensors[sensorKey].toxicityPpm;
                const newTox = Math.max(0, currentTox - 50);
                newSensors[sensorKey].toxicityPpm = newTox < 5.0 ? 0 : newTox; // Precision snap to mission boundary
                newSensors[sensorKey].pH = Math.min(8.1, newSensors[sensorKey].pH + 0.5);
                newSensors[sensorKey].status = newSensors[sensorKey].toxicityPpm > 80 ? 'DANGER' : (newSensors[sensorKey].toxicityPpm > 10 ? 'WARN' : 'SAFE');
              }
            }
          } else {
            // No work left? Return to base immediately
            const dx = updatedDrone.baseLng - updatedDrone.lng;
            const dy = updatedDrone.baseLat - updatedDrone.lat;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0.001) {
              const speed = 0.012;
              const moveStep = Math.min(speed, distance);
              updatedDrone.lng += (dx / distance) * moveStep;
              updatedDrone.lat += (dy / distance) * moveStep;
              updatedDrone.status = 'RETURNING';
            } else {
              updatedDrone.status = 'IDLE';
              updatedDrone.lng = updatedDrone.baseLng;
              updatedDrone.lat = updatedDrone.baseLat;
            }
          }
        }

        // Battery logic
        if (updatedDrone.status === 'CLEANING') {
          updatedDrone.battery = Math.max(0, updatedDrone.battery - 0.3);
        } else if (updatedDrone.status === 'EN ROUTE' || updatedDrone.status === 'RETURNING') {
          updatedDrone.battery = Math.max(0, updatedDrone.battery - 0.1);
        } else {
          updatedDrone.battery = Math.max(0, updatedDrone.battery - 0.02);
        }

        return updatedDrone;
      });
    }

    if (shouldLogCritical) {
      setTimeout(() => get().addLog('CRITICAL_HAZARD', 'Lethal toxicity levels detected! Imminent risk to marine life.'), 0);
    }

    let finalScenario = state.scenario;
    let finalDronesDeployed = state.dronesDeployed;
    if (state.dronesDeployed) {
      const allReturned = newDronePositions.every(d => d.status === 'IDLE');
      if (allReturned) {
        finalDronesDeployed = false;
        finalScenario = 'NORMAL';
        // Give them a tiny recharge just so they don't sit empty next time without resetting the scenario
        newDronePositions = newDronePositions.map(d => ({ ...d, battery: 100 }));
      }
    }

    let newSensorHistory = { ...sensorHistory };
    const currentTime = new Date().toLocaleTimeString();
    Object.keys(newSensors).forEach(key => {
      const historyArray = newSensorHistory[key] ? [...newSensorHistory[key]] : [];
      historyArray.push({
        time: currentTime,
        pH: newSensors[key].pH,
        toxicityPpm: newSensors[key].toxicityPpm
      });
      if (historyArray.length > 60) {
        historyArray.shift();
      }
      newSensorHistory[key] = historyArray;
    });

    return {
      timeElapsed: state.timeElapsed + 1,
      sensors: newSensors,
      aiPredictions: newAIPredictions,
      dronePositions: newDronePositions,
      dronesDeployed: finalDronesDeployed,
      scenario: finalScenario,
      sensorHistory: newSensorHistory,
      ships: newShips
    };
  })
}));
