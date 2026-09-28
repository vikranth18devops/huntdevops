# HuntDevOps: End-to-End GCP, GKE, CI/CD, Helm & GitOps Guide (GCP1)

Welcome to the **HuntDevOps GCP Architecture & GitOps Implementation Guide**. This document suite serves as the complete, production-grade guide for establishing an automated, secure CI/CD and GitOps deployment pipeline on **Google Cloud Platform (GCP)** using **Google Kubernetes Engine (GKE)**, **Artifact Registry**, **Trivy**, **Helm**, **Terraform**, and **Argo CD**.

> [!NOTE]
> This documentation suite is specifically structured for **freshers and beginners**. Every guide includes **prerequisites**, step-by-step copy-paste CLI commands, expected outputs, architecture diagrams, and real-world troubleshooting scenarios.

---

## 🛠️ Technology Stack & Architecture

```text
                                +-------------------------------------------------------+
                                |                    GitHub Repository                  |
                                |            (vikranth18devops/huntdevops)              |
                                +-------------------------------------------------------+
                                                            |
                                                            | Push to main
                                                            v
                                +-------------------------------------------------------+
                                |               GitHub Actions CI Pipeline              |
                                |                                                       |
                                |  1. Build React Frontend & Node Backend               |
                                |  2. Build Docker Container Images                     |
                                |  3. Run Trivy Container Security Scan                 |
                                |     (Fails pipeline if Critical/High vulnerabilities) |
                                +-------------------------------------------------------+
                                                            |
                                           Clean Security Scan Pass (0 CVEs)
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
                                                            | Auto-Sync / Helm Deploy
                                                            v
                                +-------------------------------------------------------+
                                |             Google Kubernetes Engine (GKE)            |
                                |                                                       |
                                |   [ Frontend Pods ]  [ Backend Pods ]  [ PostgreSQL ] |
                                +-------------------------------------------------------+
```

---

## 🚦 Recommended Execution Flow (Step-by-Step)

To provision and run this complete infrastructure without encountering errors, execute the guides in this order:

```text
Step 01: Prerequisites & Tooling (GCP APIs, Workload Identity Federation & GitHub Secrets)
   │
   ▼
Step 08: Terraform Infrastructure (Creates GCS Remote State, VPC, GKE in us-central1-a, Artifact Registry, IAM)
   │
   ▼
Step 02: GCP Artifact Registry & Docker Authentication (Connects local Docker to us-central1-docker.pkg.dev)
   │
   ▼
Step 03: Docker Multi-Stage Containerization (Builds & verifies Frontend & Backend images locally)
   │
   ▼
Step 04: Trivy Security Scanning (Enforces hard security gate: 0 Critical / High CVEs)
   │
   ▼
Step 05: GitHub Actions CI Pipeline (Automated testing, keyless WIF authentication, GAR push & Helm tagging)
   │
   ▼
Step 06: Helm Chart Architecture (Templates, values.yaml, resource manifests)
   │
   ▼
Step 07: Argo CD GitOps Setup (Deploys Argo CD on GKE, connects to GitHub repo, auto-syncs)
   │
   ▼
Step 09: End-to-End Walkthrough (Complete developer journey from code commit to live GKE pods)
   │
   ▼
Step 10: Troubleshooting & Recovery (Comprehensive diagnostic matrix for all 16 common error scenarios)
   │
   ▼
Step 11: Access URLs & Credentials (Live URLs, port-forwards, API endpoints, and admin passwords)
```

---

## 📂 Documentation Navigation Index

Below is the complete index of guides under `documents/GCP/GCP1/`:

| File | Module Title | Description |
| :--- | :--- | :--- |
| [`01-prerequisites.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/01-prerequisites.md) | **Prerequisites & Tooling** | Installation, verification, GCP project setup, API enablement, Workload Identity Federation (WIF), and GitHub repository secrets. |
| [`02-gcp-artifact-registry.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/02-gcp-artifact-registry.md) | **GCP Artifact Registry** | Dual provisioning (Terraform vs gcloud), Docker daemon auth, URL conventions, IAM writer permissions, and package inspection. |
| [`03-docker-setup.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/03-docker-setup.md) | **Docker Containerization** | Multi-stage Dockerfiles for React frontend (NGINX) and Node/Express backend, build optimizations (95% size reduction), and local health checks. |
| [`04-trivy-setup.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/04-trivy-setup.md) | **Trivy Vulnerability Scan** | Security gate policies (`CRITICAL,HIGH`), exit codes (`--exit-code 1`), local CLI testing, filesystem scans, and CI automation. |
| [`05-ci-pipeline.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/05-ci-pipeline.md) | **GitHub Actions CI Pipeline** | Multi-stage workflow (`.github/workflows/ci.yml`), parallel execution, keyless WIF authentication, immutable tag publishing, and `[skip ci]` loop prevention. |
| [`06-helm-setup.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/06-helm-setup.md) | **Helm Chart Architecture** | Chart directory structure (`helm/huntdevops`), parameter values, Kubernetes manifests (Frontend, Backend, PostgreSQL), linting, and dry-run testing. |
| [`07-argo-cd-setup.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/07-argo-cd-setup.md) | **Argo CD GitOps Setup** | Argo CD architecture on GKE, declarative `Application` & `AppProject` CRDs, automated reconciliation, and UI credential access. |
| [`08-terraform-gke-setup.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/08-terraform-gke-setup.md) | **Terraform Modular Infrastructure** | Modular IaaC (`vpc`, `gke`, `artifact_registry`, `iam`), GCS remote state backend with versioning, zonal placement (`us-central1-a`), and `terraform import` steps. |
| [`09-end-to-end-flow.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/09-end-to-end-flow.md) | **End-to-End Walkthrough** | Complete developer journey from local code change to live GKE pod update, detailing every transition step and trigger. |
| [`10-troubleshooting.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/10-troubleshooting.md) | **Comprehensive Troubleshooting** | Diagnostic triage and solutions for all 16 common error scenarios (WIF, 409 conflicts, state locks, GCE stockouts, ImagePullBackOff, CrashLoopBackOff). |
| [`11-access-urls-and-credentials.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/11-access-urls-and-credentials.md) | **Access URLs & Credentials** | Direct access URLs, port-forwarding commands, REST API endpoints, database credentials, and one-command multi-service launch script. |

---

## 🚀 Key Implementation & Architecture Principles

1. **Strict Naming Compliance**: The project name is **`huntdevops`**. All resources, directories, images, charts, and documentation strictly use `huntdevops`.
2. **Keyless Security (WIF)**: Uses **Workload Identity Federation** for GitHub Actions CI/CD to eliminate static downloadable `.json` service account private keys and comply with GCP organization policies.
3. **Remote State with Versioning**: Terraform state is stored securely in Google Cloud Storage (`gs://huntdevops-tfstate-project-e746f24e-392a-429f-a4d`) with object versioning and state locking enabled.
4. **Zonal Resilience & Free Control Plane**: GKE is provisioned in `us-central1-a` to eliminate multi-zone regional capacity stockouts (`GCE_STOCKOUT`) and take advantage of GCP's free zonal control plane.
5. **GKE Unified Runtime**: The complete multi-tier architecture—Frontend React Client, Backend Express API, and PostgreSQL Database—is deployed exclusively on **Google Kubernetes Engine (GKE)**.
6. **Automated Security Gate**: Container images are pushed to GCP Artifact Registry **only after Trivy scans return 0 Critical or High vulnerabilities**.
7. **GitOps Separation of Concerns**:
   - `helm/huntdevops/`: Application definitions and templates.
   - `infra/argo/`: Argo CD GitOps controller declarative manifests (`application.yaml`, `project.yaml`).
   - `infra/terraform/gcp/`: Modular Infrastructure as Code (IaaC).
