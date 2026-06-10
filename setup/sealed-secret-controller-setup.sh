#!/bin/bash
BASE_PATH="/mnt/c/devops-ai-platform/infra/k8s/base"
source /mnt/c/devops-ai-platform/target-apps/dropbox-app/.env
echo "2. Sealed Secret Instalation"

cd $BASE_PATH

echo "Step-1 Install Sealed Secrets Controller"
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.1/controller.yaml
echo "Step-2 Controller ayağa kalkana kadar bekle"
for i in $(seq 1 3);
do
  kubectl wait --for=condition=available deployment/sealed-secrets-controller -n kube-system --timeout=300s
  if [ $? -eq 0 ]
  then
    echo "sealed secret controller is up"
    break
  else
    echo "sealed secret  is not up.try again"
  fi
  if [ $i -eq 3 ]
  then
    echo "sealed secret  is not up control the problem"
  fi
done