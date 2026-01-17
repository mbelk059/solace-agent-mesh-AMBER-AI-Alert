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

export default function Home() {
  const [agents, setAgents] = useState<Record<string, AgentStatus>>({
    'Alert Receiver': { name: 'Alert Receiver', status: 'idle' },
    'AI Analyzer': { name: 'AI Analyzer', status: 'idle' },
    'Broadcast Agent': { name: 'Broadcast Agent', status: 'idle' },
    'Camera Agent': { name: 'Camera Agent', status: 'idle' },
    'Tip Processor': { name: 'Tip Processor', status: 'idle' },
    'Geo Intelligence': { name: 'Geo Intelligence', status: 'idle' },
  });

  const [events, setEvents] = useState<Event[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    // Connect to event stream
    console.log('Connecting to event stream...');
    const eventSource = new EventSource('/api/events');
    
    eventSource.onopen = () => {
      console.log('Event stream connected');
    };
    
    eventSource.onmessage = (e) => {
      try {
        // SSE format: "data: {...}\n\n"
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
      // Try to reconnect after a delay
      setTimeout(() => {
        eventSource.close();
        // The useEffect will recreate the connection
      }, 3000);
    };

    return () => {
      console.log('Closing event stream');
      eventSource.close();
    };
  }, []);

  const handleEvent = (event: Event) => {
    setEvents((prev) => [event, ...prev].slice(0, 100)); // Keep last 100 events

    // Update agent status based on event
    setAgents((prev) => {
      const updated = { ...prev };
      
      if (event.from && updated[event.from]) {
        // Determine status based on event type
        let newStatus: AgentStatus['status'] = 'processing';
        if (event.type.includes('error') || event.type.includes('failed')) {
          newStatus = 'error';
        } else if (event.type.includes('success') || event.type.includes('completed') || 
                   event.type.includes('initiated') || event.type.includes('created') ||
                   event.type.includes('assessed') || event.type.includes('received') ||
                   event.type.includes('resolved')) {
          newStatus = 'success';
        }
        
        updated[event.from] = {
          ...updated[event.from],
          status: newStatus,
          lastEvent: event.type,
          lastUpdate: Date.now(),
        };
      }

      // Special handling for resolution event - mark all agents as success
      if (event.type === 'alert_resolved') {
        Object.keys(updated).forEach((agentName) => {
          updated[agentName] = {
            ...updated[agentName],
            status: 'success',
            lastEvent: 'Alert Resolved',
            lastUpdate: Date.now(),
          };
        });
      }

      if (event.to && updated[event.to]) {
        updated[event.to] = {
          ...updated[event.to],
          status: 'processing',
          lastEvent: `Received: ${event.type}`,
          lastUpdate: Date.now(),
        };
      }

      return updated;
    });
  };

  const triggerAlert = async () => {
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
      
      setAgents((prev) => {
        const reset: Record<string, AgentStatus> = {};
        Object.keys(prev).forEach((key) => {
          reset[key] = { ...prev[key], status: 'idle', lastEvent: undefined };
        });
        return reset;
      });
      setEvents([]);
    } catch (error) {
      console.error('Error resetting:', error);
    }
  };

  return (
    <main style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#fff' }}>
          AMBER Alert Simulation
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>
          Event-driven multi-agent AI system demonstrating real-time coordination
        </p>
      </div>

      <Controls
        onTriggerAlert={triggerAlert}
        onSimulateFailure={simulateFailure}
        onReset={resetSimulation}
        isSimulating={isSimulating}
        agentNames={Object.keys(agents)}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '30px' }}>
        <AgentVisualization agents={agents} events={events.slice(0, 20)} />
        <EventTimeline events={events} />
      </div>
    </main>
  );
}
