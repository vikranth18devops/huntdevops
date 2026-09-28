# 01 - Prerequisites & GCP Setup Guide

This document covers all required tools, dependencies, Google Cloud project setup, API enablement, and GitHub secrets necessary to operate the **HuntDevOps** ecosystem cleanly from scratch without permission or policy errors.

---

## 📋 Prerequisites Checklist

Before executing any commands, ensure you have:
- [x] A **Google Cloud Platform (GCP)** account with billing enabled.
- [x] A terminal shell (`bash` or `zsh`) on macOS or Linux.
- [x] Administrative access to your GitHub repository ([vikranth18devops/huntdevops](https://github.com/vikranth18devops/huntdevops)).

---

## 🛠️ Required Tools & Verification

Install and verify all required CLI tools on your workstation:

| Tool | Purpose | Minimum Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Git** | Distributed Version Control | `2.40+` | `git --version` |
| **Docker** | Container Engine & Build CLI | `24.0+` | `docker --version` |
| **gcloud CLI** | Google Cloud SDK & Auth | `450.0+` | `gcloud --version` |
| **Trivy** | Container Security Scanner | `0.45+` | `trivy --version` |
| **Helm** | Kubernetes Package Manager | `v3.12+` | `helm version` |
| **kubectl** | Kubernetes CLI | `v1.28+` | `kubectl version --client` |
| **Argo CD CLI** | GitOps Management | `v2.9+` | `argocd version --client` |
| **Terraform** | Infrastructure as Code (IaaC) | `1.5.0+` | `terraform -version` |

### Installation Commands:
```bash
# macOS (using Homebrew)
brew install git docker aquasecurity/trivy/trivy helm kubernetes-cli argocd terraform
brew install --cask google-cloud-sdk
```

---

## ☁️ Google Cloud Project Configuration

Set environment variables and configure your active Google Cloud project:

```bash
# Set GCP Project variables
export GCP_PROJECT_ID="project-e746f24e-392a-429f-a4d"
export GCP_REGION="us-central1"
export GCP_ZONE="us-central1-a"

# Authenticate with your Google account
gcloud auth login

# Set default project and compute configurations
gcloud config set project ${GCP_PROJECT_ID}
gcloud config set compute/region ${GCP_REGION}
gcloud config set compute/zone ${GCP_ZONE}
```

---

## 🔌 Enable Required GCP APIs Upfront

To prevent `API not enabled` or permission failures during Terraform runs or pipeline execution, enable all essential Google Cloud service APIs in one step:

```bash
gcloud services enable \
  container.googleapis.com \
  artifactregistry.googleapis.com \
  compute.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  storage.googleapis.com \
  cloudresourcemanager.googleapis.com \
  --project=${GCP_PROJECT_ID}
```

*Expected Output*: Operation finishes with exit code `0`.

---

## 🔐 Workload Identity Federation (Keyless CI/CD)

> ⚠️ **Important Security Notice**: Google Cloud enforces `constraints/iam.disableServiceAccountKeyCreation` on projects to prevent leaking `.json` private keys. The modern, Google-recommended solution is **Workload Identity Federation (WIF)**, which enables GitHub Actions to authenticate via OpenID Connect (OIDC) without private key files.

### 1. Create Workload Identity Pool
```bash
gcloud iam workload-identity-pools create "huntdevops-pool" \
  --project="${GCP_PROJECT_ID}" \
  --location="global" \
  --display-name="HuntDevOps GitHub Actions Pool"
```

### 2. Create GitHub OIDC Provider
```bash
gcloud iam workload-identity-pools providers create-oidc "huntdevops-provider" \
  --project="${GCP_PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="huntdevops-pool" \
  --display-name="HuntDevOps GitHub Provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='vikranth18devops/huntdevops'"
```

### 3. Grant Service Account Impersonation Rights to GitHub Repo
```bash
# Obtain Project Number
PROJECT_NUMBER=$(gcloud projects describe ${GCP_PROJECT_ID} --format="value(projectNumber)")

# Grant workloadIdentityUser role
gcloud iam service-accounts add-iam-policy-binding "huntdevops-cicd-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${GCP_PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/huntdevops-pool/attribute.repository/vikranth18devops/huntdevops"
```

---

## 🔑 Required GitHub Repository Secrets

Configure the following secrets in your GitHub repository under **Settings → Secrets and variables → Actions**:
👉 **[https://github.com/vikranth18devops/huntdevops/settings/secrets/actions](https://github.com/vikranth18devops/huntdevops/settings/secrets/actions)**

| Secret Name | Description | Value |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | GCP Project Identifier | `project-e746f24e-392a-429f-a4d` |
| `GCP_REGION` | Target GCP Region | `us-central1` |
| `GAR_REPOSITORY` | Artifact Registry Repo Name | `huntdevops-repo` |
| `GCP_WIF_PROVIDER` | WIF Provider Resource Path | `projects/174952050783/locations/global/workloadIdentityPools/huntdevops-pool/providers/huntdevops-provider` |
| `GCP_SA_EMAIL` | CI/CD Service Account Email | `huntdevops-cicd-sa@project-e746f24e-392a-429f-a4d.iam.gserviceaccount.com` |

---

## ⏭️ Next Step

Once prerequisites are verified and APIs are enabled, proceed to:
👉 **[02 - GCP Artifact Registry Setup & Authentication](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/02-gcp-artifact-registry.md)**
