import os
import random
from anthropic import AsyncAnthropic
from app.agents.roles import TEAM, TeamMember

client = AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

async def get_agent_response(
        member: TeamMember,
        conversation_history: list[dict],
        context: str = "",
) -> str:

    system = member.system_prompt
    if context:
        system += f"\n\nThe current crisis context:\n{context}"

    messages = conversation_history[-10:]

    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=300,
        system=system,
        messages=messages,
    )
    return response.content[0].text


async def decide_responder(
        user_message: str,
        active_channel: str,
        alert_context: dict | None = None,
) -> TeamMember | None:
    if active_channel in TEAM:
        return TEAM[active_channel]

    keywords = {
        "ali":   ["pod", "servis", "api", "backend", "crash", "memory", "cpu", "deploy", "container", "kubernetes", "k8s"],
        "ahmet": ["db", "database", "query", "sql", "index", "connection", "postgres", "slow", "veritabanı", "tablo"],
        "zeynep":["dns", "network", "firewall", "ping", "timeout", "bağlantı", "port", "ingress", "trafik", "ip"],
        "mert":  ["frontend", "cdn", "cache", "bundle", "react", "ui", "kullanıcı", "sayfa", "yavaş", "loading"],
    }

    msg_lower = user_message.lower()
    scores = {member_id: 0 for member_id in TEAM}

    for member_id, words in keywords.items():
        for word in words:
            if word in msg_lower:
                scores[member_id] += 1

    if alert_context:
        service = alert_context.get("service", "").lower()
        if any(k in service for k in ["payment", "api", "service"]):
            scores["ali"] += 2
        if any(k in service for k in ["db", "postgres", "mysql"]):
            scores["ahmet"] += 2

    best = max(scores, key=lambda x: scores[x])

    if scores[best] == 0:
        best = random.choice(list(TEAM.keys()))

    return TEAM[best]