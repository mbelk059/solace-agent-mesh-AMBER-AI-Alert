'use client';

interface ControlsProps {
  onTriggerAlert: () => void;
  onSimulateFailure: (agent: string) => void;
  onReset: () => void;
  isSimulating: boolean;
  agentNames: string[];
}

export default function Controls({
  onTriggerAlert,
  onSimulateFailure,
  onReset,
  isSimulating,
  agentNames,
}: ControlsProps) {
  return (
    <div
      style={{
        background: '#1a1a1a',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
      }}
    >
      <h2 style={{ marginBottom: '15px', fontSize: '1.2rem' }}>Simulation Controls</h2>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={onTriggerAlert}
          disabled={isSimulating}
          style={{
            padding: '12px 24px',
            background: isSimulating ? '#444' : '#00aaff',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: isSimulating ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'background 0.2s',
          }}
        >
          {isSimulating ? 'Simulating...' : '🚨 Trigger AMBER Alert'}
        </button>

        <button
          onClick={onReset}
          style={{
            padding: '12px 24px',
            background: '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Reset Simulation
        </button>

        <div style={{ marginLeft: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ color: '#888' }}>Simulate Failure:</span>
          {agentNames.map((name) => (
            <button
              key={name}
              onClick={() => onSimulateFailure(name)}
              style={{
                padding: '8px 16px',
                background: '#cc0000',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
