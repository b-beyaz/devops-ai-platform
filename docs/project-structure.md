# Project Structure

DevOps AI Platform is a simulation platform where DevOps engineers practice troubleshooting with AI agents. It has a Spring Boot target app (`dropbox-app`) that is monitored and gets chaos injected, GitOps delivery with Helm and ArgoCD on Minikube, an observability stack, and an AI chat platform built with FastAPI and React.

```
devops-ai-platform/
├── .github/workflows/   # CI: build and push the dropbox-app Docker image
├── ai-platform/         # AI agent system (FastAPI backend + React frontend)
├── chaos-engine/        # Fault-injection scenarios
├── infra/               # ArgoCD, Helm chart, sealed secrets, MySQL init, nginx
├── observability/       # Helm values for Prometheus, Grafana, Loki, Alloy
├── setup/               # Cluster bootstrap shell scripts
├── shared/              # Shared docs/events/schemas (currently empty)
├── target-apps/         # Monitored applications (dropbox-app)
└── README.md
```

> `observability/` and `chaos-engine/context.md` are currently untracked in git.

---

## Main Directories

| Directory | Purpose |
|---|---|
| `target-apps/dropbox-app/` | Spring Boot "Dropbox clone" (files, folders, users, sharing). This is the target application. |
| `infra/argocd/` | ArgoCD `Application` and ArgoCD Image Updater config |
| `infra/k8s/helm/dropbox/` | Helm chart that deploys the app and MySQL to Kubernetes |
| `infra/k8s/base/` | Sealed secret for the app plus a script to back up and restore the controller key |
| `infra/docker/mysql/` | MySQL init script |
| `infra/nginx/` | nginx reverse-proxy config (dev/prod virtual hosts) |
| `observability/` | Helm values files for the monitoring and logging stack |
| `setup/` | Scripts that install ArgoCD, Sealed Secrets, and Image Updater, and create secrets |
| `ai-platform/backend/` | FastAPI backend that runs Claude-based "team member" agents over WebSocket and receives alerts through a webhook |
| `ai-platform/frontend/` | React + Vite + Zustand chat UI |
| `chaos-engine/scenarios/` | Python scenario definitions (`service_503`, `slow_deploy`, `ssh_failure`) |
| `chaos-engine/blast-radius-controller/`, `chaos-engine/fault-library/` | Empty placeholders |
| `shared/docs`, `shared/events`, `shared/schemas` | Empty placeholders |

---

## Spring Boot Application (`target-apps/dropbox-app/`)

- **Stack:** Spring Boot 3.1.5 (parent), Java 17 in `pom.xml`, Spring Web, Thymeleaf, Data JPA, Security, Actuator, MySQL Connector/J, Log4j2, Lombok
- **Build:** Maven (`pom.xml`, `mvnw`, `mvnw.cmd`, `.mvn/wrapper/`)
- **Port:** `8085`

```
target-apps/dropbox-app/src/main/java/com/example/dropboxproject/
├── DropboxprojectApplication.java   # Main class
├── ServletInitializer.java          # WAR/servlet container support
├── config/        SecurityConfig, WebConfig
├── controller/    Auth, File, Folder, Home, User controllers
├── model/         FileModel, FolderModel, UserModel (JPA entities)
├── repository/    File, Folder, User repositories
└── service/       FileService, FolderService, UserService, CustomUserDetailsService

target-apps/dropbox-app/src/main/resources/
├── application.properties           # Base config (env-var driven DB, upload, mail, actuator)
├── application-dev.properties       # show-sql, ddl-auto=update, DEBUG logging
├── application-prod.properties      # ddl-auto=validate, WARN logging
├── application-docker.properties    # SPRING_DATASOURCE_* / SPRING_MAIL_* env vars
├── log4j2.xml
├── messages*.properties             # i18n (default, en, tr)
├── static/css/styles.css
└── templates/                       # Thymeleaf pages (login, register, upload, folders, share, …)

target-apps/dropbox-app/src/test/java/com/example/dropboxproject/
└── AuthControllerTest, FileControllerTest(s), FileServiceTest, UserServiceTest
```

- **Actuator:** exposes `health, info, prometheus, metrics`. Kubernetes uses `/actuator/health`, `/actuator/health/liveness`, and `/actuator/health/readiness` as probes, and Prometheus scrapes `/actuator/prometheus`.
- **Dockerfile:** multi-stage build (`maven:3.9.6-eclipse-temurin-21` builds, `eclipse-temurin:21-jre` runs). The container runs as non-root `appuser`, exposes `8085`, and uses `/app/uploads` for files.
- **docker-compose.yml:** local stack with `db` (mysql:8.0, host port 3307), `app`, and `nginx`. Reads `.env`. Sends OTEL env vars to `signoz-otel-collector` on the external `signoz-net` network.

---

## Kubernetes / Minikube Manifests (`infra/k8s/`)

The app runs on Minikube; the Alloy config sets the label `cluster = "minikube"`. It is deployed through a Helm chart that ArgoCD syncs.

**Helm chart `infra/k8s/helm/dropbox/`** (`Chart.yaml`: "Dropbox clone — Spring Boot + MySQL")

| File | Resource |
|---|---|
| `values.yaml` | Default/dev values: image `aysebeyaz/dropbox:<tag>`, 1 replica, ClusterIP 80→8085, profile `dev`, namespace `dropbox-dev`, 5Gi uploads PVC, MySQL 8.0 with 8Gi |
| `values-prod.yaml` | Prod overrides: 2 replicas, ingress + TLS, HPA (2–5), profile `prod`, namespace `dropbox-prod`, bigger resources |
| `templates/_helpers.tpl` | Name/label helpers, MySQL host, and JDBC URL helpers |
| `templates/namespace.yaml` | App namespace |
| `templates/deployment.yaml` | App Deployment: `wait-for-mysql` init container, startup/liveness/readiness probes, Prometheus scrape annotations, runs as non-root |
| `templates/service.yaml` | App Service |
| `templates/configmap.yaml` | Non-secret env (Spring profile, datasource URL, upload dir, actuator/probe settings, port) |
| `templates/secret.yaml` | Optional plain Secret `dropbox-secret` (only when `createSecret` is set) |
| `templates/pvc.yaml` | Uploads PVC |
| `templates/hpa.yaml` | HPA (CPU + memory), when `hpa.enabled` |
| `templates/ingress.yaml` | nginx Ingress, when `ingress.enabled` (cert-manager issuer when TLS is on) |
| `templates/mysql-deployment.yaml`, `mysql-service.yaml`, `mysql-configmap.yaml`, `mysql-pvc.yaml` | MySQL Deployment, Service, config, and data PVC |

**Secrets `infra/k8s/base/`**

- `sealed-secret.yaml`: `SealedSecret` named `dropbox-secret` in `dropbox-dev` (keys `db-username`, `mysql-password`, `mysql-root-password`). `setup/sealed-secret-setup.sh` generates it.
- `sealed-secret.sh`: backs up the Sealed Secrets controller key outside the repo (`$SEALED_KEY_BACKUP_DIR`, default `~/.secrets/sealed-secrets/`), or restores it when a backup exists and the cluster has no key. The key backup is git-ignored and must never be committed.

---

## ArgoCD Configuration

`infra/argocd/dropbox-app.yaml` defines an `Application` named `dropbox` in the `argocd` namespace:
- Source: this repo, `main` branch, path `infra/k8s/helm/dropbox`
- Destination: in-cluster, namespace `dropbox-dev`
- Sync: automated, with `prune`, `selfHeal`, and `CreateNamespace=true`

`setup/argocd-setup.sh` installs ArgoCD. `setup/argocd-manifest-setup.sh` applies the Application and syncs it with the `argocd` CLI.

## ArgoCD Image Updater Configuration

`infra/argocd/image-updater-config.yaml` defines an `ImageUpdater` named `dropbox-updater` in `argocd`:
- Targets applications that match `dropbox*`. Watches image `aysebeyaz/dropbox` and ignores the `latest` tag.
- Uses the `newest-build` strategy with pull secret `argocd/dockerhub-creds`.
- Writes back to git over SSH (`main` branch) by updating `image.repository` and `image.tag` in the Helm `values.yaml`.

`setup/image-updater-setup.sh` installs Image Updater. `setup/create-deploy-ssh-key.sh` creates the `ssh-git-creds` secret in `argocd`, which is used for git write-back.

---

## Prometheus / Grafana Configuration (`observability/`)

These are Helm chart values files, mostly the upstream defaults. The repo does not contain the install commands.

| File | Notes |
|---|---|
| `prometheus/values.yaml` | Prometheus community chart. Default scrape jobs include `kubernetes-pods`, which picks up the app through its `prometheus.io/*` annotations. Alertmanager (2Gi PVC), kube-state-metrics, node-exporter, and pushgateway are enabled. |
| `grafana/values.yaml` | Grafana chart. `datasources: {}` means no datasources or dashboards are defined in the repo. Persistence is disabled. |
| `loki/values.yaml` | Loki chart, `deploymentMode: Monolithic`, filesystem storage |
| `alloy/values.yaml` | Grafana Alloy chart. Uses the existing ConfigMap `alloy-config`. |
| `alloy/config.alloy` | Discovers pod logs on the node, labels them (namespace/pod/container/app/job, `cluster=minikube`), and pushes them to `loki-gateway.monitoring.svc.cluster.local` |

The Spring app side: Actuator exposes `/actuator/prometheus`, and the Helm Deployment adds `prometheus.io/scrape|path|port` annotations.

---

## Database-Related Files

- `infra/docker/mysql/init.sql`: creates the `dropboxproject` database (utf8mb4)
- `infra/k8s/helm/dropbox/templates/mysql-*.yaml`: MySQL on Kubernetes
- `values.yaml` → `database.*` and `mysql.*`: DB name `dropboxproject`, user `dropbox_user`, port 3306, secret `dropbox-secret`
- `target-apps/dropbox-app/docker-compose.yml` → `db` service (mysql:8.0)
- Spring datasource settings in `application*.properties`. JPA entities are in `model/` and repositories in `repository/`.

---

## CI/CD-Related Files

**CI: `.github/workflows/ci.yml`** ("Build and Push Docker Image")
- Triggers on pushes to `main` or `dockerize-branch` that change `target-apps/dropbox-app/**`
- Builds the image with Buildx and GHA cache, runs a simulated vulnerability scan (just an echo), and pushes `aysebeyaz/dropbox:<MM-DD>.<run_number>` to Docker Hub
- Needs the `DOCKERHUB_USERNAME` and `DOCKER_TOKEN` secrets

**CD flow (GitOps):**
CI pushes an image → Image Updater finds the newest build → commits the new tag to `infra/k8s/helm/dropbox/values.yaml` → ArgoCD auto-syncs the chart into `dropbox-dev`.

**Bootstrap: `setup/setup.sh`** runs these in order:
1. `argocd-setup.sh`: install ArgoCD
2. `sealed-secret-controller-setup.sh`: install the Sealed Secrets controller (v0.24.1)
3. `argocd-manifest-setup.sh`: apply the ArgoCD Application and sync it
4. `sealed-secret-setup.sh`: build and apply the `dropbox-secret` SealedSecret
5. `image-updater-setup.sh`: install ArgoCD Image Updater
6. `create-deploy-ssh-key.sh`: SSH key for git write-back

The scripts use absolute paths under `/mnt/c/devops-ai-platform` and source `target-apps/dropbox-app/.env`.

---

## AI Platform (`ai-platform/`)

- **Backend (FastAPI, `backend/app/`)**
  - `main.py`: app entry point (logs port 8002)
  - `routers/ws.py`: WebSocket endpoint
  - `routers/webhook.py`: `POST /webhook` for alerts and `POST /scenario/start`
  - `agents/`: Claude agents via the `anthropic` SDK (`agent_service.py`), team personas (`roles.py`), and the scenario runner (`scenario_engine.py`)
  - `core/`: connection manager, conversation store, logger
  - Dependencies are in `requirements.txt`
- **Frontend (`frontend/`)**: React 19 + Vite + TypeScript + Zustand
  - `components/`: chat UI and alert badge
  - `hooks/useWebSocket.ts`
  - `store/chatStore.ts`

---

## Important Configuration Files

| File | Purpose |
|---|---|
| `target-apps/dropbox-app/pom.xml` | Maven build and dependencies |
| `target-apps/dropbox-app/src/main/resources/application*.properties` | Spring config per profile |
| `target-apps/dropbox-app/Dockerfile` / `docker-compose.yml` | Container image and local stack |
| `infra/k8s/helm/dropbox/values.yaml` / `values-prod.yaml` | Kubernetes deployment settings (Image Updater edits `values.yaml`) |
| `infra/argocd/*.yaml` | GitOps and image-update config |
| `infra/nginx/nginx.conf`, `conf.d/dev.conf`, `conf.d/prod.conf` | Reverse proxy to `dropbox-app-dev:8085` / `dropbox-app-prod:8085` |
| `observability/*/values.yaml`, `alloy/config.alloy` | Monitoring and logging stack |
| `.github/workflows/ci.yml` | CI pipeline |
| `.gitignore` | Ignores build output, `uploads/`, `.idea/`, `.env`, Python caches, `observability/signoz/signoz/` |
| `ai-platform/backend/requirements.txt`, `ai-platform/frontend/package.json` | AI platform dependencies |

---

## Observed Inconsistencies

These are recorded as they exist in the repo; nothing was changed.

- `docker-compose.yml` mounts `./docker/mysql/init.sql` and `./nginx/...` relative to `target-apps/dropbox-app/`, but those files live under `infra/docker/` and `infra/nginx/`.
- `pom.xml` sets Java 17, while the Dockerfile uses Temurin 21 images.
- `templates/secret.yaml` checks `.Values.createSecret`, but `values.yaml` defines `image.createSecret`.
- `ai-platform` `webhook.py` and `scenario_engine.py` reference `SCENARIOS`, but its import is commented out.
