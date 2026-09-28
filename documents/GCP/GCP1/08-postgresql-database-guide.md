# Phase 8 — HuntDevOps PostgreSQL Database Guide

This guide explains how to connect to the **PostgreSQL** database running inside the GKE cluster, query every table belonging to the HuntDevOps application, manage backups, and troubleshoot database connectivity.

It is the **post-deploy companion** to `documents/GCP/GCP1/` — once Phase 4 is green and pods are Ready, every command below works as-is against your live GKE cluster.

---

## 🏛️ How the Database is Set Up

HuntDevOps runs **1 PostgreSQL pod** (`huntdevops-postgres-0`) as a **StatefulSet** inside the `huntdevops` namespace on GKE.

* **Image**: `postgres:16-alpine`
* **Storage Class**: `standard-rwo` (Google Compute Engine Persistent Disk, ReadWriteOnce)
* **Volume Size**: 10Gi (`postgres-data-huntdevops-postgres-0`)
* **Secret**: `huntdevops-postgres-secret` (Key: `postgres-password`)
* **Port**: `5432`
* **Internal Cluster DNS**: `huntdevops-postgres.huntdevops.svc.cluster.local:5432`

### Database Schema & Tables

The Express backend initializes the tables automatically on startup via `initDatabase()` in `backend/server/db.ts`:

| Table Name | Primary Key | Description | Stored Information |
| :--- | :--- | :--- | :--- |
| `users` | `id` (VARCHAR) | Registered users & learners | `username`, `display_name`, `email`, `password_hash`, `role`, `experience_level`, `last_device_os` |
| `topics` | `id` (VARCHAR) | DevOps curriculum modules | `title`, `subtitle`, `data_json` (JSONB curriculum content) |
| `incident_labs` | `id` (VARCHAR) | Interactive simulation labs | `title`, `topic`, `experience_level`, `data_json` (lab scenario, tasks, hints) |
| `user_completions` | `id` (SERIAL) | Tracked user progress | `username`, `question_id`, `completed_at` |
| `user_lab_solutions`| `id` (SERIAL) | Solved incident challenges | `username`, `lab_id`, `solved_at` |
| `activity_logs` | `id` (VARCHAR) | Real-time audit & session logs | `username`, `action_type`, `title`, `details`, `device_os`, `timestamp` |

> 💡 **Persistence Guarantee**: Because PostgreSQL is deployed as a StatefulSet with a `volumeClaimTemplates` PersistentVolumeClaim, the database data survives pod crashes, rollouts, and node restarts.

---

## 🔌 Step 1: Connect to the Cluster & Verify the Postgres Pod

First, make sure your `kubectl` context is configured for your live GKE cluster:

```bash
gcloud container clusters get-credentials prod-huntdevops-gke \
  --zone us-central1-a --project project-e746f24e-392a-429f-a4d

# Sanity-check: pod should show Running 1/1
kubectl -n huntdevops get pod huntdevops-postgres-0

# Verify the PVC is Bound
kubectl -n huntdevops get pvc postgres-data-huntdevops-postgres-0
```

*Expected Output*:
```text
NAME                     READY   STATUS    RESTARTS   AGE
huntdevops-postgres-0   1/1     Running   0          25m

NAME                                      STATUS   VOLUME                                     CAPACITY   STORAGECLASS
postgres-data-huntdevops-postgres-0       Bound    pvc-6a0befa4-3475-49d2-a3a4-d8712cfa20fe   10Gi       standard-rwo
```

---

## 🔍 Step 2: Querying the Database

There are two primary ways to query PostgreSQL — pick the one that fits the task.

### Option A — Run a Single Query (Quick One-Liner)

Best for rapid ad-hoc checks (counting users, inspecting latest activity logs, checking table existence).

```bash
kubectl exec -n huntdevops huntdevops-postgres-0 -- \
  psql -U postgres -d huntdevops -c "<SQL query>"
```

#### Examples:
```bash
# 1. List all tables in huntdevops database
kubectl exec -n huntdevops huntdevops-postgres-0 -- \
  psql -U postgres -d huntdevops -c "\dt"

# 2. Count registered users
kubectl exec -n huntdevops huntdevops-postgres-0 -- \
  psql -U postgres -d huntdevops -c "SELECT COUNT(*) FROM users;"

# 3. View the 5 most recent activity logs
kubectl exec -n huntdevops huntdevops-postgres-0 -- \
  psql -U postgres -d huntdevops -c "SELECT id, username, action_type, title, timestamp FROM activity_logs ORDER BY timestamp DESC LIMIT 5;"

# 4. View incident lab scenario titles
kubectl exec -n huntdevops huntdevops-postgres-0 -- \
  psql -U postgres -d huntdevops -c "SELECT id, title, topic, experience_level FROM incident_labs;"
```

---

### Option B — Open an Interactive `psql` Shell (Exploration)

Best when you want an interactive shell to explore schemas, run multiple queries, or inspect indexes.

```bash
kubectl exec -it -n huntdevops huntdevops-postgres-0 -- \
  psql -U postgres -d huntdevops
```

You will see the interactive prompt:
```text
psql (16.8)
Type "help" for help.

huntdevops=#
```

#### Most Useful `psql` Commands Inside the Shell:
* `\dt`: List all tables in the current schema
* `\d <table_name>`: Describe table columns, data types, and indexes (e.g. `\d users`)
* `\di`: List all database indexes
* `\l`: List all databases on the PostgreSQL server
* `\q`: Exit the interactive shell

---

## 💻 Step 3: Connect via Local Client (DBeaver, TablePlus, or local psql)

If you prefer using a graphical database management tool on your local workstation:

1. **Start port-forwarding to local port 5432**:
   ```bash
   kubectl port-forward svc/huntdevops-postgres -n huntdevops 5432:5432
   ```

2. **Retrieve the database password from Kubernetes Secret**:
   ```bash
   kubectl -n huntdevops get secret huntdevops-postgres-secret -o jsonpath="{.data.postgres-password}" | base64 -d && echo
   # Output: HuntDevOpsSecurePassword2026!
   ```

3. **Configure your database client with**:
   * **Host**: `localhost`
   * **Port**: `5432`
   * **Database**: `huntdevops`
   * **Username**: `postgres`
   * **Password**: `HuntDevOpsSecurePassword2026!`
   * **SSL**: `Disable` (or Require if connecting over an SSL tunnel)

---

## 💾 Step 4: Backup & Restore (Disaster Recovery)

### 1. Create a Full Database Dump (`pg_dump`)
Run a single command to stream a compressed SQL dump directly from the pod to your local machine:

```bash
kubectl exec -n huntdevops huntdevops-postgres-0 -- \
  pg_dump -U postgres -d huntdevops -F c > huntdevops_backup_$(date +%Y%m%d_%H%M%S).dump

ls -lh huntdevops_backup_*.dump
```

### 2. Restore from Backup (`pg_restore`)
If restoring into a fresh or rebuilt cluster:

```bash
# Copy dump into the pod
kubectl cp huntdevops_backup_latest.dump huntdevops/huntdevops-postgres-0:/tmp/backup.dump

# Restore schema and data
kubectl exec -it -n huntdevops huntdevops-postgres-0 -- \
  pg_restore -U postgres -d huntdevops --clean --if-exists /tmp/backup.dump
```

---

## 🛠️ Step 5: Troubleshooting PostgreSQL on GKE

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `PersistentVolumeClaim` stays in `Pending` | StorageClass invalid (e.g. `standard-rwd`) | Set `storageClass: standard-rwo` in `values.yaml`. Run `kubectl get sc` to verify available storage classes. |
| `FATAL: password authentication failed` | Password mismatch between Secret and container | Verify secret key: `kubectl -n huntdevops get secret huntdevops-postgres-secret -o jsonpath="{.data.postgres-password}" \| base64 -d`. |
| `connection refused` on `huntdevops-postgres:5432` | Pod is not Running or Service selector mismatch | Run `kubectl get pods,svc -n huntdevops -l app.kubernetes.io/component=database`. Verify endpoints with `kubectl get ep huntdevops-postgres -n huntdevops`. |
| `SSL connection error` in backend | Backend forces SSL on internal unencrypted connection | Set `DB_SSL=false` or configure `ssl: process.env.DB_SSL === 'true'`. In-cluster traffic between pods is encapsulated by GCP VPC. |
