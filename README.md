# HuntDevOps: Production GCP, GKE, CI/CD, Helm & GitOps Architecture

Welcome to **HuntDevOps**, a full-stack web application featuring a **React (Vite/Nginx)** frontend, an **Express (TypeScript/Node.js)** backend API, and a **PostgreSQL** relational database engine—fully containerized and deployed onto **Google Kubernetes Engine (GKE)** using automated **GitHub Actions CI/CD**, **Trivy** security scanning, **Google Artifact Registry (GAR)**, **Helm**, **Argo CD GitOps**, and **Terraform**.

---

## 🏗️ Architecture Overview

```text
                                +-------------------------------------------------------+
                                |                    GitHub Repository                  |
                                |                     (huntdevops)                      |
                                +-------------------------------------------------------+
                                                            |
                                                            | Code Push / PR
                                                            v
                                +-------------------------------------------------------+
                                |               GitHub Actions CI Pipeline              |
                                |                                                       |
                                |  Stage 1: Build Application (Frontend & Backend)      |
                                |  Stage 2: Build Docker & Run Trivy Security Scan      |
                                |           (Fails on Critical/High vulnerabilities)    |
                                +-------------------------------------------------------+
                                                            |
                                           Scan Passed & Branch == main
                                                            |
                                                            v
                                +-------------------------------------------------------+
                                |               GCP Artifact Registry (GAR)             |
                                |      us-central1-docker.pkg.dev/.../huntdevops        |
                                +-------------------------------------------------------+
                                                            |
                                                            | Auto-update helm/huntdevops/values.yaml
                                                            v
                                +-------------------------------------------------------+
                                |                 Argo CD (GitOps Controller)           |
                                |      Monitors Git Repo -> Detects Tag Update          |
                                +-------------------------------------------------------+
                                                            |
                                                            | Automated Reconciliation & Sync
                                                            v
                                +-------------------------------------------------------+
                                |             Google Kubernetes Engine (GKE)            |
                                |                                                       |
                                |   [ Frontend Pods ]  [ Backend Pods ]  [ PostgreSQL ] |
                                +-------------------------------------------------------+
```

---

## 📁 Repository Directory Layout

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml                      # Unified GitHub Actions CI/CD Pipeline
├── backend/                            # Express.js TypeScript API & Dockerfile
├── frontend/                           # React + Vite Client Application & Dockerfile
├── helm/
│   └── huntdevops/                     # Main Application Helm Chart
│       ├── Chart.yaml
│       ├── values.yaml                 # Dynamically updated image tags
│       └── templates/                  # Frontend, Backend, Postgres, Ingress templates
├── infra/
│   ├── argo/                           # Argo CD GitOps Application & Project manifests
│   │   ├── application.yaml
│   │   ├── project.yaml
│   │   └── README.md
│   ├── helm/                           # Environment override values (dev/prod)
│   │   ├── values-dev.yaml
│   │   ├── values-prod.yaml
│   │   └── README.md
│   └── terraform/
│       └── gcp/                        # Modular Infrastructure as Code (IaaC)
│           ├── main.tf
│           ├── variables.tf
│           ├── outputs.tf
│           ├── terraform.tfvars.example
│           └── modules/                # Reusable modules (vpc, gke, artifact_registry, iam)
└── documents/
    └── GCP/
        └── GCP1/                       # Step-by-Step Fresher Documentation Suite
            ├── README.md
            ├── 01-prerequisites.md
            ├── 02-gcp-artifact-registry.md
            ├── 03-docker-setup.md
            ├── 04-trivy-setup.md
            ├── 05-ci-pipeline.md
            ├── 06-helm-setup.md
            ├── 07-argo-cd-setup.md
            ├── 08-terraform-gke-setup.md
            ├── 09-end-to-end-flow.md
            └── 10-troubleshooting.md
```

---

## 📚 Complete Fresher Implementation Documentation

For step-by-step installation guides, command verification, diagrams, and troubleshooting matrix, navigate to [`documents/GCP/GCP1/`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/README.md):

1. [`01-prerequisites.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/01-prerequisites.md) - System Tooling Setup & Requirements
2. [`02-gcp-artifact-registry.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/02-gcp-artifact-registry.md) - GCP Artifact Registry & Docker Authentication
3. [`03-docker-setup.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/03-docker-setup.md) - Multi-stage Containerization Strategy
4. [`04-trivy-setup.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/04-trivy-setup.md) - Container Security Scanning & Policies
5. [`05-ci-pipeline.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/05-ci-pipeline.md) - GitHub Actions CI/CD Pipeline Architecture
6. [`06-helm-setup.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/06-helm-setup.md) - Helm Chart Architecture & Parameter Values
7. [`07-argo-cd-setup.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/07-argo-cd-setup.md) - Argo CD GitOps Setup on GKE
8. [`08-terraform-gke-setup.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/08-terraform-gke-setup.md) - Modular Terraform Infrastructure as Code
9. [`09-end-to-end-flow.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/09-end-to-end-flow.md) - End-to-End Walkthrough & Sequence Flow
10. [`10-troubleshooting.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/10-troubleshooting.md) - Comprehensive Troubleshooting Matrix

---

## ⚡ Quick Validation Commands

### Helm Linting & Template Rendering
```bash
# Validate chart syntax
helm lint helm/huntdevops

# Render template manifests
helm template huntdevops helm/huntdevops
```

### Terraform Infrastructure Validation
```bash
cd infra/terraform/gcp
terraform init
terraform validate
```
