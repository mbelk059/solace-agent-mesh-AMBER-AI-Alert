'use client';

import { useEffect, useState } from 'react';
import AgentVisualization from './components/AgentVisualization';
import EventTimeline from './components/EventTimeline';
import Controls from './components/Controls';

export interface AgentStatus {
  name: string;
  status: 'idle' | 'processing' | 'success' | 'error' | 'failed';
  lastEvent?: string;
  lastUpdate?: number;
}

export interface Event {
  id: string;
  timestamp: number;
  type: string;
  from: string;
  to?: string;
  data?: any;
  color: string;
}

interface AlertInstance {
  id: string;
  alertId: string;
  agents: Record<string, AgentStatus>;
  events: Event[];
  createdAt: number;
  resolvedAt?: number;
}

export default function Home() {
  const [alertInstances, setAlertInstances] = useState<AlertInstance[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const createNewInstance = (): AlertInstance => {
    const timestamp = Date.now();
    const alertId = `AMBER-CA-2026-001-${timestamp}`;
    
    return {
      id: `alert-${timestamp}-${Math.random()}`,
      alertId: alertId,
      createdAt: timestamp,
      agents: {
        'Alert Receiver': { name: 'Alert Receiver', status: 'idle' },
        'AI Analyzer': { name: 'AI Analyzer', status: 'idle' },
        'Broadcast Agent': { name: 'Broadcast Agent', status: 'idle' },
        'Camera Agent': { name: 'Camera Agent', status: 'idle' },
        'Tip Processor': { name: 'Tip Processor', status: 'idle' },
        'Geo Intelligence': { name: 'Geo Intelligence', status: 'idle' },
      },
      events: [],
    };
  };

  useEffect(() => {
    console.log('Connecting to event stream...');
    const eventSource = new EventSource('/api/events');
    
    eventSource.onopen = () => {
      console.log('Event stream connected');
    };
    
    eventSource.onmessage = (e) => {
      try {
        const data = e.data.trim();
        if (!data) return;
        
        const event = JSON.parse(data);
        console.log('[Frontend] Received event:', event.type, 'from:', event.from);
        handleEvent(event);
      } catch (error) {
        console.error('[Frontend] Error parsing event:', error, 'Raw data:', e.data);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Event stream error:', error);
      setTimeout(() => {
        eventSource.close();
      }, 3000);
    };

    return () => {
      console.log('Closing event stream');
      eventSource.close();
    };
  }, []);

  const handleEvent = (event: Event) => {
    setAlertInstances((prev) => {
      if (prev.length === 0) return prev;
      
      const updated = [...prev];
      const latestIndex = updated.length - 1;
      const latest = { ...updated[latestIndex] };
      
      latest.events = [event, ...latest.events].slice(0, 100);
      
      const updatedAgents = { ...latest.agents };
      
      if (event.from && updatedAgents[event.from]) {
        let newStatus: AgentStatus['status'] = 'processing';
        if (event.type.includes('error') || event.type.includes('failed')) {
          newStatus = 'error';
        } else if (event.type.includes('success') || event.type.includes('completed') || 
                   event.type.includes('initiated') || event.type.includes('created') ||
                   event.type.includes('assessed') || event.type.includes('received') ||
                   event.type.includes('resolved')) {
          newStatus = 'success';
        }
        
        updatedAgents[event.from] = {
          ...updatedAgents[event.from],
          status: newStatus,
          lastEvent: event.type,
          lastUpdate: Date.now(),
        };
      }

      if (event.type === 'alert_resolved') {
        latest.resolvedAt = Date.now();
        Object.keys(updatedAgents).forEach((agentName) => {
          updatedAgents[agentName] = {
            ...updatedAgents[agentName],
            status: 'success',
            lastEvent: 'Alert Resolved',
            lastUpdate: Date.now(),
          };
        });
      }

      if (event.to && updatedAgents[event.to]) {
        updatedAgents[event.to] = {
          ...updatedAgents[event.to],
          status: 'processing',
          lastEvent: `Received: ${event.type}`,
          lastUpdate: Date.now(),
        };
      }

      latest.agents = updatedAgents;
      updated[latestIndex] = latest;
      
      return updated;
    });
  };

  const triggerAlert = async () => {
    const newInstance = createNewInstance();
    setAlertInstances((prev) => [...prev, newInstance]);
    
    setIsSimulating(true);
    try {
      console.log('Triggering alert...');
      const response = await fetch('/api/trigger-alert', {
        method: 'POST',
      });
      const data = await response.json();
      console.log('Trigger alert response:', data);
      if (!response.ok) throw new Error(data.error || 'Failed to trigger alert');
    } catch (error) {
      console.error('Error triggering alert:', error);
      alert('Failed to trigger alert. Check console for details.');
    } finally {
      setTimeout(() => setIsSimulating(false), 1000);
    }
  };

  const simulateFailure = async (agentName: string) => {
    try {
      const response = await fetch('/api/simulate-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentName }),
      });
      if (!response.ok) throw new Error('Failed to simulate failure');
    } catch (error) {
      console.error('Error simulating failure:', error);
    }
  };

  const resetSimulation = async () => {
    try {
      const response = await fetch('/api/reset', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to reset');
      
      setAlertInstances([]);
    } catch (error) {
      console.error('Error resetting:', error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #05080a 0%, #0d1215 100%)',
        padding: '32px 40px',
      }}
    >
      {/* HEADER */}
      <header
        style={{
          marginBottom: '32px',
          borderBottom: '1px solid rgba(47, 227, 208, 0.15)',
          paddingBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #2fe3d0 0%, #a0d8f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AMBER Alert Simulation
          </h1>

          <div
            style={{
              padding: '10px 20px',
              background: isSimulating
                ? 'linear-gradient(135deg, rgba(47, 227, 208, 0.2) 0%, rgba(160, 216, 241, 0.15) 100%)'
                : 'rgba(255, 255, 255, 0.04)',
              border: isSimulating
                ? '1px solid rgba(47, 227, 208, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: isSimulating ? '#2fe3d0' : '#8fa8b5',
              boxShadow: isSimulating
                ? '0 0 20px rgba(47, 227, 208, 0.3)'
                : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {isSimulating ? 'System Active' : 'System Idle'}
          </div>
        </div>

        <p
          style={{
            color: '#8fa8b5',
            fontSize: '0.95rem',
            letterSpacing: '0.5px',
            lineHeight: '1.5',
          }}
        >
          Event-driven multi-agent AI system demonstrating real-time emergency coordination
        </p>
      </header>

      {/* CONTROLS */}
      <section style={{ marginBottom: '32px' }}>
        <Controls
          onTriggerAlert={triggerAlert}
          onSimulateFailure={simulateFailure}
          onReset={resetSimulation}
          isSimulating={isSimulating}
          agentNames={alertInstances.length > 0 ? Object.keys(alertInstances[0].agents) : []}
        />
      </section>

      {/* ALERT INSTANCES */}
      {alertInstances.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#6a7f8c',
            fontSize: '0.95rem',
            letterSpacing: '0.5px',
          }}
        >
          No active alerts. Click "Trigger AMBER Alert" to start a simulation.
        </div>
      ) : (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(900px, 1fr))',
            gap: '24px',
          }}
        >
          {alertInstances.map((instance) => (
            <div
              key={instance.id}
              style={{
                background: 'linear-gradient(145deg, #0a0e10 0%, #121619 100%)',
                border: '1px solid rgba(47, 227, 208, 0.2)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              }}
            >
              {/* ALERT HEADER */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid rgba(47, 227, 208, 0.15)',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: '#e8f4f8',
                      letterSpacing: '0.8px',
                      marginBottom: '6px',
                    }}
                  >
                    {instance.alertId}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#6a7f8c', letterSpacing: '0.3px' }}>
                    Created: {formatTimestamp(instance.createdAt)}
                    {instance.resolvedAt && (
                      <span style={{ marginLeft: '16px' }}>
                        Resolved: {formatTimestamp(instance.resolvedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {instance.resolvedAt && (
                  <div
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(0, 255, 0, 0.15)',
                      border: '1px solid rgba(0, 255, 0, 0.4)',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      color: '#00ff00',
                    }}
                  >
                    Resolved
                  </div>
                )}
              </div>

              {/* AGENT NETWORK AND EVENT TIMELINE SIDE BY SIDE */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                }}
              >
                <AgentVisualization
                  agents={instance.agents}
                  events={instance.events.slice(0, 20)}
                />
                <EventTimeline events={instance.events} />
              </div>

              {/* FOOTER */}
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(47, 227, 208, 0.15)',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: '#6a7f8c',
                  letterSpacing: '0.5px',
                }}
              >
                {instance.events.length} events tracked
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}