# HuntDevOps: End-to-End GCP, GKE, CI/CD, Helm & GitOps Guide (GCP1)

Welcome to the **HuntDevOps GCP Architecture & GitOps Implementation Guide**. This document serves as the master entry point and index for establishing a production-grade, secure, automated CI/CD and GitOps deployment pipeline on **Google Cloud Platform (GCP)** using **Google Kubernetes Engine (GKE)**, **Artifact Registry**, **Trivy**, **Helm**, and **Argo CD**.

> [!NOTE]
> This documentation suite is specifically structured for **freshers and beginners**. Every guide includes fundamental concepts, pre-installation steps, command-line verification, step-by-step configurations, architecture diagrams, and real-world troubleshooting scenarios.

---

## 🛠️ Technology Stack & Architecture

```text
                                +-------------------------------------------------------+
                                |                    GitHub Repository                  |
                                |                     (huntdevops)                      |
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
                                           Clean Security Scan Pass
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

## 📂 Documentation Navigation Index

Below is the ordered list of detailed guides under `documents/GCP/GCP1/`:

| File | Module Title | Description |
| :--- | :--- | :--- |
| [`01-prerequisites.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/01-prerequisites.md) | **Prerequisites & Tooling** | Installation, verification, and CLI configuration for Git, Docker, gcloud CLI, Trivy, Helm, kubectl, Argo CD CLI, and Terraform. |
| [`02-gcp-artifact-registry.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/02-gcp-artifact-registry.md) | **GCP Artifact Registry** | Step-by-step setup of Artifact Registry, Docker authentication, service accounts, IAM roles, and repository URLs. |
| [`03-docker-setup.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/03-docker-setup.md) | **Docker Containerization** | Multi-stage Dockerfiles for React frontend (Nginx) and Node/Express backend, build optimization, and local verification. |
| [`04-trivy-setup.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/04-trivy-setup.md) | **Trivy Vulnerability Scan** | Image scanning policies, severity filtering (`CRITICAL,HIGH`), exit codes, local CLI testing, and automated security enforcement. |
| [`05-ci-pipeline.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/05-ci-pipeline.md) | **GitHub Actions CI Pipeline** | Pipeline architecture, multi-stage job execution, parallel scanning, branch restrictions (`main`), automated `values.yaml` tagging, and `[skip ci]` loop prevention. |
| [`06-helm-setup.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/06-helm-setup.md) | **Helm Chart Architecture** | Chart layout (`helm/huntdevops`), parameter values, Kubernetes resource templates (Frontend, Backend, Stateful PostgreSQL), and linting/rendering commands. |
| [`07-argo-cd-setup.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/07-argo-cd-setup.md) | **Argo CD GitOps Setup** | Argo CD architecture on GKE, declarative `Application` and `AppProject` manifests, automated reconciliation, and UI monitoring. |
| [`08-terraform-gke-setup.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/08-terraform-gke-setup.md) | **Terraform Modular Infrastructure** | Infrastructure as Code (IaaC) modular structure (`vpc`, `gke`, `artifact_registry`, `iam`), variables, execution lifecycle, and provisioning steps. |
| [`09-end-to-end-flow.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/09-end-to-end-flow.md) | **End-to-End Walkthrough** | Complete developer journey from local code change to live Kubernetes pod deployment on GKE, detailing every transition step and trigger. |
| [`10-troubleshooting.md`](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/10-troubleshooting.md) | **Comprehensive Troubleshooting** | Beginner-friendly diagnostic matrix formatted as `Problem → Possible Cause → How to Check → How to Fix`. |

---

## 🚀 Key Implementation Principles

1. **Strict Naming Compliance**: The project name is **`huntdevops`**. All resources, directories, images, charts, and documentation strictly use `huntdevops`.
2. **GKE Unified Runtime**: The complete multi-tier architecture—Frontend React Client, Backend Express API, and PostgreSQL Database—is deployed exclusively on **Google Kubernetes Engine (GKE)**.
3. **Automated Security Gate**: Container images are pushed to GCP Artifact Registry **only after Trivy scans return 0 Critical or High vulnerabilities**.
4. **GitOps Separation of Concerns**:
   - `helm/huntdevops/` contains application definitions and templates.
   - `infra/helm/` contains environment overrides (`values-dev.yaml`, `values-prod.yaml`).
   - `infra/argo/` contains Argo CD GitOps controller application resources (`application.yaml`, `project.yaml`).
   - `infra/terraform/gcp/` contains modular IaaC HCL files.
