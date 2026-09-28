# Phase 3 — GitHub Actions CI: Build, Security Scan & Tag Bump (GCP)

**Goal:** Configure the automated CI pipeline (`.github/workflows/ci.yml`) to compile code, build Docker images, enforce a **0 Critical/High CVE security gate with Trivy**, push images to **Google Artifact Registry (GAR)** via keyless Workload Identity Federation (WIF), and **commit the new image tags back** into `helm/huntdevops/values.yaml` with `[skip ci]`. Argo CD (Phase 4) takes it from there.

**Time:** ~15 minutes.

---

## 🏛️ What & Why: True GitOps Separation

We strictly separate **CI** (building, scanning, and publishing images) from **CD** (deploying to the cluster). The CI pipeline's only deployment action is a **git commit** updating the image tag in `helm/huntdevops/values.yaml`. Argo CD detects this Git change and reconciles the cluster state.

```text
       ┌─────────── Developer pushes to main ───────────┐
       │                                                 │
       ▼                                                 ▼
  Parallel Job: Build Frontend                     Parallel Job: Build Backend
  (Vite React compilation)                         (TypeScript compilation)
       │                                                 │
       ▼                                                 ▼
  Docker Multi-Stage Build                         Docker Multi-Stage Build
       │                                                 │
       ▼                                                 ▼
  Trivy Security Gate                              Trivy Security Gate
  (Exit code 1 if Critical/High CVEs)              (Exit code 1 if Critical/High CVEs)
       │                                                 │
       └────────────────────────┬────────────────────────┘
                                │ Both Security Scans Pass (0 CVEs)
                                ▼
         Authenticate to GCP via Workload Identity Federation (WIF)
                                │
                                ▼
         Push to Artifact Registry (us-central1-docker.pkg.dev)
         - .../huntdevops-repo/frontend:<GIT_SHA>
         - .../huntdevops-repo/backend:<GIT_SHA>
                                │
                                ▼
         Update helm/huntdevops/values.yaml with new tags
                                │
                                ▼
         Commit back to main with [skip ci] annotation
                                │
                                ▼
         Argo CD detects commit & auto-syncs (Phase 4)
```

---

## 🔐 Keyless Authentication via Workload Identity Federation (WIF)

Unlike traditional setups that store long-lived, high-risk `.json` service account private keys in GitHub Secrets, HuntDevOps uses **Workload Identity Federation (WIF)**:

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: 'projects/174952050783/locations/global/workloadIdentityPools/huntdevops-pool/providers/huntdevops-provider'
    service_account: 'huntdevops-cicd-sa@project-e746f24e-392a-429f-a4d.iam.gserviceaccount.com'
```

* Short-lived OIDC exchange (1-hour tokens)
* No static credentials stored in GitHub
* Fully compliant with GCP security posture constraints (`constraints/iam.disableServiceAccountKeyCreation`)

---

## 🛡️ Trivy Security Scan Gate

Before any image is published to Artifact Registry, `aquasecurity/trivy-action` scans both containers:

```yaml
- name: Run Trivy Vulnerability Scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'huntdevops-backend:test'
    format: 'table'
    exit-code: '1'
    ignore-unfixed: true
    vuln-type: 'os,library'
    severity: 'CRITICAL,HIGH'
```

* Base images are hardened using `RUN apk update && apk upgrade --no-cache` to eliminate operating system vulnerabilities.
* In the backend, unused bundled npm packages are pruned to prevent third-party library CVEs.

---

## 🔄 Automated Helm Tag Update & `[skip ci]` Loop Prevention

The push job automatically updates the container image tags in `helm/huntdevops/values.yaml` and commits the changes back to GitHub:

```bash
# Update tags specifically for frontend and backend, preserving postgresql: 16-alpine
sed -i.bak -e "/^frontend:/,/^backend:/ s|tag: \".*\"|tag: \"${IMAGE_TAG}\"|" helm/huntdevops/values.yaml
sed -i.bak -e "/^backend:/,/^postgresql:/ s|tag: \".*\"|tag: \"${IMAGE_TAG}\"|" helm/huntdevops/values.yaml
rm -f helm/huntdevops/values.yaml.bak

git config --local user.email "github-actions[bot]@users.noreply.github.com"
git config --local user.name "github-actions[bot]"
git add helm/huntdevops/values.yaml
git commit -m "chore(helm): update container image tags to ${IMAGE_TAG} [skip ci]"
git push origin main
```

> [!IMPORTANT]
> The `[skip ci]` annotation is mandatory. Without it, the automated commit would trigger another CI workflow run, causing an infinite build loop.

---

## ⏭️ Next Step

Now explore how Argo CD automatically syncs these updated manifests to GKE:
👉 **[04 - Argo CD GitOps Deployment Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/04-argocd-deploy.md)**
