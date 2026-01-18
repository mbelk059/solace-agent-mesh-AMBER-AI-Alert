'use client';

import { Event } from '../page';

interface EventTimelineProps {
  events: Event[];
}

export default function EventTimeline({ events }: EventTimelineProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatEventData = (event: Event): string => {
    if (!event.data) return '';

    const data = event.data;

    switch (event.type) {
      case 'alert_reported':
        return `Alert ID: ${data.alert_id || data.original_alert_id || 'Unknown'}`;

      case 'alert_assessed':
        const parts = [];
        if (data.priority) parts.push(`Priority: ${data.priority}`);
        if (data.urgency) parts.push(`Urgency: ${data.urgency}`);
        if (data.child_name) parts.push(`Child: ${data.child_name}`);
        if (data.location) parts.push(`Location: ${data.location}`);
        if (data.vehicle) parts.push(`Vehicle: ${data.vehicle}`);
        return parts.join(' • ') || 'Assessment completed';

      case 'broadcast_initiated':
        const channelList = Array.isArray(data.channels) 
          ? data.channels.join(', ') 
          : data.channels || 'Unknown channels';
        const childInfo = data.child_name ? ` for ${data.child_name}` : '';
        return `Broadcasting to: ${channelList}${childInfo}`;

      case 'geofence_created':
        const zones = Array.isArray(data.zones) 
          ? data.zones.join(', ') 
          : data.zones || 'Unknown zones';
        const center = data.center_location || data.coordinates?.lat 
          ? ` around ${data.center_location || `${data.coordinates.lat}, ${data.coordinates.lon}`}`
          : '';
        return `Created zones: ${zones}${center}`;

      case 'camera_scanning':
        const status = data.status || 'scanning';
        const cameras = data.cameras ? `${data.cameras} cameras` : '';
        const vehicle = data.target_vehicle ? ` for ${data.target_vehicle}` : '';
        const area = data.search_area ? ` in ${data.search_area}` : '';
        return `${status.charAt(0).toUpperCase() + status.slice(1)}${cameras ? ` with ${cameras}` : ''}${vehicle}${area}`;

      case 'tip_received':
        const tipParts = [];
        if (data.tip_id) tipParts.push(`Tip ID: ${data.tip_id}`);
        if (data.confidence) tipParts.push(`Confidence: ${data.confidence}`);
        if (data.child_name) tipParts.push(`Child: ${data.child_name}`);
        if (data.location) tipParts.push(`Location: ${data.location}`);
        if (data.vehicle_match) tipParts.push(`Vehicle: ${data.vehicle_match}`);
        return tipParts.join(' • ') || 'Tip received';

      case 'alert_resolved':
        const resolutionParts = [];
        if (data.resolution_type) {
          const resolutionType = data.resolution_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          resolutionParts.push(`Resolution: ${resolutionType}`);
        }
        if (data.child_status) {
          const childStatus = data.child_status.length > 60 
            ? data.child_status.substring(0, 60) + '...' 
            : data.child_status;
          resolutionParts.push(`Child: ${childStatus}`);
        }
        if (data.suspect_status) {
          resolutionParts.push(`Suspect: ${data.suspect_status}`);
        }
        if (data.total_duration) {
          resolutionParts.push(`Duration: ${data.total_duration}`);
        }
        if (data.location) {
          resolutionParts.push(`Location: ${data.location}`);
        }
        return resolutionParts.join(' • ') || 'Alert resolved';

      case 'tip_processed':
        const processedParts = [];
        if (data.tip_id) processedParts.push(`Tip ID: ${data.tip_id}`);
        if (data.confidence !== undefined) processedParts.push(`Confidence: ${data.confidence}%`);
        return processedParts.join(' • ') || 'Tip processed';

      case 'suspect_detected':
        const detectionParts = [];
        if (data.zone) detectionParts.push(`Zone: ${data.zone}`);
        if (data.confidence !== undefined) detectionParts.push(`Confidence: ${data.confidence}%`);
        if (data.timestamp) {
          const time = new Date(data.timestamp).toLocaleTimeString();
          detectionParts.push(`Time: ${time}`);
        }
        return detectionParts.join(' • ') || 'Suspect detected';

      case 'camera_scan_complete':
        const scanParts = [];
        if (data.zones_scanned) scanParts.push(`Zones: ${data.zones_scanned}`);
        if (data.cameras_active) scanParts.push(`Cameras: ${data.cameras_active}`);
        if (data.detection !== undefined) {
          scanParts.push(`Detection: ${data.detection ? 'Yes' : 'No'}`);
        }
        return scanParts.join(' • ') || 'Scan complete';

      case 'agent_failed':
        const failureParts = [];
        if (data.reason) failureParts.push(data.reason);
        if (data.agent) failureParts.push(`Agent: ${data.agent}`);
        return failureParts.join(' • ') || 'Agent failure detected';

      case 'agent_recovered':
        const recoveryParts = [];
        if (data.agent) recoveryParts.push(`Agent: ${data.agent}`);
        if (data.recovery_time) recoveryParts.push(`Recovery time: ${data.recovery_time}`);
        return recoveryParts.join(' • ') || 'Agent recovered';

      default:
        // For unknown event types, try to format common fields
        const defaultParts = [];
        if (data.status) defaultParts.push(`Status: ${data.status}`);
        if (data.message) defaultParts.push(data.message);
        if (data.error) defaultParts.push(`Error: ${data.error}`);
        if (defaultParts.length === 0 && typeof data === 'object') {
          // Last resort: show first few key-value pairs
          const entries = Object.entries(data).slice(0, 3);
          return entries.map(([key, value]) => {
            const val = typeof value === 'string' && value.length > 30 
              ? value.substring(0, 30) + '...' 
              : String(value);
            return `${key}: ${val}`;
          }).join(' • ');
        }
        return defaultParts.join(' • ') || '';
    }
  };

  return (
    <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '20px', maxHeight: '600px', overflowY: 'auto' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>Event Timeline</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {events.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            No events yet. Trigger an alert to start the simulation.
          </div>
        ) : (
          events.map((event, idx) => (
            <div
              key={`${event.id}-${event.timestamp}-${idx}`}
              style={{
                background: '#2a2a2a',
                borderLeft: `4px solid ${event.color}`,
                padding: '12px',
                borderRadius: '4px',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontWeight: 'bold', color: event.color }}>
                  {event.type}
                </span>
                <span style={{ color: '#888', fontSize: '0.75rem' }}>
                  {formatTime(event.timestamp)}
                </span>
              </div>
              <div style={{ color: '#aaa', fontSize: '0.8rem' }}>
                {event.from && <span>From: {event.from}</span>}
                {event.to && <span style={{ marginLeft: '10px' }}>→ {event.to}</span>}
              </div>
              {event.data && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    background: '#1a1a1a',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    color: '#ccc',
                    lineHeight: '1.4',
                  }}
                >
                  {formatEventData(event) || 'No details available'}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
