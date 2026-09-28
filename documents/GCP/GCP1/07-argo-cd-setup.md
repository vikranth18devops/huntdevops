# 07 - Argo CD GitOps Architecture & Setup Guide

**Argo CD** is a declarative, GitOps continuous delivery tool for Kubernetes. It continuously monitors your Git repository (`helm/huntdevops`) and ensures the live state of your GKE cluster matches the desired state defined in Git.

---

## 🏛️ Infrastructure Directory Separation

Per production GitOps standards, infrastructure and deployment responsibilities are strictly separated:

```text
infra/
├── helm/             # Helm infrastructure overrides (values-dev.yaml, values-prod.yaml)
└── argo/             # Declarative Argo CD Custom Resource Definitions (CRDs)
    ├── application.yaml
    ├── project.yaml
    └── README.md
```

> [!IMPORTANT]
> The application Helm chart (`helm/huntdevops`) defines **HOW** the application is templated. The Argo CD manifest (`infra/argo/application.yaml`) defines **WHERE** and **WHEN** Argo CD pulls the chart and deploys it onto GKE.

---

## 📄 Argo CD Application Manifest (`infra/argo/application.yaml`)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: huntdevops-app
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: 'https://github.com/aarvik/huntdevops.git'
    targetRevision: HEAD
    path: helm/huntdevops
    helm:
      valueFiles:
        - values.yaml
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: huntdevops
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - Validate=true
      - ApplyOutOfSyncOnly=true
```

### Key Policy Explanations:
* `automated.prune: true`: Automatically deletes obsolete Kubernetes resources from GKE if they are removed from the Git repository.
* `automated.selfHeal: true`: Automatically overrides manual changes made to the cluster (e.g., via `kubectl edit`) to match Git.
* `CreateNamespace=true`: Automatically creates the `huntdevops` target namespace on GKE if it does not exist.

---

## 🚀 Installation & Synchronization Workflow

### 1. Deploy Argo CD to GKE Cluster
```bash
# Create argocd namespace
kubectl create namespace argocd

# Install official Argo CD manifests
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### 2. Apply HuntDevOps GitOps Manifests
```bash
# Apply Project & Application
kubectl apply -f infra/argo/project.yaml
kubectl apply -f infra/argo/application.yaml
```

### 3. Verify Sync Status via CLI
```bash
# Get Application status
argocd app get huntdevops-app

# Trigger immediate manual sync (if automated sync is disabled)
argocd app sync huntdevops-app
```
