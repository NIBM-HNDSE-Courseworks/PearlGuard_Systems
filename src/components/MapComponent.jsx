import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { useSimulation } from '../store/useSimulation';

// Custom Icons
const createBuoyIcon = (status) => {
  const color = status === 'SAFE' ? '#10b981' : (status === 'WARN' ? '#f59e0b' : '#ef4444');
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 10px ${color}; border: 2px solid white;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const droneIcon = L.divIcon({
  className: 'custom-drone-icon',
  html: `
    <div class="drone-marker">
      <div class="drone-pulse"></div>
      <div class="drone-radar"></div>
      <div class="drone-core"></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const getPolygonCoords = (center, radiusKm, windDirection, stretchFactor = 1) => {
  if (radiusKm === 0) return [];
  // Very simplified polygon generator shifting coordinate based on wind
  const latRadian = radiusKm / 111.32;
  const lngRadian = radiusKm / (111.32 * Math.cos(center[0] * Math.PI / 180));
  
  let dx = 0; let dy = 0;
  if (windDirection === 'NW') { dx = -0.01; dy = 0.01; }
  else if (windDirection === 'N') { dy = 0.01; }
  else if (windDirection === 'NE') { dx = 0.01; dy = 0.01; }

  const coords = [];
  const points = 16;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * (2 * Math.PI);
    let shiftY = Math.sin(angle) * latRadian;
    let shiftX = Math.cos(angle) * lngRadian;
    
    // Stretch in wind direction
    if ((windDirection === 'NW' && i > 4 && i < 12) || 
        (windDirection === 'NE' && i > 0 && i < 8)) {
        shiftX += dx * stretchFactor;
        shiftY += dy * stretchFactor;
    }
    
    coords.push([center[0] + shiftY, center[1] + shiftX]);
  }
  return coords;
};

export default function MapComponent() {
  const sensors = useSimulation(state => state.sensors);
  const aiPredictions = useSimulation(state => state.aiPredictions);
  const dronesDeployed = useSimulation(state => state.dronesDeployed);
  const dronePositions = useSimulation(state => state.dronePositions);
  const windDirection = useSimulation(state => state.windDirection);
  
  const center = [6.95, 79.82]; // Colombo coast

  // Calculate polygon based on state
  const spreadPolygon = getPolygonCoords(aiPredictions.spreadCenter, aiPredictions.spreadRadius / 1000, windDirection, aiPredictions.threatLevel === 'CRITICAL' ? 3 : 1);

  return (
    <div className={`map-container ${aiPredictions.threatLevel === 'CRITICAL' ? 'danger-glow' : ''}`}>
      <MapContainer center={center} zoom={11} zoomControl={false} style={{ height: '100%', width: '100%', background: '#020617' }}>
        <TileLayer
          attribution='&copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Render Sensors */}
        {Object.values(sensors).map(sensor => (
          <Marker 
            key={sensor.id} 
            position={[sensor.lat, sensor.lng]}
            icon={createBuoyIcon(sensor.status)}
          >
            <Popup className="glass-panel">
              <div style={{ color: 'black', fontWeight: 'bold' }}>
                <p>Buoy ID: {sensor.id}</p>
                <p>Status: <span style={{ color: sensor.status === 'SAFE' ? 'green' : 'red' }}>{sensor.status}</span></p>
                <p>Toxicity: {sensor.toxicityPpm.toFixed(1)} ppm</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* AI Spread Polygon */}
        {spreadPolygon.length > 0 && (
          <Polygon 
            positions={spreadPolygon} 
            pathOptions={{ 
              color: aiPredictions.threatLevel === 'CONTAINING' ? '#06b6d4' : (aiPredictions.threatLevel === 'CRITICAL' ? '#ef4444' : '#f59e0b'),
              fillOpacity: 0.3,
              weight: 2
            }} 
          />
        )}

        {/* Drones */}
        {dronesDeployed && dronePositions.map((drone) => (
          <Marker key={drone.id} position={[drone.lat, drone.lng]} icon={droneIcon} />
        ))}
      </MapContainer>
    </div>
  );
}
