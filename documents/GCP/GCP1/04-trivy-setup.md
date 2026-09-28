# 04 - Trivy Container Vulnerability Scanning Guide

Security scanning is an essential component of modern DevSecOps pipelines. **Trivy** (by Aqua Security) detects CVEs (Common Vulnerabilities and Exposures) across container images, language dependencies, and infrastructure code before any image is allowed into production.

---

## 📋 Prerequisites

Before proceeding, ensure you have:
- [x] Completed **[01-prerequisites.md](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/01-prerequisites.md)** (Trivy scanner installed).
- [x] Completed **[03-docker-setup.md](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/03-docker-setup.md)** (Docker images built locally).
- [x] Verified Trivy installation:
  ```bash
  trivy --version
  ```

---

## 🎯 Security Objective & Policy Enforcement

In the **HuntDevOps** pipeline, Trivy acts as an automated **hard security gate**:

```text
Build Docker Image ──► Trivy Vulnerability Scan ──┬── Scan FAILED (Critical/High CVEs) ──► STOP PIPELINE (Exit 1)
                                                  │
                                                  └── Scan PASSED (0 Critical/High) ────► Proceed to Artifact Registry
```

### Strict Policy Rules:
1. **Severity Filter**: `CRITICAL,HIGH`
2. **Exit Code Policy**: `--exit-code 1` (Returns failure status code `1` if any Critical or High vulnerabilities are identified).
3. **Registry Protection**: Images are **never** published to Google Artifact Registry if Trivy returns exit code `1`.
4. **Ignore Unfixed**: `--ignore-unfixed=true` (Disregards known CVEs where upstream vendor patches do not yet exist).

---

## 💻 Running Trivy Scans Locally

### 1. Scan Container Images
Test your local Docker images before pushing to GitHub:

```bash
# Scan Frontend Container Image
trivy image --severity CRITICAL,HIGH --ignore-unfixed --exit-code 1 huntdevops-frontend:local

# Scan Backend Container Image
trivy image --severity CRITICAL,HIGH --ignore-unfixed --exit-code 1 huntdevops-backend:local
```

*Expected Output (Clean Pass)*:
```text
Total: 0 (UNKNOWN: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0)
```
Exit code is `0`.

---

### 2. Scan Project Filesystem (NPM Dependencies)
Scan `package-lock.json` files for vulnerable third-party dependencies:

```bash
# Scan entire project filesystem
trivy fs --severity CRITICAL,HIGH --ignore-unfixed .
```

---

### 3. Scan Terraform Infrastructure as Code (IaC)
Scan Terraform modules for security misconfigurations and best practices:

```bash
trivy config ./infra/terraform/gcp
```

---

## ⚙️ GitHub Actions CI Integration

In `.github/workflows/ci.yml`, Trivy is integrated using `aquasecurity/trivy-action`:

```yaml
- name: Run Trivy Vulnerability Scan - Backend Image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'huntdevops-backend:${{ github.sha }}'
    format: 'table'
    exit-code: '1'
    ignore-unfixed: true
    vuln-type: 'os,library'
    severity: 'CRITICAL,HIGH'
```

---

## ⏭️ Next Step

Once security scans pass cleanly, explore how GitHub Actions automates the entire build, scan, and push pipeline:
👉 **[05 - GitHub Actions CI Pipeline Deep-Dive](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/05-ci-pipeline.md)**
