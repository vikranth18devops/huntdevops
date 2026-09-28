# 10 - Comprehensive Troubleshooting & Diagnostics Guide

This document provides a beginner-friendly diagnostic matrix for resolving issues across Docker, Trivy, GCP Artifact Registry, Helm, Kubernetes, Argo CD, and GitHub Actions CI/CD pipelines.

---

## 🔍 Diagnostic Matrix

### Issue 1: Docker Build Fails (`npm ci` or Compilation Error)
* **Problem**: `docker build` fails during the npm installation or TypeScript build stage.
* **Possible Cause**: Missing package dependency, incompatible Node version, or syntax errors in TypeScript code.
* **How to Check**:
  ```bash
  cd backend && npm run build
  cd ../frontend && npm run build
  ```
* **How to Fix**: Fix local code syntax errors or missing dependencies in `package.json` before running `docker build`.

---

### Issue 2: Trivy Security Scan Fails with Exit Code 1
* **Problem**: The CI pipeline stops at Stage 2 with message `Trivy Vulnerability Scan failed`.
* **Possible Cause**: Container base image (e.g. `node:20`) or NPM packages contain `CRITICAL` or `HIGH` security vulnerabilities.
* **How to Check**:
  ```bash
  trivy image --severity CRITICAL,HIGH huntdevops-backend:test
  ```
* **How to Fix**:
  1. Upgrade the base image in `Dockerfile` to a newer patch version (e.g. `node:20-alpine3.20`).
  2. Update vulnerable NPM packages by running `npm audit fix`.

---

### Issue 3: GCP Artifact Registry Authentication Error (`401 Unauthorized` / `Permission Denied`)
* **Problem**: `docker push` fails with `denied: Permission "artifactregistry.repositories.uploadArtifacts" denied`.
* **Possible Cause**: Docker CLI is not authenticated with GCP or the Service Account lacks `roles/artifactregistry.writer`.
* **How to Check**:
  ```bash
  gcloud artifacts repositories list
  ```
* **How to Fix**:
  1. Re-authenticate Docker daemon: `gcloud auth configure-docker us-central1-docker.pkg.dev --quiet`.
  2. Grant writer permission:
     ```bash
     gcloud projects add-iam-policy-binding project-e746f24e-392a-429f-a4d \
       --member="serviceAccount:huntdevops-cicd-sa@project-e746f24e-392a-429f-a4d.iam.gserviceaccount.com" \
       --role="roles/artifactregistry.writer"
     ```

---

### Issue 4: Helm Chart Linting or Rendering Fails (`helm lint` Error)
* **Problem**: `helm lint` returns indentation or missing variable errors.
* **Possible Cause**: Incorrect YAML syntax or referencing undefined values in templates.
* **How to Check**:
  ```bash
  helm lint helm/huntdevops
  helm template huntdevops helm/huntdevops
  ```
* **How to Fix**: Correct YAML spacing (Kubernetes YAML requires strict 2-space indentation) and ensure all template references match `values.yaml`.

---

### Issue 5: Kubernetes Pod in `ImagePullBackOff` State
* **Problem**: `kubectl get pods` shows `ImagePullBackOff` or `ErrImagePull`.
* **Possible Cause**: The image tag in `helm/huntdevops/values.yaml` does not exist in Artifact Registry or GKE lacks registry pull secret/Workload Identity access.
* **How to Check**:
  ```bash
  kubectl describe pod <pod-name> -n huntdevops
  ```
* **How to Fix**:
  1. Verify the exact tag uploaded to Artifact Registry:
     ```bash
     gcloud artifacts docker images list us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo/backend
     ```
  2. Ensure GKE node service account has `roles/artifactregistry.reader` permission.

---

### Issue 6: Kubernetes Pod in `CrashLoopBackOff` State
* **Problem**: Pod starts but repeatedly crashes and restarts.
* **Possible Cause**: Database connection failure, missing environment variables, or runtime application crash.
* **How to Check**:
  ```bash
  kubectl logs <pod-name> -n huntdevops --previous
  ```
* **How to Fix**:
  1. Check PostgreSQL service connectivity (`huntdevops-postgres:5432`).
  2. Inspect secret values in `huntdevops-postgres-secret`.

---

### Issue 7: Argo CD OutOfSync or Sync Failed Error
* **Problem**: Argo CD dashboard displays `OutOfSync` status or red sync error.
* **Possible Cause**: Git repository path incorrect, invalid Kubernetes manifest, or cluster permission issue.
* **How to Check**:
  ```bash
  argocd app get huntdevops-app
  ```
* **How to Fix**:
  1. Verify path in `infra/argo/application.yaml` points to `helm/huntdevops`.
  2. Trigger manual sync: `argocd app sync huntdevops-app`.

---

### Issue 8: Infinite GitHub Actions CI/CD Pipeline Loop
* **Problem**: GitHub Actions continuously triggers new pipeline runs after every deployment commit.
* **Possible Cause**: The automated Git commit updating `values.yaml` is missing the `[skip ci]` tag.
* **How to Check**: Inspect the commit message of the automated bot push in GitHub commit history.
* **How to Fix**: Ensure git commit message includes `[skip ci]`:
  ```bash
  git commit -m "chore(helm): update container image tags to ${{ github.sha }} [skip ci]"
  ```
