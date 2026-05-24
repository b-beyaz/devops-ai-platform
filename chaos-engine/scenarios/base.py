from dataclasses import dataclass, field
from typing import Literal

Severity = Literal["low", "medium", "high", "critical"]

@dataclass
class ScenarioStep:
    member_id: str
    context: str
    delay: float = 2.0

@dataclass
class Scenario:
    id: str
    title: str
    description: str
    severity: Severity
    affected_service: str
    opening_step: ScenarioStep
    hints: list[str] = field(default_factory=list)
    expected_mentions: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
