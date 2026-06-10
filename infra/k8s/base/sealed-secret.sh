#!/bin/bash
BASE_PATH="/mnt/c/devops-ai-platform/infra/k8s/base"
FILE_NAME="sealed-secrets-key-backup.yaml"
KEY=$(kubectl get secret -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key)

if [ -f "$BASE_PATH/$FILE_NAME" ] && [ -z "$KEY" ]; then
echo "Backup dosyası var, key yok → restore ediliyor"
kubectl apply -f $BASE_PATH/$FILE_NAME
kubectl rollout restart deployment/sealed-secrets-controller -n kube-system
else
echo "Key cluster'da mevcut → yedekleniyor"
kubectl get secret -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key \
-o yaml > $BASE_PATH/$FILE_NAME
fi