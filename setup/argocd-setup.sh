#!/bin/bash
BASE_PATH="/mnt/c/devops-ai-platform/infra/k8s/base"
source /mnt/c/devops-ai-platform/target-apps/dropbox-app/.env

echo "Control if argocd ns exist"
ARGOCD_NS=$(kubectl get namespace argocd --no-headers 2>/dev/null)
if [ -z "$ARGOCD_NS" ]; then
  echo "ArgoCD namespace yok, kuruluyor..."
  echo "1.ArgoCD installation"
  echo "Step-1 Create Namespace"
  kubectl create namespace argocd
  echo "Step-2 Apply ArgoCD Instalation Yaml"
  kubectl apply -n argocd --server-side --force-conflicts -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
  echo "Step-3 Control if argocd pods is up"
  for i in $(seq 1 3);
  do
    kubectl wait --for=condition=available deployment --all -n argocd --timeout=300s
    if [ $? -eq 0 ]
    then
      echo "server is up"
      break
    else
      echo "server is not up.try again"
    fi
    if [ $i -eq 3 ]
    then
      echo "argocd is not up control the problem"
    fi
  done
else
  echo "ArgoCD zaten kurulu, atlanıyor..."
fi


