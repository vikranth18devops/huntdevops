# 05 - GitHub Actions CI Pipeline Deep-Dive

This document provides a detailed breakdown of the automated **HuntDevOps** Continuous Integration (CI) and Continuous Delivery (CD) workflow located at `.github/workflows/ci.yml`.

---

## 📐 Workflow Architecture & Stage Flow

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
   (Do Not Publish)            1. Authenticate to GCP via Service Account
                               2. Push images with GIT SHA & latest tags
                               3. Update helm/huntdevops/values.yaml
                               4. Git commit with [skip ci] tag
```

---

## 🧩 Stage-by-Stage Detailed Breakdown

### Stage 1: Build Application Code (`build-application`)
* **Purpose**: Verifies that frontend React code and backend TypeScript code compile cleanly without syntax or typing errors.
* **Environment**: `ubuntu-latest` runner with Node.js 20 caching.
* **Commands**:
  ```bash
  cd frontend && npm ci && npm run build
  cd backend && npm ci && npm run build
  ```

---

### Stage 2: Docker Build & Trivy Security Scan (`docker-trivy-scan`)
* **Purpose**: Builds Docker images locally on the runner and executes Trivy security scans in parallel to application code checks.
* **Fail-Safe Gate**: If Trivy finds any `CRITICAL` or `HIGH` vulnerabilities, the job exits with code `1`, causing Stage 3 to be completely skipped.

---

### Stage 3: Push to Artifact Registry & Update Helm (`push-gar-and-update-helm`)
* **Conditions**:
  1. `needs: [build-application, docker-trivy-scan]` (Requires successful completion of both previous stages).
  2. `if: github.ref == 'refs/heads/main'` (Executes publishing only when code is merged to `main`).
  3. `!contains(github.event.head_commit.message, '[skip ci]')` (Prevents infinite CI trigger loops).
* **Actions Performed**:
  1. Authenticates to Google Cloud via `google-github-actions/auth@v2` using `${{ secrets.GCP_SA_KEY }}`.
  2. Configures Docker CLI for `us-central1-docker.pkg.dev`.
  3. Pushes Frontend & Backend images tagged with immutable commit SHA (`${{ github.sha }}`) and mutable `:latest`.
  4. Automatically updates `helm/huntdevops/values.yaml` image tags to `${{ github.sha }}`.
  5. Commits `values.yaml` back to `main` with commit message: `"chore(helm): update container image tags to <SHA> [skip ci]"`.

---

## 🔁 Preventing CI/CD Infinite Loop Issues

### The Problem
When the CI pipeline automatically updates `helm/huntdevops/values.yaml` and commits the change back to the `main` branch, that new commit would ordinarily trigger the GitHub Actions workflow again, resulting in an **infinite deployment loop**.

### The Solution
We enforce two protective mechanisms in `.github/workflows/ci.yml`:

1. **Commit Message Filter**:
   ```yaml
   if: "!contains(github.event.head_commit.message, '[skip ci]')"
   ```
   GitHub Actions automatically recognizes `[skip ci]` in the commit message and ignores the push event.

2. **Automated Commit Format**:
   ```bash
   git commit -m "chore(helm): update container image tags to ${{ github.sha }} [skip ci]"
   ```
