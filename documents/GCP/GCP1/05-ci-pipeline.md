# 05 - GitHub Actions CI Pipeline Deep-Dive

This document details the automated **HuntDevOps** Continuous Integration (CI) and Continuous Delivery (CD) pipeline configured in [.github/workflows/ci.yml](file:///Users/aarvik/Documents/huntdevops/.github/workflows/ci.yml).

---

## 📋 Prerequisites

Before pushing commits to trigger the CI pipeline, ensure:
- [x] Completed **[01-prerequisites.md](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/01-prerequisites.md)** (Configured GitHub Secrets: `GCP_PROJECT_ID`, `GCP_REGION`, `GAR_REPOSITORY`, `GCP_WIF_PROVIDER`, `GCP_SA_EMAIL`).
- [x] Completed **[02-gcp-artifact-registry.md](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/02-gcp-artifact-registry.md)** (Artifact Registry `huntdevops-repo` created and SA granted `roles/artifactregistry.writer`).
- [x] Workload Identity Federation (WIF) pool and provider created with repository binding.

---

## 📐 Multi-Stage Parallel Architecture with Dependency Conditions

The pipeline is structured into independent, parallel stages using `needs` dependency conditions to maximize execution speed and isolate failures:

```text
                        ┌───────────────────────────────────────┐
                        │        Git Push / Pull Request        │
                        └───────────────────┬───────────────────┘
                                            │
                 ┌──────────────────────────┴──────────────────────────┐
                 ▼                                                     ▼
     [ 1. Build Frontend ]                                 [ 1. Build Backend ]
     (React / Vite Build)                                  (TypeScript API Build)
                 │                                                     │
                 │ needs: [build-frontend]                             │ needs: [build-backend]
                 ▼                                                     ▼
     [ 2. Scan Frontend ]                                  [ 2. Scan Backend ]
     (Docker build & Trivy)                                (Docker build & Trivy)
                 │                                                     │
                 └──────────────────────────┬──────────────────────────┘
                                            │
                                            │ needs: [scan-frontend, scan-backend]
                                            ▼
                           [ Check Branch & Commit Message ]
                                            │
                          ┌─────────────────┴─────────────────┐
                          │ Not main OR [skip ci]             │ main & 0 CVEs
                          ▼                                   ▼
                    Stop Pipeline                   [ 3. Publish & Update ]
                    (Do Not Publish)                1. WIF Auth to GCP
                                                    2. Push images with GIT SHA
                                                    3. Update values.yaml
                                                    4. Commit with [skip ci]
```

---

## 🧩 Stage-by-Stage Breakdown

### Stage 1 (Parallel): Application Code Builds
* **`build-frontend`**: Runs on `ubuntu-latest`. Installs Node.js 20 dependencies and compiles the React distribution artifacts.
  ```bash
  cd frontend && npm ci && npm run build
  ```
* **`build-backend`**: Runs in parallel on `ubuntu-latest`. Compiles TypeScript code to production JavaScript.
  ```bash
  cd backend && npm ci && npm run build
  ```

---

### Stage 2 (Parallel): Docker Build & Trivy Security Scans
* **`scan-frontend`** (`needs: [build-frontend]`):
  - Builds `huntdevops-frontend:${{ github.sha }}`.
  - Runs Trivy vulnerability scan.
  - Image is hardened with `apk update && apk upgrade --no-cache` to ensure **0 Critical/High CVEs**.
* **`scan-backend`** (`needs: [build-backend]`):
  - Builds `huntdevops-backend:${{ github.sha }}` in parallel.
  - Runs Trivy vulnerability scan.
* **Hard Gate**: If either scan fails with an exit code of `1`, Stage 3 is blocked.

---

### Stage 3: Artifact Registry Push & Helm Update (`push-gar-and-update-helm`)
* **Execution Conditions**:
  1. `needs: [scan-frontend, scan-backend]` (Executes only when both parallel security scans succeed).
  2. `if: github.ref == 'refs/heads/main'` (Only deploys code merged into `main`).
  3. `!contains(github.event.head_commit.message, '[skip ci]')` (Prevents recursive trigger loops).

* **Authentication via Workload Identity Federation (Keyless)**:
  ```yaml
  - name: Authenticate to Google Cloud Platform
    uses: google-github-actions/auth@v2
    with:
      workload_identity_provider: ${{ secrets.GCP_WIF_PROVIDER || 'projects/174952050783/locations/global/workloadIdentityPools/huntdevops-pool/providers/huntdevops-provider' }}
      service_account: ${{ secrets.GCP_SA_EMAIL || 'huntdevops-cicd-sa@project-e746f24e-392a-429f-a4d.iam.gserviceaccount.com' }}
  ```

* **Image Tagging & Registry Push**:
  Tags images with the immutable Git commit SHA (`${{ github.sha }}`) and `:latest`:
  ```bash
  docker push us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo/frontend:${{ github.sha }}
  docker push us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo/backend:${{ github.sha }}
  ```

* **Automated Helm Chart Update**:
  Updates `helm/huntdevops/values.yaml` dynamically using `sed`:
  ```bash
  sed -i 's/tag: .*/tag: "'"${IMAGE_TAG}"'"/g' helm/huntdevops/values.yaml
  ```

---

## 🔁 Infinite Loop Prevention (`[skip ci]`)

When the CI pipeline updates `values.yaml` and commits back to `main`, that commit would normally trigger a new pipeline run. We prevent this using two guardrails:

1. **Workflow Condition**:
   ```yaml
   if: "!contains(github.event.head_commit.message, '[skip ci]')"
   ```
2. **Automated Commit Format**:
   ```bash
   git commit -m "chore(helm): update container image tags to ${{ github.sha }} [skip ci]"
   git push origin main
   ```

---

## ⏭️ Next Step

Now explore the Helm chart packaging and templates that deploy these images onto Kubernetes:
👉 **[06 - Helm Chart Structure & Deployment](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/06-helm-setup.md)**
