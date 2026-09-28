# 06 - Helm Chart Structure & Deployment Guide

**Helm** is the package manager for Kubernetes. It packages all Kubernetes manifests (Deployments, Services, ConfigMaps, Secrets, Ingress) into reusable, parameterised charts under `helm/huntdevops/`.

---

## 📋 Prerequisites

Before validating or deploying Helm charts, ensure:
- [x] Completed **[01-prerequisites.md](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/01-prerequisites.md)** (Helm CLI installed: `helm version`).
- [x] Connected `kubectl` to your GKE cluster (if deploying directly):
  ```bash
  gcloud container clusters get-credentials prod-huntdevops-gke --zone us-central1-a --project project-e746f24e-392a-429f-a4d
  ```

---

## 📁 Helm Chart Directory Layout

```text
helm/
└── huntdevops/
    ├── Chart.yaml              # Chart metadata & application version
    ├── values.yaml             # Production default parameters
    └── templates/              # Parameterized Kubernetes templates
        ├── _helpers.tpl        # Common labels & helper templates
        ├── configmap.yaml      # Non-sensitive environment variables
        ├── postgres-secret.yaml# Database password & secret credentials
        ├── postgres-service.yaml# ClusterIP service for PostgreSQL
        ├── postgres-statefulset.yaml # Persistent database StatefulSet
        ├── backend-deployment.yaml   # Express API Deployment
        ├── backend-service.yaml      # Express API Service
        ├── frontend-deployment.yaml  # React NGINX Deployment
        ├── frontend-service.yaml     # React NGINX Service
        └── ingress.yaml        # NGINX Ingress Routing Rules
```

---

## ⚙️ Core Configuration (`values.yaml`)

[helm/huntdevops/values.yaml](file:///Users/aarvik/Documents/huntdevops/helm/huntdevops/values.yaml) centralizes image repositories, tags, replicas, and ports:

```yaml
frontend:
  replicaCount: 2
  image:
    repository: us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo/frontend
    tag: "main-latest"
  service:
    port: 80

backend:
  replicaCount: 2
  image:
    repository: us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo/backend
    tag: "main-latest"
  service:
    port: 4000

postgresql:
  enabled: true
  persistence:
    size: 10Gi
```

---

## 🛠️ Validation & Testing Commands

Always validate charts before committing to Git:

### 1. Lint the Chart
Checks indentation, syntax, and formatting:
```bash
helm lint helm/huntdevops
```
*Expected Output*: `1 chart(s) linted, 0 chart(s) failed`

### 2. Render Kubernetes Manifests Locally
Previews generated Kubernetes YAML without connecting to a cluster:
```bash
helm template huntdevops helm/huntdevops
```

### 3. Dry-Run Installation against GKE Cluster
Verifies manifests against the live Kubernetes API:
```bash
helm install huntdevops helm/huntdevops --dry-run --namespace huntdevops --create-namespace
```

---

## 🚀 Direct Deployment via Helm (Optional)

While Argo CD is our preferred GitOps engine, you can also deploy or upgrade directly using Helm CLI:

```bash
# Deploy / Upgrade Chart
helm upgrade --install huntdevops helm/huntdevops \
  --namespace huntdevops \
  --create-namespace

# Check rollout status
kubectl get pods -n huntdevops
```

---

## ⏭️ Next Step

Now explore how **Argo CD** automates deployment of this Helm chart declaratively using GitOps:
👉 **[07 - Argo CD GitOps Architecture & Setup](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/07-argo-cd-setup.md)**
