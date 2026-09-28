# Phase 6 — Monitoring & Observability Guide (GCP GKE)

**Goal:** Establish end-to-end observability for **HuntDevOps** on Google Kubernetes Engine (GKE)—including container logs, cluster resource utilization metrics, application health probes, and Prometheus/Grafana dashboards.

**Time:** ~20 minutes.

> **Before this phase:** Cluster runs Frontend, Backend, and PostgreSQL with live external access, but without centralized dashboards or metric alerts.  
> **After this phase:** Live metrics and logs stream into Google Cloud Operations (Cloud Logging & Cloud Monitoring) alongside an optional in-cluster Prometheus/Grafana stack.

---

## 🏛️ Observability Architecture

```text
                     GKE Cluster (prod-huntdevops-gke)
 ┌────────────────────────────────────────────────────────────────────────┐
 │   huntdevops namespace                                                 │
 │   ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────┐  │
 │   │ huntdevops-frontend  │  │  huntdevops-backend  │  │  postgres-0 │  │
 │   │ (Nginx access logs)  │  │  (/api/health stats) │  │ (DB Engine) │  │
 │   └──────────┬───────────┘  └──────────┬───────────┘  └──────┬──────┘  │
 └──────────────┼─────────────────────────┼─────────────────────┼─────────┘
                │ stdout/stderr           │ logs & metrics      │ storage stats
                ▼                         ▼                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                   Google Cloud Operations Suite                        │
 │  1. Google Cloud Logging   (Structured log search, pod filter, severity)│
 │  2. Google Cloud Monitoring (Node CPU/RAM, Pod restarts, network I/O)  │
 └────────────────────────────────────┬───────────────────────────────────┘
                                      │ (or optional Prometheus/Grafana)
                                      ▼
                        ┌───────────────────────────┐
                        │ Grafana Metric Dashboards │
                        │  - Request rates (RPS)    │
                        │  - P95/P99 latency        │
                        │  - Container Memory usage │
                        └───────────────────────────┘
```

---

## 📊 Option 1: Native GCP Cloud Logging & Cloud Monitoring (Zero-Config)

GKE comes integrated natively with **Google Cloud Operations Suite** (formerly Stackdriver). All `stdout` and `stderr` streams from your containers are automatically forwarded to Cloud Logging without needing daemonset log collectors.

### 1. Inspect Live Logs via `gcloud` CLI

Stream live production logs directly from your terminal:

```bash
# 1. View live logs from the backend pods
gcloud logging read 'resource.type="k8s_container" AND resource.labels.namespace_name="huntdevops" AND resource.labels.container_name="backend"' \
  --project project-e746f24e-392a-429f-a4d \
  --limit 20 \
  --format="value(textPayload)"

# 2. View live logs from PostgreSQL
gcloud logging read 'resource.type="k8s_container" AND resource.labels.namespace_name="huntdevops" AND resource.labels.container_name="postgres"' \
  --project project-e746f24e-392a-429f-a4d \
  --limit 10 \
  --format="value(textPayload)"
```

### 2. View in Google Cloud Console
1. Navigate to: [Google Cloud Logs Explorer](https://console.cloud.google.com/logs/query)
2. Run query:
   ```text
   resource.type="k8s_container"
   resource.labels.namespace_name="huntdevops"
   ```
3. Real-time log entries will appear with timestamp, pod name, and message details.

---

## 📈 Option 2: Deploy Prometheus & Grafana on GKE

If you require standard open-source Kubernetes observability dashboards:

### Step 1: Install kube-prometheus-stack via Helm

```bash
# 1. Add Prometheus community Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update prometheus-community

# 2. Install the Prometheus & Grafana stack into the monitoring namespace
helm upgrade --install kube-prom prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword="HuntDevOpsAdmin2026!" \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false
```

### Step 2: Access the Grafana Dashboard

```bash
# Port-forward Grafana to localhost:3001
kubectl port-forward svc/kube-prom-grafana -n monitoring 3001:80
```

* **URL**: [http://localhost:3001](http://localhost:3001)
* **Username**: `admin`
* **Password**: `HuntDevOpsAdmin2026!`

#### Pre-Configured Dashboards Included:
1. **Kubernetes / Compute Resources / Cluster**: Overall cluster CPU, RAM, and disk utilization.
2. **Kubernetes / Compute Resources / Namespace (Pods)**: Resource graphs for the `huntdevops` namespace.
3. **Node Exporter / Nodes**: Underlying GKE node VM metrics.

---

## 🩺 Step 3: Application Health & Pod Resource Metrics

Run these commands to monitor cluster capacity directly with `kubectl`:

```bash
# 1. View CPU and Memory utilization per node
kubectl top nodes

# 2. View CPU and Memory utilization per pod in huntdevops
kubectl top pods -n huntdevops

# 3. Check health endpoint responsiveness
curl -s -w "\nHTTP Status: %{http_code}\nTime Total: %{time_total}s\n" \
  http://136.116.192.196/api/health
```

---

## ⏭️ Next Step

Proceed to secure your custom domain with free, automated SSL/TLS certificates:
👉 **[07 - HTTPS with Let's Encrypt Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/07-https-letsencrypt-and-routes.md)**
