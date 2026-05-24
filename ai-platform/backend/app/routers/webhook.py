from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from app.core.connection_manager import manager
from app.core.conversation_store import conversation_store
from app.agents.scenario_engine import run_scenario
from app.scenarios import SCENARIOS
from app.core.logger import get_logger

logger = get_logger("webhook")
router = APIRouter()

class AlertPayload(BaseModel):
    severity: str
    source: str
    service: str
    message: str
    metadata: dict = {}

class ScenarioRequest(BaseModel):
    scenario_id: str

@router.post("/webhook")
async def receive_alert(payload: AlertPayload):
    logger.warning("webhook", f"ALERT | {payload.severity} | {payload.source} | {payload.service}")
    await manager.broadcast({
        "type": "alert",
        "severity": payload.severity,
        "source": payload.source,
        "service": payload.service,
        "message": payload.message,
        "metadata": payload.metadata,
        "channelId": "general",
    })
    return {"status": "ok", "connections": len(manager.active_connections)}

@router.post("/scenario/start")
async def start_scenario(req: ScenarioRequest, background_tasks: BackgroundTasks):
    if req.scenario_id not in SCENARIOS:
        return {"status": "error", "message": f"Script not found: {req.scenario_id}"}
    logger.info("webhook", f"The scenario is starting: {req.scenario_id}")
    background_tasks.add_task(run_scenario, req.scenario_id)
    return {"status": "ok", "scenario_id": req.scenario_id}

@router.get("/scenario/list")
async def list_scenarios():
    return {
        "scenarios": [
            {
                "id": s.id,
                "title": s.title,
                "severity": s.severity,
                "affected_service": s.affected_service,
                "tags": s.tags,
            }
            for s in SCENARIOS.values()
        ]
    }
