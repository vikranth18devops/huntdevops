# 06 - Helm Chart Structure & Deployment Guide

**Helm** is the package manager for Kubernetes. It packages all Kubernetes manifests into reusable, parameterised templates under `helm/huntdevops/`. 

Our Helm chart deploys a production-grade 3-tier application:
1. **Frontend**: Scalable React TypeScript SPA deployment served via Nginx.
2. **Backend**: Scalable Express REST API deployment configured with health probes.
3. **Database**: StatefulSet running PostgreSQL 16 with PersistentVolumeClaim (`standard-rwo`) and Secret-managed authentication.

---

## 📋 Prerequisites

Before validating or deploying Helm charts, ensure:
- [x] Completed **[01-prerequisites.md](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/01-prerequisites.md)** (Helm CLI installed: `helm version`).
- [x] Connected `kubectl` to your GKE cluster:
  ```bash
  gcloud container clusters get-credentials prod-huntdevops-gke --zone us-central1-a --project project-e746f24e-392a-429f-a4d
  ```

---

## 📁 Helm Chart Directory Layout

```text
helm/
└── huntdevops/
    ├── Chart.yaml              # Chart metadata & application version
    ├── values.yaml             # Production default parameters & image tags
    └── templates/              # Parameterized Kubernetes templates
        ├── _helpers.tpl        # Common labels & helper templates
        ├── configmap.yaml      # Non-sensitive environment variables (DB host, port, db name)
        ├── postgres-secret.yaml# Database password & secret credentials
        ├── postgres-service.yaml# ClusterIP service for PostgreSQL (Port 5432)
        ├── postgres-statefulset.yaml # Persistent database StatefulSet (10Gi volume)
        ├── backend-deployment.yaml   # Express API Deployment (Port 4000)
        ├── backend-service.yaml      # Express API ClusterIP Service
        ├── frontend-deployment.yaml  # React NGINX Deployment (Port 80)
        ├── frontend-service.yaml     # React NGINX ClusterIP Service
        └── ingress.yaml        # NGINX Ingress Routing Rules (/api -> backend, / -> frontend)
```

---

## ⚙️ Core Configuration (`values.yaml`)

[helm/huntdevops/values.yaml](file:///Users/aarvik/Documents/huntdevops/helm/huntdevops/values.yaml) centralizes image repositories, tags, replicas, resources, and database parameters:

```yaml
global:
  environment: production
  appName: huntdevops

frontend:
  replicaCount: 2
  image:
    repository: us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo/frontend
    pullPolicy: Always
    tag: "latest"
  service:
    type: ClusterIP
    port: 80
    targetPort: 80
  resources:
    limits:
      cpu: 250m
      memory: 256Mi
    requests:
      cpu: 100m
      memory: 128Mi

backend:
  replicaCount: 2
  image:
    repository: us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo/backend
    pullPolicy: Always
    tag: "latest"
  service:
    type: ClusterIP
    port: 4000
    targetPort: 4000
  env:
    NODE_ENV: production
    PORT: "4000"
    DB_HOST: huntdevops-postgres
    DB_PORT: "5432"
    DB_NAME: huntdevops
    DB_USER: postgres
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 200m
      memory: 256Mi

postgresql:
  enabled: true
  image:
    repository: postgres
    tag: "16-alpine"
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    port: 5432
  auth:
    database: huntdevops
    username: postgres
    passwordSecretName: huntdevops-postgres-secret
    passwordSecretKey: postgres-password
    rawPassword: "HuntDevOpsSecurePassword2026!"
  persistence:
    enabled: true
    size: 10Gi
    storageClass: standard-rwo

ingress:
  enabled: true
  className: nginx
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
  hosts:
    - host: huntdevops.example.com
      paths:
        - path: /api
          pathType: Prefix
          serviceName: huntdevops-backend
          servicePort: 4000
        - path: /
          pathType: Prefix
          serviceName: huntdevops-frontend
          servicePort: 80
```

> [!NOTE]
> On Google Kubernetes Engine (GKE), standard Persistent Disks use the StorageClass **`standard-rwo`** (ReadWriteOnce). Using unsupported class names like `standard-rwd` will cause persistent volume claims to remain in `Pending` indefinitely.

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
# Deploy / Upgrade Chart into huntdevops namespace
helm upgrade --install huntdevops helm/huntdevops \
  --namespace huntdevops \
  --create-namespace

# Check rollout status
kubectl get all,pvc -n huntdevops
```

---

## ⏭️ Next Step

Now explore how **Argo CD** automates deployment of this Helm chart declaratively using GitOps:
👉 **[07 - Argo CD GitOps Architecture & Setup](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/07-argo-cd-setup.md)**
