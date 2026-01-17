'use client';

import { AgentStatus, Event } from '../page';

interface AgentVisualizationProps {
  agents: Record<string, AgentStatus>;
  events: Event[];
}

const statusColors: Record<string, string> = {
  idle: '#444',
  processing: '#ffa500',
  success: '#00ff00',
  error: '#ff4444',
  failed: '#cc0000',
};

const statusLabels: Record<string, string> = {
  idle: 'Idle',
  processing: 'Processing',
  success: 'Success',
  error: 'Error',
  failed: 'Failed',
};

export default function AgentVisualization({ agents, events }: AgentVisualizationProps) {
  const agentNames = Object.keys(agents);

  // Calculate connections between agents based on recent events
  const connections: Array<{ from: string; to: string; event: Event }> = [];
  events.forEach((event) => {
    if (event.from && event.to) {
      connections.push({ from: event.from, to: event.to, event });
    }
  });

  return (
    <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>Agent Network</h2>
      
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          position: 'relative',
          minHeight: '500px',
        }}
      >
        {/* SVG overlay for connections */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {connections.slice(0, 10).map((conn, idx) => {
            const fromIdx = agentNames.indexOf(conn.from);
            const toIdx = agentNames.indexOf(conn.to);
            if (fromIdx === -1 || toIdx === -1) return null;

            const fromCol = fromIdx % 3;
            const fromRow = Math.floor(fromIdx / 3);
            const toCol = toIdx % 3;
            const toRow = Math.floor(toIdx / 3);

            const x1 = (fromCol + 0.5) * (100 / 3);
            const y1 = (fromRow + 0.5) * (100 / Math.ceil(agentNames.length / 3));
            const x2 = (toCol + 0.5) * (100 / 3);
            const y2 = (toRow + 0.5) * (100 / Math.ceil(agentNames.length / 3));

            return (
              <line
                key={idx}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke={conn.event.color || '#666'}
                strokeWidth="2"
                opacity="0.4"
                strokeDasharray={conn.event.type.includes('error') ? '5,5' : 'none'}
              />
            );
          })}
        </svg>

        {/* Agent boxes */}
        {agentNames.map((name, idx) => {
          const agent = agents[name];
          const statusColor = statusColors[agent.status] || statusColors.idle;
          const col = idx % 3;
          const row = Math.floor(idx / 3);

          return (
            <div
              key={name}
              style={{
                position: 'relative',
                zIndex: 2,
                gridColumn: col + 1,
                gridRow: row + 1,
              }}
            >
              <div
                style={{
                  background: '#2a2a2a',
                  border: `3px solid ${statusColor}`,
                  borderRadius: '8px',
                  padding: '15px',
                  minHeight: '120px',
                  transition: 'all 0.3s ease',
                  boxShadow: agent.status === 'processing' ? `0 0 20px ${statusColor}40` : 'none',
                  animation: agent.status === 'processing' ? 'pulse 2s infinite' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: statusColor,
                      marginRight: '8px',
                      boxShadow: `0 0 8px ${statusColor}`,
                    }}
                  />
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{name}</h3>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '5px' }}>
                  {statusLabels[agent.status]}
                </div>
                {agent.lastEvent && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#888',
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid #333',
                    }}
                  >
                    {agent.lastEvent}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
