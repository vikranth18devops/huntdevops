# Argo CD GitOps Declarative Configuration

This directory contains the GitOps manifests used by Argo CD to monitor, synchronize, and deploy the HuntDevOps application to Google Kubernetes Engine (GKE).

## Directory Contents

* `application.yaml`: Argo CD Custom Resource defining the Git target path (`helm/huntdevops`), sync policies, auto-pruning, and destination namespace (`huntdevops`).
* `project.yaml`: Argo CD AppProject defining security boundaries, allowed namespaces, and cluster access rules.

## Quick Start Deployment

Apply the Argo CD Application to your GKE cluster:

```bash
# Create target namespace
kubectl create namespace huntdevops --dry-run=client -o yaml | kubectl apply -f -

# Apply Argo CD Project & Application Manifests
kubectl apply -f infra/argo/project.yaml
kubectl apply -f infra/argo/application.yaml
```
