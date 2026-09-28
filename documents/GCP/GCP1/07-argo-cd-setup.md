# 07 - Argo CD GitOps Architecture & Setup Guide

**Argo CD** is a declarative, GitOps continuous delivery tool for Kubernetes. It continuously monitors your Git repository ([vikranth18devops/huntdevops](https://github.com/vikranth18devops/huntdevops)) and ensures that the live state of your GKE cluster matches the desired state declared in `helm/huntdevops`.

In this setup, Argo CD automatically creates the **`huntdevops`** namespace on GKE and orchestrates a complete 3-tier production stack:
1. **Frontend**: React TypeScript single-page application served via Nginx (Port 80)
2. **Backend**: Express Node.js REST API with health and activity logging (Port 4000)
3. **Database**: PostgreSQL 16 StatefulSet with PersistentVolumeClaim (`standard-rwo`, 10Gi) and Secret-backed credentials (Port 5432)

---

## 📋 Prerequisites

Before installing Argo CD and syncing the application, ensure:
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
- [x] **GKE Node Service Account Image Pull Permission**:
  The GKE node service account must have permission to pull container images from Google Artifact Registry. Run:
  ```bash
  PROJECT_NUM=$(gcloud projects describe project-e746f24e-392a-429f-a4d --format="value(projectNumber)")
  
  gcloud projects add-iam-policy-binding project-e746f24e-392a-429f-a4d \
    --member="serviceAccount:${PROJECT_NUM}-compute@developer.gserviceaccount.com" \
    --role="roles/artifactregistry.reader"
  ```
- [x] Helm chart manifests validated (`helm lint helm/huntdevops`).

---

## 🏛️ Directory Separation

In production GitOps architecture:
* `helm/huntdevops/`: Defines **HOW** the application and database are packaged and templated.
* `infra/argo/`: Defines **WHERE**, **WHEN**, and **WHAT POLICIES** Argo CD uses to deploy to GKE.

```text
infra/argo/
├── application.yaml     # Declares target repo, revision, chart path, namespace, and sync policy
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
  project: huntdevops-project
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
* `automated.selfHeal: true`: Automatically reconciles unauthorized manual changes made to the cluster.
* `CreateNamespace=true`: Automatically creates the dedicated **`huntdevops`** namespace on GKE before applying resources.
* `finalizers: resources-finalizer.argocd.argoproj.io`: Ensures cascading cleanup of deployed resources if the Argo CD Application is deleted.

---

## 🚀 Step-by-Step Installation & Verification

### Step 1: Install Argo CD on GKE

> [!IMPORTANT]
> Modern Argo CD manifests include large Custom Resource Definitions (CRDs). Standard `kubectl apply -f` can fail with: `The CustomResourceDefinition "applicationsets.argoproj.io" is invalid: metadata.annotations: Too long: may not be more than 262144 bytes`.
> Always use `--server-side --force-conflicts` to prevent annotation overflow.

```bash
# 1. Create argocd namespace
kubectl create namespace argocd

# 2. Apply official Argo CD manifests using server-side apply
kubectl apply --server-side --force-conflicts -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 3. Wait for all Argo CD components to become Ready
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s
kubectl get pods -n argocd
```

*Expected Output*:
```text
NAME                                                READY   STATUS    RESTARTS   AGE
argocd-application-controller-0                     1/1     Running   0          2m
argocd-applicationset-controller-7f95b9cd7c-ld7qq   1/1     Running   0          2m
argocd-dex-server-8666767789-24vk7                  1/1     Running   0          2m
argocd-notifications-controller-797f48b4-g4w85      1/1     Running   0          2m
argocd-redis-6fd5864464-v6rqm                       1/1     Running   0          2m
argocd-repo-server-c4977564f-zvs7k                  1/1     Running   0          2m
argocd-server-59bd8b5c4-j2c87                       1/1     Running   0          2m
```

---

### Step 2: Deploy HuntDevOps GitOps Manifests

Apply the AppProject RBAC definition and the Application manifest:
```bash
# 1. Apply Argo CD Project
kubectl apply -f infra/argo/project.yaml

# 2. Apply Argo CD Application (triggers automatic deployment of frontend, backend, and postgresql)
kubectl apply -f infra/argo/application.yaml
```

---

### Step 3: Access Argo CD Web UI & Retrieve Admin Credentials

```bash
# 1. Retrieve the initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo

# 2. Port-forward Argo CD Web UI to your local machine
kubectl port-forward svc/argocd-server -n argocd 8080:443
```
* Access the Web UI in your browser: **`https://localhost:8080`**
* **Username**: `admin`
* **Password**: The password printed in step 1.

---

### Step 4: Verify Full Multi-Tier Stack on GKE

Once Argo CD completes the sync, verify that the `huntdevops` namespace was created and all components are active:

```bash
# 1. Verify Argo CD Application sync status
kubectl get application huntdevops-app -n argocd

# 2. List all resources in huntdevops namespace
kubectl get all,pvc -n huntdevops
```

*Expected Pod and PVC Output*:
```text
NAME                                       READY   STATUS    RESTARTS   AGE
pod/huntdevops-backend-667f475bb9-5h56r    1/1     Running   0          1m
pod/huntdevops-backend-667f475bb9-t6fln    1/1     Running   0          1m
pod/huntdevops-frontend-5747c9f6db-55dx6   1/1     Running   0          1m
pod/huntdevops-frontend-5747c9f6db-p68sg   1/1     Running   0          1m
pod/huntdevops-postgres-0                  1/1     Running   0          1m

NAME                                                        STATUS   VOLUME         CAPACITY   STORAGECLASS
persistentvolumeclaim/postgres-data-huntdevops-postgres-0   Bound    pvc-xxxx       10Gi       standard-rwo

NAME                          TYPE        CLUSTER-IP     PORT(S)
service/huntdevops-backend    ClusterIP   10.20.12.199   4000/TCP
service/huntdevops-frontend   ClusterIP   10.20.15.114   80/TCP
service/huntdevops-postgres   ClusterIP   10.20.14.106   5432/TCP
```

---

### Step 5: Test End-to-End Database Connectivity

Verify that the Express backend is actively communicating with the PostgreSQL database:
```bash
kubectl run test-curl --image=curlimages/curl --restart=Never --rm -i -n huntdevops -- \
  curl -s http://huntdevops-backend:4000/api/health
```

*Expected JSON Response*:
```json
{
  "status": "online",
  "database": "PostgreSQL (Connected)",
  "timestamp": "2026-09-28T13:54:12.771Z"
}
```

---

## ⏭️ Next Step

Review the complete Infrastructure as Code (IaC) implementation that provisions GKE, VPC, and Artifact Registry:
👉 **[08 - Terraform Modular GKE Infrastructure Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/08-terraform-gke-setup.md)**
