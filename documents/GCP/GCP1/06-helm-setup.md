# 06 - Helm Chart Structure & Deployment Guide

**Helm** is the package manager for Kubernetes. It packages complex Kubernetes applications into reusable, version-controlled charts containing parameterised templates.

---

## 📁 Helm Chart Directory Architecture

The application Helm chart is located under `helm/huntdevops/`:

```text
helm/
└── huntdevops/
    ├── Chart.yaml              # Chart metadata & app versioning
    ├── values.yaml             # Default configuration values
    └── templates/              # Kubernetes resource templates
        ├── _helpers.tpl        # Template helper functions & labels
        ├── configmap.yaml      # App environment variables
        ├── postgres-secret.yaml# Database secret credentials
        ├── postgres-service.yaml# ClusterIP service for PostgreSQL
        ├── postgres-statefulset.yaml # Persistent database StatefulSet
        ├── backend-deployment.yaml   # Express API Deployment
        ├── backend-service.yaml      # Express API Service
        ├── frontend-deployment.yaml  # React NGINX Deployment
        ├── frontend-service.yaml     # React NGINX Service
        └── ingress.yaml        # NGINX Ingress Routing Rules
```

---

## 📜 Key Configuration Files Explained

### 1. `Chart.yaml`
Defines chart metadata:
```yaml
apiVersion: v2
name: huntdevops
description: Helm Chart for HuntDevOps Multi-tier Web Application on GKE
type: application
version: 1.0.0
appVersion: "1.0.0"
```

### 2. `values.yaml`
Provides configurable variables for container images, replicas, resources, and ports:
```yaml
frontend:
  replicaCount: 2
  image:
    repository: us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo/frontend
    tag: "main-latest"

backend:
  replicaCount: 2
  image:
    repository: us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo/backend
    tag: "main-latest"

postgresql:
  enabled: true
  persistence:
    size: 10Gi
```

---

## 🛠️ Chart Validation Commands

Before deploying or committing changes to Helm charts, always validate syntax and template rendering:

### 1. Lint the Chart
Checks chart syntax, indentation, and formatting rules:
```bash
helm lint helm/huntdevops
```
*Expected Output*: `1 chart(s) linted, 0 chart(s) failed`

### 2. Render Template Manifests Locally
Simulates Kubernetes manifest generation without connecting to a cluster:
```bash
helm template huntdevops helm/huntdevops
```

### 3. Test Template Rendering with Environment Overrides
```bash
# Test with development overrides
helm template huntdevops helm/huntdevops -f infra/helm/values-dev.yaml

# Test with production overrides
helm template huntdevops helm/huntdevops -f infra/helm/values-prod.yaml
```
