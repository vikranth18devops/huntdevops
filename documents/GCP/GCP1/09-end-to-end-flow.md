# 09 - End-to-End Developer to Production Walkthrough

This document presents a complete, step-by-step walkthrough of how code flows from a developer's workstation into production on Google Kubernetes Engine (GKE) via GitHub Actions CI and Argo CD GitOps.

---

## 🔄 End-to-End Execution Flowchart

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
                                                   1. Push images tagged with GIT SHA
                                                   2. Update helm/huntdevops/values.yaml
                                                   3. Commit back to Git with [skip ci]
                                                             │
                                                             v
                                                   Argo CD GitOps Controller
                                                   1. Detects commit in values.yaml
                                                   2. Pulls updated Helm chart
                                                   3. Applies rolling update to GKE
                                                             │
                                                             v
                                                  Live Kubernetes Deployment
                                                  (Updated Frontend & Backend Pods)
```

---

## 🎬 Step-by-Step Execution Journey

### Step 1: Code Modification & Git Push
* **Developer Action**: A developer edits a feature in `frontend/src/App.tsx` or `backend/server/index.ts`.
* **Git Command**:
  ```bash
  git add .
  git commit -m "feat(ui): update dashboard metrics header"
  git push origin main
  ```

### Step 2: Continuous Integration Execution (GitHub Actions)
1. **Application Build**: Node 20 compiles the React distribution artifacts and TypeScript backend code.
2. **Parallel Container Security Scan**: Docker builds container images for frontend and backend, and Trivy scans both images.
3. **Security Check**:
   - If Trivy finds a Critical vulnerability in NPM or OS libraries, the build halts immediately with error code `1`.
   - If Trivy scan passes cleanly, execution proceeds to Stage 3.

### Step 3: Google Artifact Registry Publishing
1. GitHub Actions authenticates to GCP using the Service Account key stored in `${{ secrets.GCP_SA_KEY }}`.
2. The pipeline tags the Docker images with the exact Git commit SHA (`${{ github.sha }}`) and pushes them to `us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo/frontend:<SHA>` and `/backend:<SHA>`.

### Step 4: Automated Helm Tag Update & Git Commit
1. The CI runner updates `helm/huntdevops/values.yaml` setting `tag: "<SHA>"`.
2. The pipeline commits the modified `values.yaml` back to GitHub with the tag `[skip ci]`.
3. The `[skip ci]` flag ensures GitHub Actions does not trigger a second redundant build loop.

### Step 5: Argo CD GitOps Reconciliation & GKE Deployment
1. Argo CD running inside the GKE cluster polls the Git repository.
2. Argo CD detects that `helm/huntdevops/values.yaml` has changed to tag `<SHA>`.
3. Argo CD initiates a zero-downtime rolling update across the frontend and backend Kubernetes Deployments on GKE.
4. Old pods are gracefully terminated, and new pods running image `<SHA>` start serving traffic.
