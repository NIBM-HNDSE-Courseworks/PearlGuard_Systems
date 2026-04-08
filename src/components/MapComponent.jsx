import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useSimulation } from '../store/useSimulation';
import { useMap } from 'react-leaflet';

// Internal component to handle zoom-responsive density
function ZoomHandler({ onZoomChange }) {
  const map = useMap();
  React.useEffect(() => {
    onZoomChange(map.getZoom());
    const handleZoom = () => onZoomChange(map.getZoom());
    map.on('zoomend', handleZoom);
    return () => map.off('zoomend', handleZoom);
  }, [map, onZoomChange]);
  return null;
}

// Custom Icons
const createBuoyIcon = (status) => {
  const color = status === 'SAFE' ? '#10b981' : (status === 'WARN' ? '#f59e0b' : '#ef4444');
  return L.divIcon({
    className: 'custom-buoy-icon',
    html: `
      <div style="color: ${color}; filter: drop-shadow(0px 0px 4px ${color}); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L10 6H14L12 2Z" />
          <rect x="11" y="6" width="2" height="4" />
          <path d="M7 10C7 8.89543 7.89543 8 9 8H15C16.1046 8 17 8.89543 17 10V14C17 15.1046 16.1046 16 15 16H9C7.89543 16 7 15.1046 7 14V10Z" />
          <path d="M5 16H19L21 21H3L5 16Z" fill-opacity="0.4"/>
          <path d="M2 21.5C3.5 21.5 4.5 20.5 6 20.5C7.5 20.5 8.5 21.5 10 21.5C11.5 21.5 12.5 20.5 14 20.5C15.5 20.5 16.5 21.5 18 21.5C19.5 21.5 20.5 20.5 22 20.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const createDroneIcon = (status) => {
  const color = status === 'CLEANING' ? '#10b981' : '#06b6d4';
  const pulseClass = status === 'CLEANING' ? 'drone-docked' : 'drone-flying';
  return L.divIcon({
    className: `custom-drone-icon ${pulseClass}`,
    html: `
      <div style="color: ${color}; filter: drop-shadow(0px 0px 6px ${color}); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="6" height="6" rx="2" fill="currentColor" fill-opacity="0.3" />
          <line x1="5" y1="5" x2="10" y2="10" />
          <line x1="19" y1="5" x2="14" y2="10" />
          <line x1="5" y1="19" x2="10" y2="14" />
          <line x1="19" y1="19" x2="14" y2="14" />
          <circle cx="4" cy="4" r="3" stroke-dasharray="2 4" class="drone-propeller" />
          <circle cx="20" cy="4" r="3" stroke-dasharray="2 4" class="drone-propeller" />
          <circle cx="4" cy="20" r="3" stroke-dasharray="2 4" class="drone-propeller" />
          <circle cx="20" cy="20" r="3" stroke-dasharray="2 4" class="drone-propeller" />
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
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
      <div class="${glowClass}" style="color: ${color}; background-color: rgba(2, 6, 23, 0.8); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid ${color};">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <!-- Shipwreck / Sinking Cargo -->
          <g transform="rotate(-15 12 12)">
             <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" fill="currentColor" fill-opacity="0.2"/>
             <line x1="9" y1="5" x2="9" y2="2" />
             <line x1="15" y1="5" x2="15" y2="2" />
             <!-- Hazard 'X' marks the spot -->
             <line x1="10" y1="9" x2="14" y2="13" stroke="currentColor"/>
             <line x1="14" y1="9" x2="10" y2="13" stroke="currentColor"/>
          </g>
          <!-- Waves covering ship bottom -->
          <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" fill="rgba(2, 6, 23, 0.9)" stroke="none" />
          <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" />
          <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        </svg>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
};

const createWindIcon = (rotation) => {
  return L.divIcon({
    className: 'wind-vector-marker',
    html: `
      <div style="transform: rotate(${rotation}deg); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
        <svg class="wind-icon-svg" width="40" height="70" viewBox="0 0 40 70" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20,65 Q25,35 20,5" class="wind-line-main" />
          <polyline points="14,12 20,5 26,12" class="wind-line-main" />
          <path d="M8,55 Q12,30 8,15" class="wind-line-side" />
          <path d="M32,58 Q36,33 32,18" class="wind-line-side" />
        </svg>
      </div>
    `,
    iconSize: [40, 70],
    iconAnchor: [20, 35]
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

  const [currentZoom, setCurrentZoom] = useState(11);

  const center = [6.95, 79.82]; 

  const spreadPolygon = getPolygonCoords(
    aiPredictions.spreadCenter, 
    aiPredictions.spreadRadius / 1000, 
    windDirection, 
    aiPredictions.threatLevel === 'CRITICAL' ? 3 : 1
  );

  const windRotation = getWindRotation(windDirection);

  // Dynamic Wind Density based on zoom
  const filteredWindGrid = WIND_GRID.filter((_, idx) => {
    if (currentZoom >= 13) return true; // Show all
    if (currentZoom >= 11) return idx % 2 === 0; // Show half
    return idx % 4 === 0; // Sparse
  });

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
        <ZoomHandler onZoomChange={setCurrentZoom} />
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
              dashArray: '10, 15', 
              opacity: 0.6,
              className: 'shipping-lane-animated'
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
                weight: 2,
                className: 'marine-reserve-zone'
              }}
            />
            <Marker 
              position={reserve.center} 
              icon={L.divIcon({ 
                className: 'reserve-label', 
                html: `<div class="reserve-tag">${reserve.name}</div>`, 
                iconSize: [200, 40], 
                iconAnchor: [100, 20] 
              })} 
            />
          </React.Fragment>
        ))}

        {/* Wind Vectors */}
        {showWind && filteredWindGrid.map((pos, idx) => (
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
