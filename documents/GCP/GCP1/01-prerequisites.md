# 01 - Prerequisites & System Tooling Guide

This document covers all required tools, dependencies, credentials, and verification steps necessary to operate the **HuntDevOps** GCP/GKE deployment ecosystem from scratch.

---

## 🛠️ Required Tools Overview

| Tool | Purpose | Minimum Recommended Version |
| :--- | :--- | :--- |
| **Git** | Distributed Version Control | `2.40+` |
| **Docker** | Containerization Engine & CLI | `24.0+` |
| **Google Cloud CLI (`gcloud`)** | GCP Management & Authentication | `450.0+` |
| **Trivy** | Container & Code Vulnerability Scanner | `0.45+` |
| **Helm** | Kubernetes Package Manager | `v3.12+` |
| **kubectl** | Kubernetes Command-line Client | `v1.28+` |
| **Argo CD CLI** | GitOps Controller Management | `v2.9+` |
| **Terraform** | Infrastructure as Code (IaaC) | `1.5.0+` |

---

## 📥 Detailed Installation & Verification Steps

### 1. Git
* **What it is**: Distributed source control system to track changes and push code to GitHub.
* **Why it is required**: Source code hosting, triggering GitHub Actions CI/CD workflows, and GitOps state management.
* **Installation**:
  ```bash
  # macOS (Homebrew)
  brew install git

  # Ubuntu / Debian
  sudo apt-get update && sudo apt-get install -y git
  ```
* **Verification**:
  ```bash
  git --version
  ```

---

### 2. Docker
* **What it is**: Platform for building, running, and managing containerized applications.
* **Why it is required**: To compile application code into standard OCI container images for the frontend and backend.
* **Installation**:
  - Download [Docker Desktop for Mac / Windows](https://www.docker.com/products/docker-desktop/).
  - For Linux: `sudo apt-get install -y docker.io docker-buildx-plugin`.
* **Verification**:
  ```bash
  docker --version
  docker info
  ```

---

### 3. Google Cloud CLI (`gcloud`)
* **What it is**: Command-line tool to manage GCP resources, authentication, and Artifact Registry credentials.
* **Why it is required**: Authenticates your local machine and CI pipeline to Google Cloud APIs and configures Docker login.
* **Installation**:
  ```bash
  # macOS
  brew install --cask google-cloud-sdk

  # Linux
  curl https://sdk.cloud.google.com | bash
  exec -l $SHELL
  ```
* **Verification**:
  ```bash
  gcloud --version
  gcloud auth list
  ```

---

### 4. Trivy Scanner
* **What it is**: Security scanner for container images, file systems, and infrastructure code.
* **Why it is required**: Scans Docker images for CVEs (Common Vulnerabilities and Exposures) before pushing to Artifact Registry.
* **Installation**:
  ```bash
  # macOS
  brew install aquasecurity/trivy/trivy

  # Linux (Ubuntu)
  sudo apt-get install wget apt-transport-https gnupg lsb-release -y
  wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
  echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main | sudo tee -a /etc/apt/sources.list.d/trivy.list
  sudo apt-get update && sudo apt-get install trivy -y
  ```
* **Verification**:
  ```bash
  trivy --version
  ```

---

### 5. Helm
* **What it is**: Package manager for Kubernetes that templates and manages applications via Charts.
* **Why it is required**: Manages deployment manifests, service definitions, secrets, and image tag updates for HuntDevOps.
* **Installation**:
  ```bash
  # macOS
  brew install helm

  # Linux
  curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
  ```
* **Verification**:
  ```bash
  helm version
  ```

---

### 6. `kubectl`
* **What it is**: Command-line tool for inspecting, managing, and debugging Kubernetes clusters.
* **Why it is required**: Interacts directly with GKE cluster nodes, pods, services, and namespaces.
* **Installation**:
  ```bash
  gcloud components install kubectl
  # OR via brew: brew install kubernetes-cli
  ```
* **Verification**:
  ```bash
  kubectl version --client
  ```

---

### 7. Argo CD CLI
* **What it is**: CLI tool to inspect and trigger synchronization on Argo CD GitOps applications.
* **Why it is required**: Allows developers to view app health, manual sync status, and logs from the terminal.
* **Installation**:
  ```bash
  # macOS
  brew install argocd

  # Linux
  curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
  sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
  rm argocd-linux-amd64
  ```
* **Verification**:
  ```bash
  argocd version --client
  ```

---

### 8. Terraform
* **What it is**: Declarative Infrastructure as Code (IaaC) tool.
* **Why it is required**: Provisions GCP VPC networking, GKE Kubernetes clusters, Artifact Registry repositories, and IAM roles automatically.
* **Installation**:
  ```bash
  # macOS
  brew install terraform

  # Linux
  sudo apt-get update && sudo apt-get install -y gnupg software-properties-common
  wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
  echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
  sudo apt-get update && sudo apt-get install terraform
  ```
* **Verification**:
  ```bash
  terraform -version
  ```

---

## 🔑 Required GitHub Repository Secrets

Configure the following secrets under **GitHub Repository Settings → Secrets and variables → Actions**:

| Secret Name | Description | Example / Required Value |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | GCP Project Identifier | `project-e746f24e-392a-429f-a4d` |
| `GCP_REGION` | GCP Target Region | `us-central1` |
| `GAR_REPOSITORY` | Artifact Registry Repository Name | `huntdevops-repo` |
| `GCP_SA_KEY` | Base64 or JSON contents of GCP CI/CD Service Account Key | `{"type": "service_account", ...}` |
