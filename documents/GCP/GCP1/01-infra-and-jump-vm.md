# Phase 1 — Infrastructure & Cluster Setup (GCP GKE)

**Goal:** Provision the complete GCP infrastructure with **`terraform apply`**, configure Google Kubernetes Engine (GKE) in `us-central1-a`, initialize Artifact Registry, enable Workload Identity, and connect `kubectl` from your local terminal or jump host.

**Time:** ~15–20 minutes (GKE control plane provisions in ~6–8 minutes).

---

## 🏛️ What Gets Built in This Phase

```text
                            GCP Project: project-e746f24e-392a-429f-a4d (us-central1)
   ┌─────────────────────────────────────────────────────────────────────────────────┐
   │                        VPC: prod-huntdevops-vpc                                 │
   │                                                                                 │
   │   Subnet (10.0.0.0/20) ──────────────────────────────────────────────────────   │
   │      ├── Secondary Pods Range     (10.16.0.0/14)                                │
   │      └── Secondary Services Range (10.20.0.0/20)                                │
   │                                                                                 │
   │   Cloud Router + Cloud NAT ──► Outbound Internet Egress for Nodes               │
   │                                                                                 │
   │   GKE Cluster (prod-huntdevops-gke)                                             │
   │   ├── Location: us-central1-a (Zonal - Free Control Plane)                      │
   │   ├── Node Pool: 2x e2-standard-2 nodes                                         │
   │   ├── Workload Identity enabled: project-e746f24e-392a-429f-a4d.svc.id.goog     │
   │   └── Persistent Disks: standard-rwo provisioner (pd.csi.storage.gke.io)        │
   │                                                                                 │
   │   Google Artifact Registry                                                      │
   │   └── Docker Repo: huntdevops-repo (us-central1-docker.pkg.dev)                 │
   │                                                                                 │
   │   Remote State Bucket: gs://huntdevops-tfstate-project-e746f24e-392a-429f-a4d   │
   └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ Prerequisites

| Tool / Resource | Minimum Version | How to verify |
| :--- | :--- | :--- |
| **GCP Project** | Active billing | `gcloud projects describe project-e746f24e-392a-429f-a4d` |
| **Terraform CLI** | ≥ 1.5.0 | `terraform -version` |
| **gcloud SDK** | ≥ 470.0.0 | `gcloud version` |
| **kubectl CLI** | ≥ 1.28.0 | `kubectl version --client` |

---

## 🚀 Step 1: Initialize Terraform Remote State & Modules

Change to the Terraform directory:
```bash
cd infra/terraform/gcp
```

Initialize the Terraform backend against the Cloud Storage remote state bucket:
```bash
terraform init -backend-config="bucket=huntdevops-tfstate-project-e746f24e-392a-429f-a4d" \
               -backend-config="prefix=terraform/state"
```

*Expected Output*:
```text
Successfully configured the backend "gcs"! Terraform will now use this backend.
Terraform has been successfully initialized!
```

---

## 🛠️ Step 2: Provision Infrastructure (`terraform apply`)

Review and apply the modular Terraform plan:

```bash
terraform apply -var-file="terraform.tfvars" -auto-approve
```

**Key Resources Provisioned**:
1. `module.vpc`: Custom VPC, Subnet, Secondary Pod/Service ranges, Cloud Router, and Cloud NAT.
2. `module.gke`: Zonal GKE cluster `prod-huntdevops-gke` in `us-central1-a` with node pool autoscaling.
3. `module.artifact_registry`: Docker repository `huntdevops-repo` in region `us-central1`.
4. `module.iam`: CI/CD Service Account with Artifact Registry Writer and GKE Developer roles.

---

## 🔌 Step 3: Connect `kubectl` to GKE Cluster

Fetch credentials for your cluster:

```bash
gcloud container clusters get-credentials prod-huntdevops-gke \
  --zone us-central1-a \
  --project project-e746f24e-392a-429f-a4d

# Verify cluster connectivity and node health
kubectl get nodes -o wide
```

*Expected Output*:
```text
NAME                                                  STATUS   ROLES    AGE   VERSION
gke-prod-huntdevops-gk-prod-node-pool-3ec4e514-b3h5   Ready    <none>   1d    v1.31.5-gke.1023000
gke-prod-huntdevops-gk-prod-node-pool-3ec4e514-lcdl   Ready    <none>   1d    v1.31.5-gke.1023000
```

---

## 🔐 Step 4: Grant GKE Node IAM Pull Permission

The GKE Compute Engine node service account must have read access to Artifact Registry:

```bash
PROJECT_NUM=$(gcloud projects describe project-e746f24e-392a-429f-a4d --format="value(projectNumber)")

gcloud projects add-iam-policy-binding project-e746f24e-392a-429f-a4d \
  --member="serviceAccount:${PROJECT_NUM}-compute@developer.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"
```

---

## ⏭️ Next Step

Now configure external traffic routing and Load Balancer provisioning:
👉 **[02 - Ingress & Load Balancer Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/02-ingress-and-loadbalancer.md)**
