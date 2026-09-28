# ⚙️ GitHub Actions CI/CD Pipeline Documentation

This directory contains automated **Continuous Integration (CI)**, **Continuous Deployment (CD)**, and **Aqua Security Trivy Vulnerability Scanning** workflows for **HuntDevOps / LP-Lab**.

---

## 🛡️ Workflows Overview

### 1. `ci.yml` (Continuous Integration & Security Scanning)
- **Triggers**: Pull requests to `main` and pushes to feature/dev branches.
- **Jobs**:
  - `lint-and-test-frontend`: Validates React Vite TypeScript compilation.
  - `lint-and-test-backend`: Validates Express TypeScript compilation.
  - `trivy-security-scan`: Runs **Aqua Security Trivy** vulnerability and security checks:
    1. **Codebase Filesystem & NPM Dependency Scan** (`scan-type: 'fs'`).
    2. **Terraform IaC Misconfiguration Scan** (`scan-type: 'config'`).
    3. **Backend & Frontend Docker Container Image CVE Scans** (`image-ref`).

### 2. `cd.yml` (Continuous Deployment)
- **Triggers**: Pushes to `main` branch.
- **Jobs**:
  - `docker-build-push-acr`: Builds and pushes container images to Azure Container Registry (ACR).
  - `deploy-backend`: Builds Node.js API and deploys to Azure Linux Web App.
  - `deploy-frontend`: Builds React app (`dist/`) and deploys to Azure Static Web App.

---

## 🔑 Required GitHub Repository Secrets

Configure the following secrets in **GitHub Repository Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**:

| Secret Name | Description |
| :--- | :--- |
| `ACR_LOGIN_SERVER` | FQDN of Azure Container Registry (e.g. `crhuntdevops.azurecr.io`) |
| `ACR_USERNAME` | Admin Username for ACR |
| `ACR_PASSWORD` | Admin Password for ACR |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Publish profile XML for Azure Linux Web App |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token for Azure Static Web App |
