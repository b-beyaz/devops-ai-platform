#!/bin/bash
# Key yedeği repo DIŞINDA tutulur
KEY_DIR="${SEALED_KEY_BACKUP_DIR:-$HOME/.secrets/sealed-secrets}"
FILE_NAME="sealed-secrets-key-backup.yaml"
mkdir -p "$KEY_DIR" && chmod 700 "$KEY_DIR"
KEY=$(kubectl get secret -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key)

if [ -f "$KEY_DIR/$FILE_NAME" ] && [ -z "$KEY" ]; then
  echo "Backup dosyası var, key yok → restore ediliyor"
  kubectl apply -f "$KEY_DIR/$FILE_NAME"
  kubectl rollout restart deployment/sealed-secrets-controller -n kube-system
else
  echo "Key cluster'da mevcut → yedekleniyor"
  kubectl get secret -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key \
    -o yaml > "$KEY_DIR/$FILE_NAME"
  chmod 600 "$KEY_DIR/$FILE_NAME"
fi
