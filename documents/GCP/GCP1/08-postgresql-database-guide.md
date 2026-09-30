# Phase 8 — Google Cloud SQL for PostgreSQL Architecture & Operations Guide

This comprehensive reference document covers the **Google Cloud SQL for PostgreSQL 16** managed database architecture, automated Terraform provisioning, network topologies (Private IP VPC Peering & Public IP access), pgAdmin connection setups, schema auto-migrations, and production maintenance for **HuntDevOps**.

---

## 🏛️ Architecture: Cloud SQL vs In-Cluster PostgreSQL

HuntDevOps runs on **Google Cloud SQL for PostgreSQL** as an enterprise-grade managed database instead of an in-cluster StatefulSet.

```text
       ┌─────────────────────────────────────────────────────────────┐
       │             Google Cloud Platform (us-central1)             │
       │                                                             │
       │  VPC Network: prod-huntdevops-vpc (10.0.0.0/20)             │
       │  ┌───────────────────────────────────────────────────────┐  │
       │  │ GKE Cluster (prod-huntdevops-gke) in us-central1-a    │  │
       │  │ ┌───────────────────────────────────────────────────┐ │  │
       │  │ │ huntdevops-frontend (React SPA on Nginx)         │ │  │
       │  │ └─────────────────────────┬─────────────────────────┘ │  │
       │  │                           ▼ (/api)                    │  │
       │  │ ┌───────────────────────────────────────────────────┐ │  │
       │  │ │ huntdevops-backend (Express REST API)            │ │  │
       │  │ └─────────────────────────┬─────────────────────────┘ │  │
       │  └───────────────────────────┼───────────────────────────┘  │
       │                              │                              │
       │                              │ Private IP (10.154.0.3:5432) │
       │                              │ via Service Networking       │
       │                              ▼ (VPC Peering)                │
       │  ┌───────────────────────────────────────────────────────┐  │
       │  │ Google Cloud SQL for PostgreSQL 16 (Enterprise)       │  │
       │  │ Instance: prod-huntdevops-psql-2eecc976               │  │
       │  │ Tier: db-g1-small (1.7 GiB RAM, 20 GiB PD_SSD)        │  │
       │  │ Database: huntdevops                                  │  │
       │  │ User: postgres                                        │  │
       │  │                                                       │  │
       │  │ • Private Address: 10.154.0.3 (Internal GKE Traffic)  │  │
       │  │ • Public Address: 35.232.123.246 (pgAdmin / DBeaver)  │  │
       │  │ • Automated Daily Backups + Query Insights            │  │
       │  └───────────────────────────────────────────────────────┘  │
       └──────────────────────────────▲──────────────────────────────┘
                                      │ Direct Public IP: 35.232.123.246:5432
                                      │ (Authorized Networks: 0.0.0.0/0)
                               ┌──────┴──────────────────┐
                               │ Developer Local Laptop  │
                               │ pgAdmin 4 / DBeaver     │
                               └─────────────────────────┘
```

### Key Advantages of Google Cloud SQL:
| Capability | In-Cluster StatefulSet (Legacy) | Google Cloud SQL (Active Production) |
| :--- | :--- | :--- |
| **Compute Overhead** | Consumes GKE node CPU & memory | Dedicated managed GCP compute (offloaded from GKE) |
| **Storage Resiliency** | Tied to zonal persistent volume claim | Fully managed SSD storage with auto-resize enabled |
| **Backup & Recovery** | Manual scripts or Velero required | Automated daily backups, retention policies & point-in-time recovery |
| **High Availability** | Complex manual patroni/failover setup | Native Google Cloud regional/zonal HA management |
| **Monitoring** | Custom Prometheus exporters | Native Google Cloud Monitoring & Query Insights enabled |
| **External GUI Access** | Requires `kubectl port-forward` | Direct Public IP access via pgAdmin & DBeaver |

---

## 🔑 Database Credentials & Network Endpoints Matrix

| Parameter | Configuration Value | Usage / Notes |
| :--- | :--- | :--- |
| **GCP Instance Name** | `prod-huntdevops-psql-2eecc976` | Unique Cloud SQL resource identifier |
| **GCP Connection Name** | `project-e746f24e-392a-429f-a4d:us-central1:prod-huntdevops-psql-2eecc976` | Used by Cloud SQL Auth Proxy & GCP integrations |
| **Database Engine** | `PostgreSQL 16` | Latest stable enterprise release |
| **Machine Tier** | `db-g1-small` | 1.7 GiB RAM, 20 GB SSD storage |
| **Database Name** | **`huntdevops`** | Application database created by Terraform |
| **Admin Username** | **`postgres`** | Primary administrative user |
| **Admin Password** | **`HuntDevOpsCloudSQL2026!`** | Provisioned via Terraform and Kubernetes secret |
| **Private IP (VPC)** | **`10.154.0.3`** | Direct connection from GKE backend pods |
| **Public IP Address** | **`35.232.123.246`** | Direct connection from pgAdmin / DBeaver / psql |
| **Port** | `5432` | Standard PostgreSQL port |

---

## 🛠️ Step 1: Infrastructure as Code (Terraform Cloud SQL Module)

Cloud SQL is managed as code under `infra/terraform/gcp/modules/cloudsql/`.

### 1. Module Definition (`infra/terraform/gcp/modules/cloudsql/main.tf`):
```hcl
resource "random_id" "db_suffix" {
  byte_length = 4
}

# 1. Allocate an internal IP range for Private Services Access (VPC Peering)
resource "google_compute_global_address" "private_ip_address" {
  name          = "${var.environment}-${var.project_name}-psql-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = var.network_id
}

# 2. Establish VPC Peering with Google Managed Services (servicenetworking)
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = var.network_id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

# 3. Create Cloud SQL PostgreSQL Instance
resource "google_sql_database_instance" "instance" {
  name                = "${var.environment}-${var.project_name}-psql-${random_id.db_suffix.hex}"
  database_version    = var.database_version
  region              = var.region
  deletion_protection = false

  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier              = var.tier
    availability_type = "ZONAL"
    disk_size         = 20
    disk_type         = "PD_SSD"

    ip_configuration {
      ipv4_enabled                                  = true
      private_network                               = var.network_id
      enable_private_path_for_google_cloud_services = true

      dynamic "authorized_networks" {
        for_each = var.authorized_networks
        content {
          name  = authorized_networks.value.name
          value = authorized_networks.value.value
        }
      }
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = false
      transaction_log_retention_days = 3
      backup_retention_settings {
        retained_backups = 7
      }
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = false
      record_client_address   = false
    }
  }
}

# 4. Create Initial Application Database
resource "google_sql_database" "database" {
  name     = var.db_name
  instance = google_sql_database_instance.instance.name
}

# 5. Create Application Database User
resource "google_sql_user" "users" {
  name     = var.db_user
  instance = google_sql_database_instance.instance.name
  password = var.db_password
}
```

---

## ⚙️ Step 2: GKE Backend Integration & Helm Configuration

The backend connects to Cloud SQL via its **Private IP** (`10.154.0.3`) through Google's high-speed internal VPC peering:

### 1. `helm/huntdevops/values.yaml` Settings:
```yaml
backend:
  env:
    NODE_ENV: production
    PORT: "4000"
    DB_HOST: "10.154.0.3"      # Cloud SQL Private IP inside prod-huntdevops-vpc
    DB_PORT: "5432"
    DB_NAME: "huntdevops"
    DB_USER: "postgres"

postgresql:
  enabled: false               # Disables in-cluster StatefulSet & Service
  auth:
    database: huntdevops
    username: postgres
    passwordSecretName: huntdevops-postgres-secret
    passwordSecretKey: postgres-password
    rawPassword: "HuntDevOpsCloudSQL2026!"
  persistence:
    enabled: false
```

### 2. Auto-Migration on Boot:
When `huntdevops-backend` boots, `initDatabase()` in `backend/server/db.ts` automatically runs `CREATE TABLE IF NOT EXISTS` and creates all required tables and indexes:
* 👤 `users`: Registered users, experience levels, roles, devices, phone numbers.
* 📜 `activity_logs`: Real-time session and action audit logs.
* 📚 `topics`: Curriculum learning topics, commands, and tasks.
* 🧪 `incident_labs`: DevOps incident troubleshooting lab scenarios.
* ✅ `user_completions`: Tracked question checklist completions per user.
* 🏆 `user_lab_solutions`: Completed incident lab challenge solutions.

---

## 💻 Step 3: Connect via pgAdmin 4 (Direct Public IP)

Because Cloud SQL has Public IP with Authorized Networks enabled, **you no longer need `kubectl port-forward`!** You can connect directly to the Cloud SQL public IP.

### 1. Register the Server in pgAdmin 4:
1. Open **pgAdmin 4** on your computer.
2. In the left **Browser** tree, right-click **Servers** $\rightarrow$ **Register** $\rightarrow$ **Server...**.
3. In the **General** tab:
   * **Name**: `HuntDevOps-CloudSQL`
4. Click the **Connection** tab and enter:
   * **Host name/address**: **`35.232.123.246`** (Cloud SQL Public IP)
   * **Port**: `5432`
   * **Maintenance database**: `huntdevops`
   * **Username**: `postgres`
   * **Password**: `HuntDevOpsCloudSQL2026!`
   * Check **Save password?** for convenience.
5. In the **SSL** tab:
   * **SSL mode**: Set to `Prefer` or `Allow`.
6. Click **Save**.

### 2. Inspect Live Data in pgAdmin:
Expand: `Servers` $\rightarrow$ `HuntDevOps-CloudSQL` $\rightarrow$ `Databases` $\rightarrow$ `huntdevops` $\rightarrow$ `Schemas` $\rightarrow$ `public` $\rightarrow$ `Tables`.

Right-click `users` or `activity_logs` $\rightarrow$ **View/Edit Data** $\rightarrow$ **All Rows**.

---

## 🖥️ Step 4: Connect via CLI (`psql`)

You can query Cloud SQL directly from your terminal using standard `psql`:

```bash
# 1. Connect directly to Cloud SQL Public IP:
PGPASSWORD='HuntDevOpsCloudSQL2026!' psql -h 35.232.123.246 -p 5432 -U postgres -d huntdevops

# 2. Run diagnostic queries:
SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC;
SELECT id, username, action_type, title, timestamp FROM activity_logs ORDER BY timestamp DESC LIMIT 5;
```

---

## 🔍 Step 5: Verification & Status Checks

Verify the live Cloud SQL instance status using `gcloud`:

```bash
# 1. Inspect instance status and IP addresses
gcloud sql instances list

# 2. Check detailed instance health
gcloud sql instances describe prod-huntdevops-psql-2eecc976 --format="table(name,state,databaseVersion,settings.tier)"

# 3. Test live Backend API connection to Cloud SQL
curl -s https://huntdevops.online/api/health
```

*Expected JSON Output*:
```json
{
  "status": "online",
  "database": "PostgreSQL (Connected)",
  "timestamp": "2026-09-29T14:11:45.549Z"
}
```

---

## 📊 Step 6: Practical PSQL Queries Cheat Sheet for HuntDevOps

Connect to the live instance:
```bash
PGPASSWORD='HuntDevOpsCloudSQL2026!' psql -h 35.232.123.246 -p 5432 -U postgres -d huntdevops
```

### 1. Schema Exploration & Table Stats
```sql
-- List all tables:
\dt

-- Detailed table schema:
\d+ users
\d+ topics
\d+ incident_labs
\d+ user_completions
\d+ user_lab_solutions
\d+ activity_logs

-- Show table row counts across all HuntDevOps tables:
SELECT
    schemaname,
    relname AS table_name,
    n_live_tup AS estimated_row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

### 2. Users Management (`users`)
```sql
-- List all users with their roles, experience, and registration date:
SELECT id, username, display_name, email, phone, role, experience_level, status, created_at
FROM users
ORDER BY created_at DESC;

-- Count total registered users by Role (Learner vs Admin):
SELECT role, COUNT(*) AS total_users
FROM users
GROUP BY role;

-- Count users by DevOps Experience Level (Beginner / Intermediate / Senior):
SELECT experience_level, COUNT(*) AS count
FROM users
GROUP BY experience_level
ORDER BY count DESC;

-- Promote a user to Admin:
UPDATE users
SET role = 'Admin'
WHERE username = '<TARGET_USERNAME>';

-- Update phone number or status:
UPDATE users
SET phone = '+1234567890', status = 'Active'
WHERE username = '<TARGET_USERNAME>';
```

### 3. Curriculum Topics & Modules (`topics`)
```sql
-- List all learning modules:
SELECT id, title, subtitle, updated_at
FROM topics
ORDER BY title ASC;

-- Inspect submodules count inside JSONB:
SELECT
    id,
    title,
    jsonb_array_length(data_json->'submodules') AS submodules_count
FROM topics
WHERE data_json ? 'submodules';

-- Search for specific command or keyword within topic content:
SELECT id, title
FROM topics
WHERE data_json::text ILIKE '%kubectl%';
```

### 4. Incident Labs Troubleshooting (`incident_labs`)
```sql
-- List all incident labs by topic and difficulty:
SELECT id, title, topic, experience_level, updated_at
FROM incident_labs
ORDER BY topic, experience_level;

-- Count labs grouped by Topic:
SELECT topic, COUNT(*) AS total_labs
FROM incident_labs
GROUP BY topic
ORDER BY total_labs DESC;
```

### 5. Learning Progress & Leaderboard (`user_completions`, `user_lab_solutions`)
```sql
-- Top 10 Learners with highest number of completed checklist questions:
SELECT
    username,
    COUNT(question_id) AS questions_completed,
    MAX(completed_at) AS last_active
FROM user_completions
GROUP BY username
ORDER BY questions_completed DESC
LIMIT 10;

-- Top 10 Incident Solvers (completed labs):
SELECT
    username,
    COUNT(lab_id) AS labs_solved,
    MAX(solved_at) AS last_lab_solved_at
FROM user_lab_solutions
GROUP BY username
ORDER BY labs_solved DESC
LIMIT 10;
```

### 6. Audit & Activity Logs (`activity_logs`)
```sql
-- View the 20 most recent user actions in real-time:
SELECT id, username, action_type, title, device_os, timestamp
FROM activity_logs
ORDER BY timestamp DESC
LIMIT 20;

-- Breakdown of user actions by OS / Device:
SELECT COALESCE(device_os, 'Unknown') AS os, COUNT(*) AS total_actions
FROM activity_logs
GROUP BY device_os
ORDER BY total_actions DESC;
```

### 7. Performance & Database Health
```sql
-- Database and table sizes:
SELECT pg_size_pretty(pg_database_size('huntdevops')) AS total_db_size;

SELECT
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS data_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- View currently active connections:
SELECT pid, usename, client_addr, application_name, state, query
FROM pg_stat_activity
WHERE datname = 'huntdevops' AND state != 'idle';
```

### 8. Real-Time Cloud SQL Persistence Architecture
All 6 tables now store real application and user data exclusively:
* **`users`**: Contains authenticated users and administrators registered via the platform. All static mock users (`alex_sre`, `priya_k8s`, `david_kim`) have been purged.
* **`topics`**: Contains all 13 curriculum topics stored as JSONB. Admin updates in the CMS tab save directly to this table.
* **`incident_labs`**: Contains troubleshooting lab scenarios. Admin updates in the Labs tab save directly to this table.
* **`user_completions`**: Checkpoint question completions recorded in real-time per user.
* **`user_lab_solutions`**: Solved incident challenges recorded in real-time per user.
* **`activity_logs`**: Live audit events (`USER_LOGIN`, `USER_LOGOUT`, `ACCOUNT_CREATED`, `ITEM_CHECKED`, `LAB_SOLVED`, `PROGRESS_RESET`) recorded in real-time.

---

## ⏭️ Next Step

Proceed to the complete access URLs, credentials, and validation guide:
👉 **[10 - Live Access URLs & Credentials Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/10-access-urls-and-credentials.md)**


