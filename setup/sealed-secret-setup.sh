#!/bin/bash
BASE_PATH="/mnt/c/devops-ai-platform/infra/k8s/base"
source /mnt/c/devops-ai-platform/target-apps/dropbox-app/.env
echo "2. Sealed Secret Instalation"

echo "Create Sealed Secret Manifest"
kubectl create secret generic dropbox-secret \
  --from-literal=db-username=$DB_USERNAME \
  --from-literal=mysql-password=$DB_PASSWORD \
  --from-literal=mysql-root-password=$DB_ROOT_PASSWORD \
  --namespace=dropbox-dev \
  --dry-run=client -o yaml > /tmp/dropbox-secret.yaml

echo "Encrypt kubeseal"
kubeseal --format=yaml \
  --controller-name=sealed-secrets-controller \
  --controller-namespace=kube-system \
  < /tmp/dropbox-secret.yaml \
  > /mnt/c/devops-ai-platform/infra/k8s/base/sealed-secret.yaml

echo "Delete old file"
rm /tmp/dropbox-secret.yaml

echo "Step-3 Key restore/backup"
$BASE_PATH/sealed-secret.sh

echo "Step-4 Sealed secret apply et"
kubectl apply -f $BASE_PATH/sealed-secret.yaml


