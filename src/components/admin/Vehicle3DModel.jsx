const TRUCK_GLB = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb';

export default function Vehicle3DModel() {
  return (
    <div className="glass-card mb-4 overflow-hidden flex items-center justify-center">
      <div className="truck-3d-bob w-full" style={{ maxWidth: 460, height: 300 }}>
        <model-viewer
          src={TRUCK_GLB}
          alt="3D truck model"
          auto-rotate
          rotation-per-second="30deg"
          shadow-intensity="1"
          exposure="1.2"
          camera-controls
          camera-orbit="0deg 80deg 0.5m"
          min-camera-orbit="auto 0deg auto"
          max-camera-orbit="auto 90deg auto"
          interaction-prompt="auto"
          style={{ width: '100%', height: '100%', backgroundColor: 'transparent', background: 'transparent' }}
        />
      </div>
    </div>
  );
}