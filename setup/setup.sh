#!/bin/bash
SETUP_PATH="/mnt/c/devops-ai-platform/setup"
source /mnt/c/devops-ai-platform/target-apps/dropbox-app/.env

echo "1. ArgoCD kurulumu"
$SETUP_PATH/argocd-setup.sh

echo "2. Sealed Secrets controller kurulumu"
$SETUP_PATH/sealed-secret-controller-setup.sh

echo "3. ArgoCD manifest apply et"
$SETUP_PATH/argocd-manifest-setup.sh

echo "4. Sealed secret oluştur ve apply et"
$SETUP_PATH/sealed-secret-setup.sh

echo "5. Image Updater"
$SETUP_PATH/image-updater-setup.sh

echo "6. Create Generic SSH Key If Not Exist"

