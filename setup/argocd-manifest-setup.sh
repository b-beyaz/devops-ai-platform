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

kubectl port-forward svc/argocd-server -n argocd 8080:443 &
PF_PID=$!
sleep 3
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d)
argocd login localhost:8080 --username admin --password $ARGOCD_PASSWORD --insecure

argocd app sync dropbox
kill $PF_PID