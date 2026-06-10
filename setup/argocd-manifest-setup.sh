#!/bin/bash
BASE_PATH="/mnt/c/devops-ai-platform/infra/argocd"
source /mnt/c/devops-ai-platform/target-apps/dropbox-app/.env
cd $BASE_PATH
kubectl apply -f dropbox-app.yaml

echo "dropbox-dev namespace oluşana kadar bekleniyor..."
kubectl wait --for=jsonpath='{.status.phase}'=Active namespace/dropbox-dev --timeout=120s
if [ $? -ne 0 ]; then
  echo "dropbox-dev namespace oluşmadı, kontrol et"
  exit 1
fi