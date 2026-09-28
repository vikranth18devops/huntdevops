# 07 - Argo CD GitOps Architecture & Setup Guide

**Argo CD** is a declarative, GitOps continuous delivery tool for Kubernetes. It continuously monitors your Git repository ([vikranth18devops/huntdevops](https://github.com/vikranth18devops/huntdevops)) and ensures that the live state of your GKE cluster matches the desired state declared in `helm/huntdevops`.

---

## 📋 Prerequisites

Before setting up Argo CD, ensure:
- [x] GKE cluster is provisioned and running:
  ```bash
  gcloud container clusters describe prod-huntdevops-gke --zone us-central1-a --project project-e746f24e-392a-429f-a4d --format="value(status)"
  ```
  *Expected Output*: `RUNNING`
- [x] Connected `kubectl` to GKE cluster:
  ```bash
  gcloud container clusters get-credentials prod-huntdevops-gke --zone us-central1-a --project project-e746f24e-392a-429f-a4d
  kubectl get nodes
  ```
- [x] Helm chart manifests validated (`helm lint helm/huntdevops`).

---

## 🏛️ Directory Separation

In production GitOps architecture:
* `helm/huntdevops/`: Defines **HOW** the application is packaged and templated.
* `infra/argo/`: Defines **WHERE**, **WHEN**, and **WHAT POLICIES** Argo CD uses to deploy to GKE.

```text
infra/argo/
├── application.yaml     # Declares target repo, revision, chart path, and sync policy
└── project.yaml         # Declares AppProject RBAC boundaries and allowed destinations
```

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
    repoURL: 'https://github.com/vikranth18devops/huntdevops.git'
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
* `automated.prune: true`: Automatically deletes resources from GKE if they are removed from Git.
* `automated.selfHeal: true`: Automatically rolls back unauthorized manual changes made to the cluster.
* `CreateNamespace=true`: Automatically creates the `huntdevops` namespace on GKE.

---

## 🚀 Step-by-Step Installation & Verification

### Step 1: Install Argo CD on GKE
```bash
# 1. Create argocd namespace
kubectl create namespace argocd

# 2. Apply official Argo CD manifests
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 3. Wait for Argo CD pods to become Ready
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s
```

---

### Step 2: Deploy HuntDevOps GitOps Manifests
```bash
# Apply Argo CD Project & Application
kubectl apply -f infra/argo/project.yaml
kubectl apply -f infra/argo/application.yaml
```

---

### Step 3: Access Argo CD UI & Retrieve Admin Password
```bash
# 1. Retrieve the initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo

# 2. Port-forward Argo CD Web UI to your local machine
kubectl port-forward svc/argocd-server -n argocd 8080:443
```
* Access the UI at: **`https://localhost:8080`**
* **Username**: `admin`
* **Password**: Paste the output from command 1 above.

---

### Step 4: Verify Application Sync Status
```bash
# Verify application status via Argo CD CLI
argocd app get huntdevops-app

# Check pods deployed in huntdevops namespace
kubectl get pods -n huntdevops
```

---

## ⏭️ Next Step

Review the complete Infrastructure as Code (IaC) implementation that provisions GKE, VPC, and Artifact Registry:
👉 **[08 - Terraform Modular GKE Infrastructure Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/08-terraform-gke-setup.md)**
