#!/bin/bash
SSH_FILE_PATH=/home/adminlocal
SSH_FILE_NAME=ssh-git-creds
echo "Control if there is a local ssh key"
LOCAL_SSH_KEY=$(ls -l $SSH_FILE_PATH/$SSH_FILE_NAME 2>/dev/null)
SECRET_GIT_KEY=$(kubectl get secret ssh-git-creds -n argocd 2>/dev/null )

if [ -z "$LOCAL_SSH_KEY" ] && [ -z "$SECRET_GIT_KEY" ]; then
  echo "There will be created GENERIC_SSH_KEY and SECRET_GIT_KEY"
  echo "Create GENERIC_SSH_KEY"
  ssh-keygen -t ed25519 -C "argocd-image-updater" -f $SSH_FILE_PATH/$SSH_FILE_NAME -N ""
  echo "Create SECRET_GIT_KEY"
  kubectl create secret generic ssh-git-creds \
      -n argocd \
      --from-file=sshPrivateKey=$SSH_FILE_PATH/$SSH_FILE_NAME
elif [ -n "$LOCAL_SSH_KEY" ] && [ -z "$SECRET_GIT_KEY" ]; then
  echo "Create Secret GIT KEY"
  kubectl create secret generic ssh-git-creds \
    -n argocd \
    --from-file=sshPrivateKey=$SSH_FILE_PATH/$SSH_FILE_NAME
else
  echo "There is already exist GENERIC_SSH_KEY and SECRET_GIT_KEY"
fi
