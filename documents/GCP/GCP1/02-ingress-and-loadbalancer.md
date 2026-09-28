# Phase 2 — Ingress & Google Cloud Load Balancer (GCP GKE)

**Goal:** Expose the **HuntDevOps** web application to the public internet using a **Google Cloud Network Load Balancer**, obtain a dedicated public IP address (`136.116.192.196`), and configure the frontend Nginx reverse proxy to forward `/api/` requests directly to the Express backend service.

**Time:** ~5 minutes.

---

## 🏛️ Network Architecture & Traffic Flow

```text
                                  Internet Users
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │  Google Cloud Network Load Balancer  │
                      │  Public IP: 136.116.192.196 (Port 80)│
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │ Kubernetes Service: huntdevops-frontend│
                      │ (Type: LoadBalancer, Namespace: huntdevops)
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │  Frontend Pods (React TypeScript SPA)│
                      │  - Serves static UI bundles on /     │
                      │  - Nginx reverse-proxies /api/ calls │
                      └──────────────────┬───────────────────┘
                                         │ Internal Cluster Routing
                                         ▼
                      ┌──────────────────────────────────────┐
                      │ Kubernetes Service: huntdevops-backend│
                      │ (Port 4000, ClusterIP)               │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │ Backend Pods (Express REST API)      │
                      │ Queries huntdevops-postgres:5432     │
                      └──────────────────────────────────────┘
```

---

## ⚙️ Step 1: Configure Frontend Service as LoadBalancer

In `helm/huntdevops/values.yaml`, define `frontend.service.type` as `LoadBalancer`:

```yaml
frontend:
  replicaCount: 2
  service:
    type: LoadBalancer
    port: 80
    targetPort: 80
```

When applied on GKE, the cloud controller provisions a regional TCP Load Balancer with target pool health checking.

---

## 🔄 Step 2: Configure In-Cluster Nginx Reverse Proxy for API

Inside `frontend/nginx.conf`, requests to `/api/` are forwarded directly to the in-cluster DNS service `http://huntdevops-backend:4000/api/`:

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Reverse Proxy /api calls to in-cluster backend service
    location /api/ {
        proxy_pass http://huntdevops-backend:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA Routing Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

This ensures the user's browser only needs one public IP address (`136.116.192.196`) to access both the frontend client and backend API, completely avoiding cross-origin (CORS) complications.

---

## 🔍 Step 3: Verification & External IP Inspection

Check the allocated public external IP address:

```bash
kubectl get svc huntdevops-frontend -n huntdevops
```

*Live Output*:
```text
NAME                  TYPE           CLUSTER-IP     EXTERNAL-IP       PORT(S)        AGE
huntdevops-frontend   LoadBalancer   10.20.15.114   136.116.192.196   80:31591/TCP   23m
```

Test HTTP responses from your workstation:

```bash
# 1. Test Frontend UI HTML response
curl -I http://136.116.192.196/

# 2. Test Backend Health Check through the frontend proxy
curl -s http://136.116.192.196/api/health
```

*Expected JSON Output*:
```json
{"status":"online","database":"PostgreSQL (Connected)","timestamp":"2026-09-28T14:10:57.082Z"}
```

---

## ⏭️ Next Step

Now explore the automated CI pipeline that builds containers, runs Trivy security scans, and pushes to Artifact Registry:
👉 **[03 - GitHub Actions CI/CD Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/03-github-actions-cicd.md)**
