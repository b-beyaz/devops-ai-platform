# Project Status

A status review of `devops-ai-platform` based only on the files in this repository. I inspected the code but did not run any build or test, so "broken" means the defect is visible in the code or config.

Related docs: [`project-structure.md`](project-structure.md), [`ROADMAP.md`](ROADMAP.md).

---

## 1. Completed

| Area | What works | Evidence |
|---|---|---|
| Target app | Spring Boot Dropbox clone with registration/login (BCrypt), file upload/download/delete/preview/search, folders, i18n (tr/en), Thymeleaf UI | `target-apps/dropbox-app/src/main/java/.../controller/`, `service/`, `templates/`, `messages*.properties` |
| Actuator | `health`, `info`, `prometheus`, `metrics` exposed; liveness/readiness probes enabled through env | `application.properties`, `infra/k8s/helm/dropbox/templates/configmap.yaml` |
| Container | Multi-stage Dockerfile, non-root user, container-aware JVM flags | `target-apps/dropbox-app/Dockerfile` |
| CI | Image built and pushed to Docker Hub as `aysebeyaz/dropbox:<MM-DD>.<run>` on changes to the app | `.github/workflows/ci.yml` |
| Helm chart | App + MySQL, ConfigMap, uploads PVC, optional HPA/Ingress, init container waiting for MySQL, startup/liveness/readiness probes, Prometheus annotations, dev and prod values | `infra/k8s/helm/dropbox/` |
| GitOps | ArgoCD `Application` with automated sync, prune, self-heal | `infra/argocd/dropbox-app.yaml` |
| Image automation | ArgoCD Image Updater with `newest-build` strategy, git write-back to Helm `values.yaml` (the image tag in `values.yaml` is already set to a CI-style tag, `06-22.45`) | `infra/argocd/image-updater-config.yaml`, `infra/k8s/helm/dropbox/values.yaml` |
| Secrets | Sealed Secrets controller install, `dropbox-secret` SealedSecret, key backup/restore script | `setup/sealed-secret-*.sh`, `infra/k8s/base/` |
| Bootstrap | Ordered setup scripts for ArgoCD, Sealed Secrets, Application, Image Updater | `setup/setup.sh` and siblings |
| Logging pipeline config | Alloy collects pod logs → Loki (`cluster=minikube` label) | `observability/alloy/config.alloy`, `observability/loki/values.yaml` |
| AI chat | FastAPI WebSocket chat. Messages are routed to Claude-backed "team member" personas by @mention, channel, or keyword. React/Zustand UI with typing indicator and alert badge | `ai-platform/backend/app/routers/ws.py`, `agents/`, `ai-platform/frontend/src/` |
| Alert intake | `POST /webhook` broadcasts alerts to connected clients | `ai-platform/backend/app/routers/webhook.py` |

---

## 2. Partially Implemented

| Item | State | Evidence |
|---|---|---|
| Scenario system | Scenario definitions exist, and the engine only plays the opening step. `hints`, `expected_mentions`, and `tags` are defined but never used (no hinting, no scoring, no follow-up steps). | `chaos-engine/scenarios/*.py`, `ai-platform/backend/app/agents/scenario_engine.py` |
| Chaos engine | Only narrative scenarios exist. `fault-library/` and `blast-radius-controller/` are empty directories. | `chaos-engine/` |
| Observability stack | Helm values for Prometheus, Grafana, Loki, and Alloy exist. Nothing installs them, and the files are mostly unmodified chart defaults. | `observability/*/values.yaml` |
| Grafana | Chart values only. No datasources (`datasources: {}`), no dashboards, persistence disabled. | `observability/grafana/values.yaml` |
| Prod environment | `values-prod.yaml` exists, but no ArgoCD Application uses it, there is no prod SealedSecret, and the ingress host is a placeholder. | `infra/k8s/helm/dropbox/values-prod.yaml`, `infra/argocd/`, `infra/k8s/base/sealed-secret.yaml` (namespace `dropbox-dev` only) |
| File sharing by e-mail | Endpoint exists, but the link it generates is wrong (see §4). Mail credentials are not passed in Kubernetes. | `FileController.java` (`/share`), `templates/deployment.yaml` |
| Local docker-compose stack | Defined, but mounts paths that do not exist (see §4) and depends on the external SigNoz network. | `target-apps/dropbox-app/docker-compose.yml` |
| AI backend layout | `models/` and `services/` packages are empty. `backend/main.py` only calls `load_dotenv()`. | `ai-platform/backend/app/models/`, `app/services/`, `ai-platform/backend/main.py` |
| Uncommitted work | Mention routing and model change, "support" role, and "Deniz" persona are modified but not committed. `observability/` and `chaos-engine/context.md` are untracked. `observability/signoz/README.md` is staged for deletion. | `git status` |

---

## 3. Missing

- **Alerting path.** No Prometheus alert rules and no Alertmanager receiver pointing at the AI platform's `/webhook` (`alertmanagers: []`). The core "alert → AI team" flow is not connected. Evidence: `observability/prometheus/values.yaml`, `ai-platform/backend/app/routers/webhook.py`.
- **Real fault injection.** No code acts on the cluster. Evidence: `chaos-engine/fault-library/`, `chaos-engine/blast-radius-controller/`.
- **Observability install.** No script, Helm command, or ArgoCD Application for the monitoring and logging stack. Evidence: `setup/`, `infra/argocd/`.
- **AI platform deployment.** No Dockerfile, Helm chart, Kubernetes manifest, or CI job for `ai-platform/`.
- **Docker Hub pull secret.** Image Updater references `pullsecret:argocd/dockerhub-creds`, but no script creates it. Evidence: `infra/argocd/image-updater-config.yaml`, `setup/`.
- **Minikube bootstrap.** No cluster start or addon (ingress, metrics-server) step, even though HPA and Ingress depend on them. Evidence: `setup/`, `templates/hpa.yaml`, `templates/ingress.yaml`.
- **Shared contracts.** `shared/docs`, `shared/events`, `shared/schemas` are empty.
- **Documentation.** The root `README.md` has no setup or run instructions. `ai-platform/frontend/README.md` is the default Vite template.

---

## 4. Broken or Misconfigured

| # | Problem | Evidence |
|---|---|---|
| B1 | `SCENARIOS` is used but its import is commented out. `/scenario/start`, `/scenario/list`, and `run_scenario` raise `NameError`. | `ai-platform/backend/app/routers/webhook.py`, `agents/scenario_engine.py` |
| B2 | Scenario files import `app.scenarios.base`, but they live in `chaos-engine/scenarios/`. `app/scenarios/` contains only a README, so the backend cannot import them as-is. | `chaos-engine/scenarios/*.py`, `ai-platform/backend/app/scenarios/README.md` |
| B3 | Logger misuse. `get_logger` returns a stdlib `logging.Logger`, but calls like `logger.warning("webhook", f"...")` pass the text as a format argument. The message is lost and logging reports a formatting error. | `ai-platform/backend/app/core/logger.py`, `webhook.py`, `scenario_engine.py` |
| B4 | `setup.sh` prints step 6 but never calls `create-deploy-ssh-key.sh`. Without the `ssh-git-creds` secret, Image Updater git write-back fails. | `setup/setup.sh` |
| B5 | `templates/secret.yaml` checks `.Values.createSecret`, but values define `image.createSecret`. | `infra/k8s/helm/dropbox/templates/secret.yaml`, `values.yaml` |
| B6 | The MySQL Deployment uses the app's `replicaCount`, so prod starts 2 independent MySQL pods on a single RWO PVC. Its checksum annotation hashes the app `configmap.yaml`, not `mysql-configmap.yaml`. | `templates/mysql-deployment.yaml`, `values-prod.yaml` |
| B7 | docker-compose mounts `./docker/mysql/init.sql` and `./nginx/...` relative to `target-apps/dropbox-app/`. Those files are in `infra/docker/` and `infra/nginx/`. | `target-apps/dropbox-app/docker-compose.yml` |
| B8 | nginx proxies to `dropbox-app-dev:8085` / `dropbox-app-prod:8085`, but the compose service is `app` (container `dropbox-app`). | `infra/nginx/conf.d/*.conf`, `docker-compose.yml` |
| B9 | The share link is `http://localhost:8080/uploads/<filename>`. The app listens on 8085, and `/uploads/{id}` expects a numeric ID, not a filename. | `controller/FileController.java` (`/share`, `/uploads/{id}`) |
| B10 | `POST /users/register` is in a `@RestController`, so it returns the literal string `"redirect:/login"` instead of redirecting. | `controller/UserController.java` |
| B11 | `POST /users/create` saves the user without encoding the password. BCrypt login fails for these users and the password is stored in plaintext. | `controller/UserController.java`, `service/UserService.java` |
| B12 | Java version mismatch: `pom.xml` targets 17, the Dockerfile builds and runs on 21. | `pom.xml`, `Dockerfile` |
| B13 | `application-docker.properties` sets `server.port` twice (8080, then 8085). | `application-docker.properties` |
| B14 | Scenarios target `web-frontend`, `payment-service`, and namespace `production`, none of which exist in the deployed environment (`dropbox` in `dropbox-dev`). | `chaos-engine/scenarios/*.py`, `infra/argocd/dropbox-app.yaml` |
| B15 | Mail is configured in Spring, but the Deployment passes no mail env vars and the SealedSecret has no mail keys, so e-mail features cannot work in Kubernetes. | `application.properties`, `templates/deployment.yaml`, `setup/sealed-secret-setup.sh` |

---

## 5. TODOs and Unfinished Work

The repo contains no `TODO` or `FIXME` markers. The unfinished work shows up as:
- Commented-out code: the `SCENARIOS` import (`webhook.py`, `scenario_engine.py`) and the old `/login` and `/register` handlers (`HomeController.java`)
- Placeholder directories: `chaos-engine/fault-library/`, `chaos-engine/blast-radius-controller/`, `shared/*`, `ai-platform/backend/app/models/`, `app/services/`
- A one-line `chaos-engine/context.md`
- `HomeController./home` hardcodes the name `"Ayşe"`
- A simulated Trivy step in CI (`echo` only) (`.github/workflows/ci.yml`)

---

## 6. Missing Tests

| Component | State | Evidence |
|---|---|---|
| Spring app | Tests exist for `AuthController`, `FileController` (1 test), `FileService`, and `UserService`. `FileControllerTests.java` is empty (0 bytes). No tests for `FolderController`, `FolderService`, `UserController`, `SecurityConfig`, the sharing/e-mail flow, or DB integration. | `target-apps/dropbox-app/src/test/java/...` |
| CI | Tests never run: CI has no test step and the Dockerfile uses `-DskipTests`. | `.github/workflows/ci.yml`, `Dockerfile` |
| AI backend | No tests. | `ai-platform/backend/` |
| Frontend | No tests or test runner. | `ai-platform/frontend/package.json` |
| Chaos engine | No tests. | `chaos-engine/` |
| Helm | No `helm lint`/template tests in CI. | `.github/workflows/ci.yml` |

---

## 7. Missing CI/CD and Deployment Pieces

- No `mvn test` or `mvn verify` step. Evidence: `.github/workflows/ci.yml`.
- No real vulnerability scan (Trivy step is simulated). Evidence: `ci.yml`.
- The image is built twice (a `test-build` tag, then again for push). Evidence: `ci.yml`.
- No CI for `ai-platform/` or `chaos-engine/`, and no Helm lint.
- The CI trigger includes `dockerize-branch`, which may be stale. Evidence: `ci.yml`.
- No prod promotion path: there is a single ArgoCD Application for `dropbox-dev`. Evidence: `infra/argocd/dropbox-app.yaml`.
- Setup scripts are tied to absolute paths (`/mnt/c/devops-ai-platform`, `/home/adminlocal`) and a local `.env`. Evidence: `setup/*.sh`.

---

## 8. Missing Kubernetes / ArgoCD / Monitoring Components

- ArgoCD Applications for the observability stack and the AI platform. Evidence: `infra/argocd/`.
- Prod ArgoCD Application and prod SealedSecret. Evidence: `infra/argocd/`, `infra/k8s/base/`.
- Prometheus alert rules and an Alertmanager webhook receiver. Evidence: `observability/prometheus/values.yaml`.
- Grafana datasources (Prometheus, Loki) and dashboards (JVM, HTTP, MySQL). Evidence: `observability/grafana/values.yaml`.
- MySQL runs as a `Deployment` rather than a `StatefulSet`, with no backups and no MySQL exporter. Evidence: `templates/mysql-deployment.yaml`.
- No liveness or readiness probes on MySQL. Evidence: `templates/mysql-deployment.yaml`.
- No NetworkPolicies or PodDisruptionBudgets. Evidence: `infra/k8s/helm/dropbox/templates/`.
- The SigNoz/OTEL integration is referenced in compose, but there is no SigNoz setup in the repo; only its gitignore entry and a staged-for-deletion README remain. Evidence: `docker-compose.yml`, `.gitignore`.

---

## 9. Technical Debt and Obvious Improvements

- Outdated or odd dependencies: `c3p0 0.9.1.2`, `json-lib 2.4`, `hibernate-c3p0 7.0.0.CR1` (release candidate alongside `hibernate-core 6.2.13`), Spring Boot 3.1.5. Evidence: `pom.xml`.
- `spring.main.allow-circular-references=true` hides a bean cycle. Evidence: `application.properties`.
- `FileController.java` is 456 lines and has two upload endpoints (`POST /` and `POST /upload`) plus a third in `FolderController` (`/folders/{id}/upload`). Evidence: `controller/`.
- The i18n `MessageSource` is defined both in properties and in the `WebConfig` bean. Evidence: `application.properties`, `config/WebConfig.java`.
- The observability values files are full copies of the chart defaults (thousands of lines), which makes the real overrides hard to see. Evidence: `observability/*/values.yaml`.
- The team roster is duplicated in the backend and the frontend (`roles.py` vs. `chatStore.ts`), and the names already diverge ("Deniz Şahin" vs. "Deniz Sahin"). Evidence: `ai-platform/backend/app/agents/roles.py`, `ai-platform/frontend/src/store/chatStore.ts`.
- Hardcoded endpoints: `ws://localhost:8002/ws` in the frontend. Evidence: `ai-platform/frontend/src/App.tsx`, `hooks/useWebSocket.ts`.
- Conversation history is held only in memory. Evidence: `ai-platform/backend/app/core/conversation_store.py`.
- The backend uses the deprecated `@app.on_event`. Evidence: `ai-platform/backend/app/main.py`.

---

## 10. Potential Security Issues

| # | Issue | Evidence |
|---|---|---|
| S1 | **The Sealed Secrets controller private key is committed.** Anyone with repo access can decrypt every SealedSecret. | `infra/k8s/base/sealed-secrets-key-backup.yaml` |
| S2 | CSRF protection is disabled for `/upload`. | `config/SecurityConfig.java` |
| S3 | Plaintext password storage path through `/users/create`, and the response returns the full `UserModel`, including the password. | `UserController.java`, `UserService.java` |
| S4 | `/actuator/health` is public with `show-details=always`, which exposes internal component details. `/actuator/prometheus` is also public. | `SecurityConfig.java`, `application.properties` |
| S5 | Exception messages are shown to users (`"Bir hata oluştu: " + e.getMessage()`). | `AuthController.java`, `FileController.java` |
| S6 | The unsanitized original filename goes into the `Content-Disposition` header. | `FileController.java` (`/preview/{id}`) |
| S7 | The AI backend has CORS `*` with credentials, and no auth on the WebSocket or on `/webhook`. Anyone who can reach it can inject alerts or consume Claude API credits. | `ai-platform/backend/app/main.py`, `routers/` |
| S8 | CI pushes an image without a real vulnerability scan. | `.github/workflows/ci.yml` |
| S9 | `values.yaml` sets no `securityContext` for the MySQL pod, and the app container has no `readOnlyRootFilesystem` or dropped capabilities. | `templates/mysql-deployment.yaml`, `templates/deployment.yaml` |

---

## 11. Features Started but Never Completed

- **Scenario-driven training:** definitions, engine, and endpoints exist, but they are disconnected (B1, B2) and only the opening step runs. Evidence: `chaos-engine/scenarios/`, `scenario_engine.py`.
- **Chaos engine:** directory skeleton only. Evidence: `chaos-engine/fault-library/`, `blast-radius-controller/`.
- **Alert → AI response loop:** the webhook exists, but there is no alert source and the alert context is not used (`decide_responder` accepts `alert_context` but ignores it). Evidence: `webhook.py`, `agents/agent_service.py`.
- **Observability stack:** values written, never wired or installed. Evidence: `observability/`.
- **Production environment:** values written, no deployment path. Evidence: `values-prod.yaml`.
- **SigNoz / OpenTelemetry:** env vars in compose, setup removed. Evidence: `docker-compose.yml`, `observability/signoz/`.
- **E-mail sharing:** endpoint exists, the link is broken, and credentials are not provisioned in Kubernetes (B9, B15).
- **Shared schemas/events:** empty directories. Evidence: `shared/`.

---

## 12. Prioritized Next Steps

1. **Rotate the Sealed Secrets key and remove `sealed-secrets-key-backup.yaml` from the repo and its history (S1).** Then re-seal `dropbox-secret`.
2. **Fix the AI backend crashers:** the scenario import and packaging (B1, B2) and the logger calls (B3).
3. **Fix the GitOps bootstrap:** call `create-deploy-ssh-key.sh` in `setup.sh` (B4) and create the `dockerhub-creds` pull secret.
4. **Commit pending work:** the modified AI files, `observability/`, and the staged SigNoz deletion.
5. **Fix app security and correctness bugs:** password encoding in `/users/create` (B11, S3), the share link (B9), the `/users/register` response (B10), CSRF on `/upload` (S2), and the actuator exposure (S4).
6. **Add tests to CI:** a `mvn test` step, remove the empty `FileControllerTests.java`, and add a real Trivy scan.
7. **Install observability and connect alerting:** deploy Prometheus, Loki, Alloy, and Grafana (via ArgoCD), add alert rules and an Alertmanager → `/webhook` receiver, and add Grafana datasources and dashboards.
8. **Fix Helm chart issues:** the `createSecret` key (B5), the MySQL replicas and checksum (B6), mail env and secret keys (B15), and MySQL probes and StatefulSet.
9. **Implement real fault injection** in `chaos-engine/` with blast-radius limits, and realign scenarios with the `dropbox` app and namespace (B14).
10. **Finish the scenario engine:** multi-step flow, hints, `expected_mentions` scoring, and use of alert context.
11. **Fix local dev:** docker-compose paths (B7), nginx upstream names (B8), duplicate `server.port` (B13), and the Java version alignment (B12).
12. **Add prod environment:** ArgoCD Application, SealedSecret, and real ingress host.
13. **Package and deploy the AI platform:** Dockerfile, chart, CI, configurable URLs, and auth on the WebSocket and webhook (S7).
14. **Pay down tech debt:** dependency upgrades, remove circular references, trim values files to the actual overrides, consolidate the team roster, and write the README and setup documentation.
