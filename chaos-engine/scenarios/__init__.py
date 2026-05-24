from app.scenarios.slow_deploy import scenario as slow_deploy
from app.scenarios.service_503 import scenario as service_503
from app.scenarios.ssh_failure import scenario as ssh_failure
from app.scenarios.base import Scenario

SCENARIOS: dict[str, Scenario] = {
    slow_deploy.id:   slow_deploy,
    service_503.id:   service_503,
    ssh_failure.id:   ssh_failure,
}
