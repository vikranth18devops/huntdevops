# 08 - Terraform Modular GKE Infrastructure Guide

This document details the complete step-by-step procedure to provision and manage the Google Cloud Platform infrastructure for **HuntDevOps** using modular **Terraform** and a remote Google Cloud Storage (GCS) state backend.

---

## 📋 Prerequisites

Before running Terraform commands, ensure:
- [x] Completed **[01-prerequisites.md](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/01-prerequisites.md)** (Terraform installed: `terraform -version >= 1.5.0`).
- [x] Authenticated with Google Cloud:
  ```bash
  gcloud auth application-default login
  gcloud config set project project-e746f24e-392a-429f-a4d
  ```
- [x] All required GCP APIs enabled (`container`, `compute`, `artifactregistry`, `iam`, `storage`).

---

## 🏗️ Modular Architecture Layout

Terraform code is organized under `infra/terraform/gcp/` using reusable modules:

```text
infra/terraform/gcp/
├── main.tf                    # Root composition file with GCS backend & modules
├── variables.tf               # Global input variables (includes region & zone)
├── outputs.tf                 # Cluster endpoints, registry URLs & SA outputs
├── terraform.tfvars.example   # Sample environment values with defaults
└── modules/
    ├── vpc/                   # Custom VPC network & secondary CIDR subnets (Pods & Services)
    ├── artifact_registry/     # Docker Artifact Registry repository
    ├── gke/                   # Autoscale GKE cluster & node pools (supports zonal/regional)
    └── iam/                   # CI/CD service account & RBAC role bindings
```

---

## 📦 Module Descriptions

### 1. VPC Network Module (`modules/vpc`)
* Provisions a custom VPC (`google_compute_network`) without default auto-subnets.
* Creates a dedicated GKE subnetwork (`google_compute_subnetwork`) with secondary IP ranges for **Pods** (`10.16.0.0/14`) and **Services** (`10.20.0.0/20`).

### 2. Artifact Registry Module (`modules/artifact_registry`)
* Provisions the Docker repository `huntdevops-repo` in region `us-central1`.

### 3. GKE Cluster Module (`modules/gke`)
* Creates a VPC-native GKE cluster with **Workload Identity** enabled.
* Supports **zonal placement** (`us-central1-a`) to prevent multi-zone regional capacity stockouts (`GCE_STOCKOUT`) and provide a free GCP control plane.
* Managed Node Pool with autoscaling (`1` to `5` nodes) and spot node support (`e2-standard-2`).

### 4. IAM Module (`modules/iam`)
* Creates the service account `huntdevops-cicd-sa`.
* Binds `roles/artifactregistry.writer` and `roles/container.developer` permissions.

---

## ⚙️ Step-by-Step Execution Guide

Follow these steps in order to provision or update the GCP infrastructure:

### Step 1: Create the Remote State GCS Bucket & Enable Versioning
Terraform state is stored securely in Google Cloud Storage with object versioning enabled:
```bash
# Set your GCP Project ID
export GCP_PROJECT_ID="project-e746f24e-392a-429f-a4d"

# 1. Create the GCS bucket
gcloud storage buckets create gs://huntdevops-tfstate-${GCP_PROJECT_ID} \
  --project=${GCP_PROJECT_ID} \
  --location=us-central1 \
  --uniform-bucket-level-access

# 2. Enable object versioning (protects against corruption and accidental deletion)
gcloud storage buckets update gs://huntdevops-tfstate-${GCP_PROJECT_ID} --versioning
```

---

### Step 2: Configure Environment Variables
Navigate to the Terraform directory and configure your `terraform.tfvars`:
```bash
cd infra/terraform/gcp

# Copy sample values to active tfvars
cp terraform.tfvars.example terraform.tfvars
```

Ensure `terraform.tfvars` contains your active GCP project details:
```hcl
gcp_project_id = "project-e746f24e-392a-429f-a4d"
project_name   = "huntdevops"
environment    = "prod"
region         = "us-central1"
zone           = "us-central1-a"
repository_id  = "huntdevops-repo"
node_count     = 2
machine_type   = "e2-standard-2"
```

---

### Step 3: Initialize Terraform with GCS Remote Backend
Downloads provider plugins (Google v5.x), initializes modules, and connects to the GCS remote state backend:
```bash
terraform init
```

> 💡 **Migrating existing state**: If you previously had a local `terraform.tfstate`, run `terraform init -migrate-state` and type `yes` to upload it to GCS.

---

### Step 4: Validate Configuration Syntax
Verify syntax, module references, and variable definitions:
```bash
terraform validate
```
Expected output: `Success! The configuration is valid.`

---

### Step 5: (Optional) Import Pre-existing GCP Resources
If Artifact Registry or the Service Account was created previously via `gcloud` CLI, import them into Terraform state so they don't produce `409 Already Exists` errors:
```bash
# Import Artifact Registry Repository
terraform import -var-file="terraform.tfvars" \
  module.artifact_registry.google_artifact_registry_repository.repo \
  projects/project-e746f24e-392a-429f-a4d/locations/us-central1/repositories/huntdevops-repo

# Import CI/CD Service Account
terraform import -var-file="terraform.tfvars" \
  module.iam.google_service_account.cicd_sa \
  projects/project-e746f24e-392a-429f-a4d/serviceAccounts/huntdevops-cicd-sa@project-e746f24e-392a-429f-a4d.iam.gserviceaccount.com
```

---

### Step 6: Generate Execution Plan
Preview all resources to be added, changed, or destroyed:
```bash
terraform plan -var-file="terraform.tfvars"
```

---

### Step 7: Apply & Provision Infrastructure
Execute the deployment to provision the VPC, Artifact Registry, GKE Cluster, and IAM bindings:
```bash
terraform apply -var-file="terraform.tfvars" -auto-approve
```
*(GKE provisioning typically takes ~5 to 10 minutes).*

---

### Step 8: Connect `kubectl` to GKE Cluster
After provisioning completes, configure your local `kubectl` context:
```bash
gcloud container clusters get-credentials prod-huntdevops-gke \
  --zone us-central1-a \
  --project project-e746f24e-392a-429f-a4d
```

Verify that the Kubernetes worker nodes are `Ready`:
```bash
kubectl get nodes -o wide
```

---

### Step 9: Verify Remote State in GCS
Verify that your Terraform state file is safely stored in Google Cloud Storage:
```bash
# Check state file object in GCS
gcloud storage ls "gs://huntdevops-tfstate-project-e746f24e-392a-429f-a4d/**"

# List all tracked resources from remote state
terraform state list
```

---

## 🔧 Common Troubleshooting & Recovery

### 1. State Locking (`Error acquiring the state lock`)
* **Cause**: Another Terraform operation is currently running or a previous process crashed without releasing the lock.
* **Fix**: If no other apply is running, unlock with:
  ```bash
  terraform force-unlock <LOCK_ID>
  ```

### 2. GCE Stockout (`GCE_STOCKOUT: Not enough resources available`)
* **Cause**: A regional cluster attempts to deploy nodes across all zones in a region, encountering temporary VM stockouts in specific zones.
* **Fix**: Use zonal deployment (`zone = "us-central1-a"`). Zonal clusters also provide 1 free GKE control plane per GCP billing account.
