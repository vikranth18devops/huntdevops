# 05 - GitHub Actions CI Pipeline Deep-Dive

This document details the automated **HuntDevOps** Continuous Integration (CI) and Continuous Delivery (CD) pipeline configured in [.github/workflows/ci.yml](file:///Users/aarvik/Documents/huntdevops/.github/workflows/ci.yml).

---

## 📋 Prerequisites

Before pushing commits to trigger the CI pipeline, ensure:
- [x] Completed **[01-prerequisites.md](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/01-prerequisites.md)** (Configured GitHub Secrets: `GCP_PROJECT_ID`, `GCP_REGION`, `GAR_REPOSITORY`, `GCP_WIF_PROVIDER`, `GCP_SA_EMAIL`).
- [x] Completed **[02-gcp-artifact-registry.md](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/02-gcp-artifact-registry.md)** (Artifact Registry `huntdevops-repo` created and SA granted `roles/artifactregistry.writer`).
- [x] Workload Identity Federation (WIF) pool and provider created with repository binding.

---

## 📐 Workflow Architecture & Execution Stages

```text
Code Push / Pull Request
   │
   ├─────────────────────────────────────────┐
   ▼                                         ▼
[ Stage 1: Build Application Code ]   [ Stage 2: Docker Build & Trivy Scan ]
(Node.js 20, TypeScript compilation)   (Parallel container security check)
   │                                         │
   └────────────────────┬────────────────────┘
                        │ Both Jobs Succeed
                        v
          [ Check Branch & Commit Message ]
                        │
         ┌──────────────┴──────────────┐
         │ Not main OR contains        │ main branch & clean commit
         │ [skip ci]                   │
         ▼                             ▼
   Stop Pipeline              [ Stage 3: GAR Push & Helm Tag Update ]
   (Do Not Publish)            1. Authenticate to GCP via Workload Identity (WIF)
                               2. Push images with GIT SHA & latest tags
                               3. Update helm/huntdevops/values.yaml
                               4. Git commit with [skip ci] tag
```

---

## 🧩 Stage-by-Stage Breakdown

### Stage 1: Application Build (`build-application`)
* **Purpose**: Verifies that frontend React code and backend TypeScript code compile without syntax or typing errors.
* **Runner**: `ubuntu-latest` with Node.js 20 caching.
* **Commands**:
  ```bash
  cd frontend && npm ci && npm run build
  cd backend && npm ci && npm run build
  ```

---

### Stage 2: Docker Build & Security Scan (`docker-trivy-scan`)
* **Purpose**: Compiles Docker images on the runner and executes Trivy security checks in parallel.
* **Hard Gate**: If Trivy finds any `CRITICAL` or `HIGH` vulnerabilities, the job exits with code `1`, immediately halting the pipeline.

---

### Stage 3: Artifact Registry Push & Helm Update (`push-gar-and-update-helm`)
* **Execution Conditions**:
  1. `needs: [build-application, docker-trivy-scan]` (Requires both Stage 1 and 2 to succeed).
  2. `if: github.ref == 'refs/heads/main'` (Only executes on `main` branch).
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
