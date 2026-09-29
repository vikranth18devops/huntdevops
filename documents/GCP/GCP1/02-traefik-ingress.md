# Phase 2 — Traefik Ingress Controller (GCP)

**Goal:** Install **Traefik** in the GKE cluster, expose it through a **GCP TCP LoadBalancer** (single static IP: `136.112.185.77`), and verify the Traefik CRDs (`IngressRoute`, `Middleware`, `TLSStore`) are installed. Argo CD and the HuntDevOps app both deploy `IngressRoute` objects.

**Time:** ~5 minutes (provisioning the GCP LB takes ~60 s).

This is modeled directly after the **CloudKitchen GCP architecture**, using Traefik as the single front-door edge router for all cluster traffic.

---

## 🏛️ What is Traefik & Why We Use It

**Traefik** is a cloud-native edge router and ingress controller. Instead of creating separate, expensive cloud load balancers for each application or service, Traefik routes all external traffic from a **single static IP**:

| Feature | Why We Use It |
| :--- | :--- |
| **Native `IngressRoute` CRD** | Cleaner and more expressive than the standard `Ingress` API; supports prefix matching, priority, and middleware composition |
| **Single Load Balancer IP** | Routes Frontend (`/`), Backend (`/api`), and Argo CD (`/argocd`) through a single public IP (`136.112.185.77`), cutting GCP Load Balancer costs |
| **Dynamic Config Reload** | Create or modify an `IngressRoute` → routes update in under 1 second without restarting Traefik pods |
| **Traefik Dashboard** | Visualize active routers, middlewares, and services in real-time |
| **Middlewares** | Declarative YAML rules for strip-prefix, retry, rate-limiting, and headers |

---

## 🌐 Network Topology & Traffic Flow

```text
                                  Internet Users
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │  Google Cloud Network Load Balancer  │
                      │  Public IP: 136.112.185.77           │
                      │  Ports: 80 (HTTP) & 443 (HTTPS)      │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │  Traefik Pods (namespace: traefik)   │
                      │  (2 replicas, LoadBalanced)          │
                      └──────────┬────────────────┬──────────┘
                                 │                │
             PathPrefix(`/`) &   │                │ PathPrefix(`/argocd`)
             PathPrefix(`/api`)  │                │
                                 ▼                ▼
         ┌───────────────────────────────┐  ┌───────────────────────┐
         │ huntdevops namespace          │  │ argocd namespace      │
         │                               │  │                       │
         │ ┌───────────────────────────┐ │  │ ┌───────────────────┐ │
         │ │ huntdevops-frontend:80    │ │  │ │ argocd-server:80  │ │
         │ │ (React SPA on Nginx)      │ │  │ └───────────────────┘ │
         │ └───────────────────────────┘ │  └───────────────────────┘
         │ ┌───────────────────────────┐ │
         │ │ huntdevops-backend:4000   │ │
         │ │ (Express REST API)        │ │
         │ └─────────────┬─────────────┘ │
         │               ▼               │
         │ ┌───────────────────────────┐ │
         │ │ Cloud SQL PostgreSQL 16   │ │
         │ │ (Private IP: 10.154.0.3)  │ │
         │ └───────────────────────────┘ │
         └───────────────────────────────┘
```

---

## 🛠️ Step 1: Install Traefik via Helm

We install Traefik into a dedicated `traefik` namespace:

```bash
# 1. Add and update the official Traefik Helm repo
helm repo add traefik https://traefik.github.io/charts
helm repo update traefik

# 2. Install Traefik as the default Ingress Controller with LoadBalancer service
helm upgrade --install traefik traefik/traefik \
  --namespace traefik --create-namespace \
  --set service.type=LoadBalancer \
  --set ingressClass.enabled=true \
  --set ingressClass.isDefaultClass=true \
  --set ingressRoute.dashboard.enabled=true \
  --set deployment.replicas=2
```

---

## 🔍 Step 2: Retrieve the Static LoadBalancer IP

```bash
# Read the external IP allocated to Traefik
LB_IP=$(kubectl -n traefik get svc traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Traefik External IP: ${LB_IP}"
```

*Live Output from Cluster*:
```text
Traefik External IP: 136.112.185.77
```

---

## 📄 Step 3: Declarative Traefik IngressRoutes

### 1. Application IngressRoute (`helm/huntdevops/templates/traefik-ingressroute.yaml`)

Routes traffic arriving at `/` to the Frontend and `/api` to the Express Backend:

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: huntdevops-ingressroute
  namespace: huntdevops
spec:
  entryPoints:
    - web
  routes:
    - match: PathPrefix(`/api`)
      kind: Rule
      services:
        - name: huntdevops-backend
          port: 4000
    - match: PathPrefix(`/`)
      kind: Rule
      services:
        - name: huntdevops-frontend
          port: 80
```

### 2. Argo CD IngressRoute (`argocd-ingressroute`)

Routes traffic arriving at `/argocd` to the Argo CD Web UI with TLS termination:

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: argocd-ingressroute
  namespace: argocd
spec:
  entryPoints:
    - web
    - websecure
  routes:
    - match: PathPrefix(`/argocd`)
      kind: Rule
      services:
        - name: argocd-server
          port: 80
  tls:
    secretName: huntdevops-tls
```

---

## 🚀 Step 4: Verification of Live Routes

Test all live routes directly against Traefik's public IP (`136.112.185.77`) or via custom domain **`vikranthsunkarpally.in`**:

```bash
# 1. Test Frontend SPA HTML response (HTTPS)
curl -I https://vikranthsunkarpally.in/
# Or directly via HTTP Traefik IP:
curl -I http://136.112.185.77/

# 2. Test Backend Health Probe via Traefik routing
curl -s https://vikranthsunkarpally.in/api/health
# Or directly via HTTP Traefik IP:
curl -s http://136.112.185.77/api/health

# 3. Test Argo CD Dashboard route
curl -ILs https://vikranthsunkarpally.in/argocd
# Or directly via direct Argo CD LoadBalancer IP:
curl -kILs https://136.112.167.2/
```

*Live API Output*:
```json
{"status":"online","database":"PostgreSQL (Connected)","timestamp":"2026-09-28T14:33:33.900Z"}
```

---

## ⏭️ Next Step

Now explore the automated CI pipeline that builds containers, runs Trivy security scans, and pushes to Artifact Registry:
👉 **[03 - GitHub Actions CI/CD Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/03-github-actions-cicd.md)**
