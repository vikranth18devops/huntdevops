# Deploying HuntDevOps to GCP GKE — End-to-End Guide

A complete, **beginner-friendly**, hands-on guide that takes you from an empty Google Cloud Platform (GCP) project to **HuntDevOps running on Google Kubernetes Engine (GKE) with GitOps, CI/CD, and a live persistent PostgreSQL database**.

🎯 **Audience:** Freshers / 1–2 years experienced DevOps engineers.  
🪜 **Style:** Every command explained, every gotcha documented. No "just trust me" steps.

---

## 🌐 Where You'll End Up

```text
        🌐  http://136.116.192.196               <- Live Frontend Application UI
        🌐  http://136.116.192.196/api/health    <- Live Express Backend REST API
        🌐  https://136.112.167.2                <- Live Argo CD GitOps Dashboard
                               │
                               ▼
               ┌───────────────────────────────┐
               │   GCP TCP Network LoadBalancer│ (Single dedicated static public IP)
               └───────────────┬───────────────┘
                               ▼
         ┌───────────────────────────────────────────┐
         │        GKE Cluster (us-central1-a)        │
         │                                           │
         │   huntdevops namespace                    │
         │   ├── huntdevops-frontend (2 replicas, 80)│
         │   │   └── Nginx reverse proxy /api/       │
         │   ├── huntdevops-backend  (2 replicas, 4000)
         │   └── huntdevops-postgres (StatefulSet)   │
         │       └── 10Gi standard-rwo PersistentDisk│
         │                                           │
         │   argocd namespace                        │
         │   └── Argo CD Server, Controller, Redis   │
         │                                           │
         │   cert-manager namespace (TLS automation) │
         └─────────────────────┬─────────────────────┘
                               ▲
                               │ GitOps sync
                  ┌────────────┴─────────────┐
                  │ GitHub Repo (huntdevops) │
                  │  CI builds & scans →     │
                  │  Artifact Registry +     │
                  │  bumps values.yaml       │
                  └──────────────────────────┘
```

---

## 🚦 The Phases

Follow them **in order**. Each phase is self-contained but builds on the previous one.

| # | Phase | Goal | Time | What Gets Created |
| :---: | :--- | :--- | :---: | :--- |
| **1** | [Infra & Cluster Setup](01-infra-and-jump-vm.md) | Provision VPC, GKE, and Artifact Registry via Terraform | ~20 min | Custom VPC, Subnets, Cloud NAT, zonal GKE cluster (`us-central1-a`), Artifact Registry repo |
| **2** | [Ingress & Load Balancer](02-ingress-and-loadbalancer.md) | Expose the app to the internet via GCP Load Balancer | ~5 min | Google Cloud Network Load Balancer, Public IP `136.116.192.196`, Nginx reverse proxy |
| **3** | [GitHub Actions CI](03-github-actions-cicd.md) | Build images, Trivy scan (0 CVEs), WIF push to GAR & bump values.yaml | ~15 min | Keyless CI pipeline, hardened Docker containers, automated tag updates with `[skip ci]` |
| **4** | [Argo CD Deploy](04-argocd-deploy.md) | Declarative GitOps deployment on GKE with auto-sync | ~15 min | Argo CD controller, AppProject, Application, `huntdevops` namespace, multi-tier rollout |
| **5** | [DNS & GoDaddy](05-dns-and-godaddy.md) | Map custom domain to the application | ~15 min | GoDaddy DNS A records, apex & subdomain routing, propagation verification |
| **6** | [Monitoring & Logging](06-monitoring-and-logging.md) | Centralized metrics, Cloud Logging, Prometheus & Grafana | ~20 min | Google Cloud Logging, Cloud Monitoring, Prometheus, Grafana dashboards |
| **7** | [HTTPS & Let's Encrypt](07-https-letsencrypt-and-routes.md) | Free SSL/TLS certificates via cert-manager | ~15 min | cert-manager operator, ClusterIssuer, automated 90-day TLS certificates |
| **8** | [PostgreSQL Database Guide](08-postgresql-database-guide.md) | Query tables, run ad-hoc SQL, backups & restore | Post-deploy | StatefulSet persistence, table schemas, `psql` queries, backup procedures |

---

## 🛠️ Companion References & Diagnostic Guides

| Reference Guide | Description |
| :--- | :--- |
| [Comprehensive Troubleshooting Guide](10-troubleshooting.md) | Diagnostic matrix and solutions for 16 real-world error scenarios (WIF, 403 Forbidden, state locks, annotation limits, module loading). |
| [Live Access URLs & Credentials Guide](11-access-urls-and-credentials.md) | Quick reference for live public URLs, external IPs, default admin credentials, and one-click launch script. |

---

## 🔑 Key Architecture & Production Principles

1. **Strict Naming Compliance**: The project name is **`huntdevops`**. All resources, directories, images, charts, and documentation strictly use `huntdevops`.
2. **Keyless Security (WIF)**: Uses **Workload Identity Federation** for GitHub Actions CI/CD to eliminate static downloadable `.json` service account private keys and comply with GCP organization security policies.
3. **Remote State with Versioning**: Terraform state is stored securely in Google Cloud Storage (`gs://huntdevops-tfstate-project-e746f24e-392a-429f-a4d`) with object versioning and state locking enabled.
4. **Zonal Resilience & Free Control Plane**: GKE is provisioned in `us-central1-a` to eliminate multi-zone regional capacity stockouts (`GCE_STOCKOUT`) and take advantage of GCP's free zonal control plane.
5. **GKE Unified Runtime**: The complete multi-tier architecture—Frontend React Client, Backend Express API, and PostgreSQL Database—is deployed exclusively on **Google Kubernetes Engine (GKE)**.
6. **Automated Security Gate**: Container images are pushed to GCP Artifact Registry **only after Trivy scans return 0 Critical or High vulnerabilities**.
7. **GitOps Separation of Concerns**:
   - `helm/huntdevops/`: Application definitions and templates.
   - `infra/argo/`: Argo CD GitOps controller declarative manifests (`application.yaml`, `project.yaml`).
   - `infra/terraform/gcp/`: Modular Infrastructure as Code (IaaC).
