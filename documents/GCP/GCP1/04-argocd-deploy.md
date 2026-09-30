# Phase 4 — Deploy HuntDevOps with Argo CD on GKE

**Goal:** Establish a declarative GitOps delivery loop where **every push to `main` is automatically reconciled onto the GKE cluster by Argo CD**. After this phase:

```text
you edit code  →  git push  →  GitHub Actions (build + Trivy scan + push to GAR + bump values.yaml)
                                          │
                                          ▼
                               Argo CD detects values.yaml change
                                          │
                                          ▼
                               Argo CD syncs helm/huntdevops
                                          │
                                          ▼
                               Zero-downtime rolling update across GKE
```

There is **zero manual `helm upgrade` or `kubectl apply`** anywhere in this deployment loop once established.

---

## ✅ Prerequisites

| Requirement | How to check |
| :--- | :--- |
| **GKE cluster reachable** | `kubectl get nodes` returns 2 Ready nodes |
| **CI pipeline functional** | Commits to `main` push images to `us-central1-docker.pkg.dev` |
| **Helm chart validated** | `helm lint helm/huntdevops` passes with 0 errors |

---

## 🛠️ Step 1: Install Argo CD on GKE

Argo CD manifests include complex CustomResourceDefinitions (CRDs). To avoid client-side annotation overflow errors (`metadata.annotations: Too long: may not be more than 262144 bytes`), always install using **server-side apply**:

```bash
# 1. Create dedicated argocd namespace
kubectl create namespace argocd

# 2. Apply official Argo CD manifests using server-side apply with force conflicts
kubectl apply --server-side --force-conflicts -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 3. Wait for Argo CD server deployment to become available
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s
kubectl get pods -n argocd
```

---

## 📄 Step 2: Deploy HuntDevOps GitOps Manifests

Deploy the `AppProject` RBAC boundary and the declarative `Application`:

```bash
# 1. Apply AppProject definition
kubectl apply -f infra/argo/project.yaml

# 2. Apply Application definition (creates huntdevops namespace and syncs Helm chart)
kubectl apply -f infra/argo/application.yaml
```

### Key Declarative Configuration (`infra/argo/application.yaml`):
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: huntdevops-app
  namespace: argocd
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

* `automated.prune: true`: Removes orphaned Kubernetes resources if deleted from Git.
* `automated.selfHeal: true`: Automatically reverts out-of-band manual changes made to the cluster.
* `CreateNamespace=true`: Automatically creates the `huntdevops` namespace before deploying resources.

---

## 🌐 Step 3: Access Argo CD Web UI & Retrieve Admin Credentials

Argo CD is accessible via two routes:
1. **Custom Domain (Unified Edge via Traefik)**: **[https://huntdevops.online/argocd/](https://huntdevops.online/argocd/)** (or `https://huntdevops.online/argocd`)
2. **Direct GCP L4 LoadBalancer**: **[https://136.112.167.2](https://136.112.167.2)**

| Attribute | Value |
| :--- | :--- |
| **Domain URL** | **`https://huntdevops.online/argocd/`** |
| **Direct LoadBalancer** | **`https://136.112.167.2`** |
| **Default Username** | `admin` |
| **Admin Password** | **`vmvSfJ72EtCyt1oX`** |

### ⚙️ Required Subpath Configuration for Reverse Proxies (`/argocd`):
When serving Argo CD under a subpath behind Traefik or any reverse proxy, the API server and UI base href must match:

1. **Configure `argocd-cmd-params-cm`**:
   ```yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: argocd-cmd-params-cm
     namespace: argocd
   data:
     server.basehref: "/argocd"
     server.rootpath: "/argocd"
     server.insecure: "true"
   ```

2. **Configure `argocd-cm`**:
   ```yaml
   data:
     url: "https://huntdevops.online/argocd"
   ```

3. **Pass Flags to `deployment/argocd-server`**:
   ```bash
   kubectl patch deployment argocd-server -n argocd --type='json' -p='[
     {"op": "replace", "path": "/spec/template/spec/containers/0/command", "value": ["/usr/local/bin/argocd-server"]},
     {"op": "replace", "path": "/spec/template/spec/containers/0/args", "value": ["--basehref", "/argocd", "--rootpath", "/argocd", "--insecure"]}
   ]'
   ```

### Retrieve or Verify Password from Kubernetes Secret:
```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo ""
```

*(Optional) Local port-forward alternative*:
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:80
# Access at http://localhost:8080/argocd/
```

---

## 🔍 Step 4: Verify Multi-Tier Application Rollout

Confirm that Argo CD has deployed all three tiers into the `huntdevops` namespace:

```bash
# 1. Check Argo CD Application sync state
kubectl get application huntdevops-app -n argocd

# 2. Check all pods and persistent volume claims
kubectl get pods,pvc -n huntdevops -o wide
```

*Expected Output*:
```text
NAME                                       READY   STATUS    RESTARTS   AGE
pod/huntdevops-backend-74b6545d5d-667h2    1/1     Running   0          5m
pod/huntdevops-backend-74b6545d5d-chccp    1/1     Running   0          5m
pod/huntdevops-frontend-dfbfcc8dd-b6gjj    1/1     Running   0          5m
pod/huntdevops-frontend-dfbfcc8dd-fg9gt    1/1     Running   0          5m

# Note: PostgreSQL runs on Google Cloud SQL (10.154.0.3) managed externally via Terraform
```

---

## ⏭️ Next Step

Now map your own custom domain to the application using GoDaddy:
👉 **[05 - DNS & GoDaddy Domain Setup Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/05-dns-and-godaddy.md)**
