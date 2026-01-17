import logging
import json
from typing import Any, Dict, Optional

log = logging.getLogger(__name__)

async def publish_alert(
    tool_context: Optional[Any] = None,
    tool_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Load and publish an AMBER alert to the event mesh."""
    log_id = "[AlertIntake:publish_alert]"
    log.debug(f"{log_id} Starting")
    
    try:
        data_file = tool_config.get("data_file") if tool_config else "data/amber_alert.json"
        with open(data_file, 'r') as f:
            alert = json.load(f)
        
        log.info(f"{log_id} Loaded alert {alert.get('alert_id')}")
        
        return {
            "status": "success",
            "alert": alert,
            "message": f"Published alert {alert.get('alert_id')} to topic alert/received"
        }
    except Exception as e:
        log.error(f"{log_id} Failed: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}


async def resolve_alert(
    alert_id: str = "AMBER-CA-2026-001",
    tool_context: Optional[Any] = None,
    tool_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Publish alert resolution to the event mesh."""
    log_id = f"[AlertIntake:resolve_alert:{alert_id}]"
    log.debug(f"{log_id} Starting")
    
    try:
        resolutions_file = tool_config.get("resolutions_file") if tool_config else "data/resolutions.json"
        with open(resolutions_file, 'r') as f:
            data = json.load(f)
        
        resolution = next((r for r in data["resolutions"] if r["alert_id"] == alert_id), None)
        if not resolution:
            return {"status": "error", "message": f"Resolution for {alert_id} not found"}
        
        log.info(f"{log_id} Resolved alert {alert_id}")
        
        return {
            "status": "success",
            "resolution": resolution,
            "message": f"Alert {alert_id} resolved: {resolution.get('resolution_details', {}).get('child_status')}"
        }
    except Exception as e:
        log.error(f"{log_id} Failed: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}