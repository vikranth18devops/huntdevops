# 04 - Trivy Container Vulnerability Scanning Guide

Security scanning is an essential component of modern DevSecOps pipelines. **Trivy** (by Aqua Security) is a comprehensive scanner that detects vulnerabilities in container images, file systems, and configuration files before images reach production registry repositories.

---

## 🎯 Security Objective & Policy Enforcement

In the **HuntDevOps** deployment flow, Trivy acts as a **hard security gate**:

```text
Build Docker Image ──► Trivy Vulnerability Scan ──┬── Scan FAILED (Critical/High CVEs) ──► STOP PIPELINE (Do Not Push)
                                                 │
                                                 └── Scan PASSED (Clean Image) ────────► Proceed to GAR & Helm Push
```

### Strict Policy Rules:
1. **Severity Filter**: `CRITICAL,HIGH`
2. **Exit Code Policy**: `--exit-code 1` (Returns failure status code `1` if any Critical or High vulnerabilities are found).
3. **Registry Protection**: Images are **never** published to Google Artifact Registry if Trivy returns an exit code of `1`.

---

## 💻 Running Trivy Scans Locally

### 1. Scan Local Docker Images
Before committing code, developers can test container images locally:

```bash
# Build test image
docker build -t huntdevops-backend:test ./backend

# Run Trivy vulnerability scan
trivy image --severity CRITICAL,HIGH --exit-code 1 huntdevops-backend:test
```

### 2. Scan Project Filesystem (Dependencies)
Scan `package-lock.json` and project files for known library vulnerabilities:

```bash
trivy fs --severity CRITICAL,HIGH .
```

### 3. Scan Infrastructure as Code (Terraform)
Scan Terraform modules for security misconfigurations:

```bash
trivy config ./infra/terraform/gcp
```

---

## ⚙️ CI Pipeline Action Integration

In GitHub Actions, Trivy is executed using `aquasecurity/trivy-action`:

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

### Parameter Explanation:
* `image-ref`: Reference tag of the locally built image.
* `format: 'table'`: Output format displayed in GitHub Actions job log.
* `exit-code: '1'`: Fails the job if matching vulnerabilities are identified.
* `ignore-unfixed: true`: Ignores CVEs where no official security patch exists yet.
* `severity: 'CRITICAL,HIGH'`: Targets severe vulnerability classifications.
