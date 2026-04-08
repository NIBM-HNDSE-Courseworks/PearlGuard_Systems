import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Polyline } from 'react-leaflet';
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

const createDroneIcon = (status) => {
  return L.divIcon({
    className: `custom-drone-icon ${status === 'CLEANING' ? 'drone-docked' : ''}`,
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
};

const createOriginIcon = (threatLevel) => {
  const isActive = threatLevel === 'CRITICAL' || threatLevel === 'MEDIUM';
  const isContaining = threatLevel === 'CONTAINING';
  const color = isActive ? '#ef4444' : (isContaining ? '#06b6d4' : '#64748b');
  const glowClass = isActive ? 'emergency-glow' : '';
  
  return L.divIcon({
    className: 'custom-origin-icon',
    html: `
      <div class="${glowClass}" style="background-color: #020617; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid ${color}; cursor: pointer;">
        <span style="font-size: 18px;">☣️</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

const createWindIcon = (rotation) => {
  return L.divIcon({
    className: 'wind-vector-marker',
    html: `<div style="transform: rotate(${rotation}deg); font-size: 20px;">↑</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Simulated GIS Data
const SHIPPING_LANES = [
  [[6.85, 79.6], [7.15, 80.0]],
  [[6.75, 79.7], [7.2, 79.95]],
  [[6.9, 79.5], [6.95, 80.1]]
];

const MARINE_RESERVES = [
  { center: [7.08, 79.88], radius: 2500, name: "Negombo Marine Sanctuary" },
  { center: [6.82, 79.72], radius: 1800, name: "Panadura Reserve" }
];

// Wind Grid Generation
const WIND_GRID = [];
for (let lat = 6.8; lat <= 7.2; lat += 0.08) {
  for (let lng = 79.6; lng <= 80.1; lng += 0.08) {
    WIND_GRID.push([lat, lng]);
  }
}

const getPolygonCoords = (center, radiusKm, windDirection, stretchFactor = 1) => {
  if (radiusKm === 0) return [];
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
    
    if ((windDirection === 'NW' && i > 4 && i < 12) || 
        (windDirection === 'NE' && i > 0 && i < 8)) {
        shiftX += dx * stretchFactor;
        shiftY += dy * stretchFactor;
    }
    
    coords.push([center[0] + shiftY, center[1] + shiftX]);
  }
  return coords;
};

const getWindRotation = (dir) => {
  const mapping = { 'N': 0, 'NE': 45, 'E': 90, 'SE': 135, 'S': 180, 'SW': 225, 'W': 270, 'NW': 315 };
  return mapping[dir] || 0;
};

export default function MapComponent() {
  const sensors = useSimulation(state => state.sensors);
  const aiPredictions = useSimulation(state => state.aiPredictions);
  const dronePositions = useSimulation(state => state.dronePositions);
  const windDirection = useSimulation(state => state.windDirection);
  
  // Layer Visibility State
  const [showWind, setShowWind] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [showReserves, setShowReserves] = useState(true); // Default active for eco-safety

  const center = [6.95, 79.82]; 

  const spreadPolygon = getPolygonCoords(
    aiPredictions.spreadCenter, 
    aiPredictions.spreadRadius / 1000, 
    windDirection, 
    aiPredictions.threatLevel === 'CRITICAL' ? 3 : 1
  );

  const windRotation = getWindRotation(windDirection);

  return (
    <div className={`map-container ${aiPredictions.threatLevel === 'CRITICAL' ? 'danger-glow' : ''}`}>
      {/* Floating GIS Layer Control */}
      <div className="gis-control-panel glass-panel">
        <div className="gis-control-header">GIS Layer Control</div>
        
        <label className="gis-toggle-item">
          <span>Wind Vectors</span>
          <input 
            type="checkbox" 
            className="gis-checkbox" 
            checked={showWind} 
            onChange={(e) => setShowWind(e.target.checked)} 
          />
        </label>

        <label className="gis-toggle-item">
          <span>Shipping Lanes</span>
          <input 
            type="checkbox" 
            className="gis-checkbox" 
            checked={showShipping} 
            onChange={(e) => setShowShipping(e.target.checked)} 
          />
        </label>

        <label className="gis-toggle-item">
          <span>Marine Reserves</span>
          <input 
            type="checkbox" 
            className="gis-checkbox" 
            checked={showReserves} 
            onChange={(e) => setShowReserves(e.target.checked)} 
          />
        </label>
      </div>

      <MapContainer center={center} zoom={11} zoomControl={false} style={{ height: '100%', width: '100%', background: '#020617' }}>
        <TileLayer
          attribution='&copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Shipping Lanes */}
        {showShipping && SHIPPING_LANES.map((lane, idx) => (
          <Polyline 
            key={`lane-${idx}`}
            positions={lane}
            pathOptions={{ 
              color: '#94a3b8', 
              weight: 2, 
              dashArray: '10, 10', 
              opacity: 0.6 
            }}
          />
        ))}

        {/* Marine Reserves */}
        {showReserves && MARINE_RESERVES.map((reserve, idx) => (
          <React.Fragment key={`reserve-${idx}`}>
            <Circle 
              center={reserve.center}
              radius={reserve.radius}
              pathOptions={{ 
                color: '#10b981', 
                fillColor: '#10b981', 
                fillOpacity: 0.15, 
                weight: 1 
              }}
            />
            <Marker position={reserve.center} icon={L.divIcon({ className: 'reserve-label', html: `<div style="color: #10b981; font-weight: bold; font-size: 10px; white-space: nowrap;">${reserve.name}</div>`, iconSize: [100, 20], iconAnchor: [50, 0] })} />
          </React.Fragment>
        ))}

        {/* Wind Vectors */}
        {showWind && WIND_GRID.map((pos, idx) => (
          <Marker key={`wind-${idx}`} position={pos} icon={createWindIcon(windRotation)} interactive={false} />
        ))}
        
        {/* Origin Marker */}
        {aiPredictions.threatLevel !== 'LOW' && (
          <Marker 
            position={aiPredictions.spreadCenter} 
            icon={createOriginIcon(aiPredictions.threatLevel)}
          >
            <Popup className="glass-panel">
              <div style={{ color: 'black', fontWeight: 'bold' }}>
                <p style={{ fontSize: '16px', marginBottom: '4px', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
                  <span role="img" aria-label="biohazard">☣️</span> Hazard Origin
                </p>
                <p>Threat Level: <span style={{ color: aiPredictions.threatLevel === 'CRITICAL' ? 'red' : (aiPredictions.threatLevel === 'CONTAINING' ? 'blue' : 'gray') }}>{aiPredictions.threatLevel}</span></p>
                <p>Source Radius: {(aiPredictions.spreadRadius / 1000).toFixed(2)} km</p>
                <p>Coordinates: {aiPredictions.spreadCenter[0]}, {aiPredictions.spreadCenter[1]}</p>
              </div>
            </Popup>
          </Marker>
        )}

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
                <p>Status: <span style={{ color: sensor.status === 'SAFE' ? 'green' : (sensor.status === 'DANGER' ? 'red' : 'orange') }}>{sensor.status}</span></p>
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
        {dronePositions.map((drone) => (
          <Marker key={drone.id} position={[drone.lat, drone.lng]} icon={createDroneIcon(drone.status)} />
        ))}
      </MapContainer>
    </div>
  );
}
