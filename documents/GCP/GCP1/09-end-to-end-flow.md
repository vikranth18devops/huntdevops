# 09 - End-to-End Developer to Production Walkthrough

This document presents the complete lifecycle journey of a code change in **HuntDevOps**—from a developer modifying code locally, through GitHub Actions CI and Trivy security scanning, to automated GitOps deployment on Google Kubernetes Engine (GKE) via Argo CD.

---

## 📋 Prerequisites

Before testing an end-to-end deployment run, ensure:
- [x] GKE Cluster is `RUNNING` on GCP:
  ```bash
  gcloud container clusters describe prod-huntdevops-gke --zone us-central1-a --project project-e746f24e-392a-429f-a4d --format="value(status)"
  ```
- [x] Argo CD is deployed and synced:
  ```bash
  kubectl get pods -n argocd
  argocd app get huntdevops-app
  ```
- [x] GitHub Secrets and Workload Identity Federation are configured as per **[01-prerequisites.md](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/01-prerequisites.md)**.

---

## 🔄 End-to-End Lifecycle Flowchart

```text
Developer modifies code (e.g. React UI or Express API)
        │
        ▼
Git commit & push to GitHub `main` branch
        │
        ▼
GitHub Actions CI Pipeline triggers (.github/workflows/ci.yml)
        │
        ├────────────────────────────────────────┐
        ▼                                        ▼
Stage 1: Build Application Code         Stage 2: Build Docker Image
(React build & TypeScript compilation)   & Run Trivy Security Scan
        │                                        │
        └────────────────────┬───────────────────┘
                             │ Both Jobs Succeed
                             v
               [ Trivy Scan Result Check ]
                             │
            ┌────────────────┴────────────────┐
            │ Scan Failed (Critical/High CVE)  │ Scan Passed (0 Critical/High)
            ▼                                 ▼
      Pipeline Stops                  [ Check Branch ]
      (No registry push)                      │
                               ┌──────────────┴──────────────┐
                               │ Not main                    │ main branch
                               ▼                             ▼
                         Do Not Publish            Stage 3: GAR Push & Helm Update
                                                   1. Authenticate via Workload Identity (WIF)
                                                   2. Push images tagged with GIT SHA
                                                   3. Update helm/huntdevops/values.yaml
                                                   4. Commit back to Git with [skip ci]
                                                             │
                                                             v
                                                   Argo CD GitOps Controller
                                                   1. Detects commit in values.yaml
                                                   2. Pulls updated Helm chart
                                                   3. Applies zero-downtime rolling update
                                                             │
                                                             v
                                                  Live Kubernetes Deployment
                                                  (Updated Frontend & Backend Pods on GKE)
```

---

## 🎬 Step-by-Step Lifecycle Walkthrough

### Step 1: Developer Commits Code
A developer makes an application update (e.g. updating a UI component or an API endpoint) and pushes to the `main` branch:
```bash
# Make a sample edit
echo "// Updated at $(date)" >> frontend/src/App.tsx

# Commit and push
git add frontend/src/App.tsx
git commit -m "feat(frontend): update dashboard UI timestamp"
git push origin main
```

---

### Step 2: GitHub Actions Automated CI Execution
1. **Stage 1 (Application Build)**: Runs on `ubuntu-latest`. Installs Node.js 20 dependencies and compiles React assets and TypeScript binaries.
2. **Stage 2 (Security Gate)**: Builds Docker containers and executes `trivy-action` scanning for `CRITICAL` or `HIGH` vulnerabilities.
   - If any vulnerabilities are detected, the pipeline halts immediately with exit code `1`.
   - If 0 Critical/High vulnerabilities exist, Stage 3 is triggered.

---

### Step 3: Container Publishing via Workload Identity Federation
1. Authenticates to Google Cloud using short-lived OpenID Connect (OIDC) tokens via Workload Identity Federation (no downloadable `.json` key files).
2. Builds and tags production container images with the unique Git commit SHA (`${{ github.sha }}`) and `:latest`.
3. Pushes images to Google Artifact Registry:
   - `us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo/frontend:<SHA>`
   - `us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo/backend:<SHA>`

---

### Step 4: Automated Helm Tag Update (`[skip ci]`)
1. The CI runner automatically updates `tag: "<SHA>"` in [helm/huntdevops/values.yaml](file:///Users/aarvik/Documents/huntdevops/helm/huntdevops/values.yaml).
2. Commits and pushes the change back to `main` with `[skip ci]`:
   ```bash
   git commit -m "chore(helm): update container image tags to ${{ github.sha }} [skip ci]"
   git push origin main
   ```
3. The `[skip ci]` annotation guarantees GitHub Actions will **not** trigger a redundant recursive build loop.

---

### Step 5: Argo CD GitOps Sync & GKE Deployment
1. Argo CD monitors repository [vikranth18devops/huntdevops](https://github.com/vikranth18devops/huntdevops).
2. Detects the new commit updating `values.yaml`.
3. Initiates an automated rolling update on GKE:
   - New pods with image tag `<SHA>` are created.
   - Readiness probes pass.
   - Old pods are gracefully terminated with zero downtime.

---

### Step 6: Live Production Verification
Inspect the running pods and container images on GKE:
```bash
# Check pod rollout status
kubectl get pods -n huntdevops -l app=frontend
kubectl get pods -n huntdevops -l app=backend

# Verify running container image tag
kubectl get deployment huntdevops-frontend -n huntdevops -o jsonpath="{.spec.template.spec.containers[0].image}" && echo
```

---

## ⏭️ Next Step

If any stage fails or produces an unexpected error, consult the comprehensive troubleshooting matrix:
👉 **[10 - Comprehensive Troubleshooting & Diagnostics](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/10-troubleshooting.md)**
