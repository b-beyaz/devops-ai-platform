import asyncio
from app.core.connection_manager import manager
from app.core.conversation_store import conversation_store
from app.agents.agent_service import get_agent_response
from app.agents.roles import TEAM
from app.scenarios import SCENARIOS
from app.scenarios.base import Scenario
from app.core.logger import get_logger

logger = get_logger("scenario_engine")

async def run_scenario(scenario_id: str):
    if scenario_id not in SCENARIOS:
        logger.error("scenario_engine", f"Script not found: {scenario_id}")
        return

    scenario: Scenario = SCENARIOS[scenario_id]
    channel_id = "general"

    logger.info("scenario_engine", f"Scenario initiated: {scenario.title}")

    conversation_store.clear(channel_id)

    await manager.broadcast({
        "type": "scenario_start",
        "scenarioId": scenario.id,
        "title": scenario.title,
        "severity": scenario.severity,
        "affectedService": scenario.affected_service,
        "channelId": channel_id,
    })

    step = scenario.opening_step
    member = TEAM.get(step.member_id)

    if not member:
        logger.error("scenario_engine", f"Karakter bulunamadı: {step.member_id}")
        return

    await asyncio.sleep(step.delay)

    await manager.broadcast({
        "type": "typing",
        "senderId": member.id,
        "senderName": member.name,
        "channelId": channel_id,
    })
    await asyncio.sleep(2.0)

    try:
        history = [{"role": "user", "content": "Sistem durumu nedir?"}]
        response = await get_agent_response(
            member=member,
            conversation_history=history,
            context=step.context,
        )
    except Exception as e:
        logger.error("scenario_engine", f"API error: {e}")
        fallback = {
            "slow_deploy": "Deploy sonrası payment-service çok yavaş! Müşteriler ödeme yapamıyor. @DevOps bakabilir misin?",
            "service_503": "Site tamamen çöktü, 503 veriyor! 5 dakikadır erişilemiyor. @DevOps acil!",
            "ssh_failure": "Production node'larına SSH bağlanamıyoruz, VPN'den de olmadı. @DevOps durumu biliyor musun?",
        }
        response = fallback.get(scenario_id, "Sistemde kritik sorun var! @DevOps bakabilir misin?")

    conversation_store.add_message(channel_id, "assistant", response)

    await manager.broadcast({
        "type": "agent_message",
        "senderId": member.id,
        "senderName": member.name,
        "senderRole": member.role,
        "avatarColor": member.avatar_color,
        "textColor": member.text_color,
        "content": response,
        "channelId": channel_id,
    })

    logger.info("scenario_engine", f"Opening message sent | Script: {scenario.title}")
    logger.info("scenario_engine", f"Expected tags: {scenario.expected_mentions}")
