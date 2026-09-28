# Phase 7 — HTTPS with Let's Encrypt & cert-manager (GCP GKE)

**Goal:** Install **cert-manager** on GKE, obtain a free, trusted **Let's Encrypt** SSL/TLS certificate for your custom domain **`vikranthsunkarpally.in`**, and terminate HTTPS traffic securely on your GKE cluster via **Traefik**.

**Time:** ~15 minutes (Let's Encrypt HTTP-01 challenge validation takes ~2–5 minutes).

> **Before this phase:** `http://vikranthsunkarpally.in/` (Unencrypted HTTP traffic, browser shows "Not Secure")  
> **After this phase:** `https://vikranthsunkarpally.in/` (Trusted green padlock, automated 90-day certificate renewal)

---

## 🏛️ TLS Architecture & Workflow

```text
 ┌────────────────────────────────────────────────────────┐
 │   cert-manager (namespace: cert-manager)               │
 │   ┌──────────────────────────────────────────────┐     │
 │   │  ClusterIssuer ("letsencrypt-prod")           │     │
 │   └──────────────────────┬───────────────────────┘     │
 │                          │                             │
 │                          ▼                             │
 │   Certificate ("huntdevops-tls-cert")                  │
 │   → Executes ACME HTTP-01 challenge with Let's Encrypt │
 │   → Creates Kubernetes Secret ("huntdevops-tls")       │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼ (Injects tls.crt & tls.key)
 ┌────────────────────────────────────────────────────────┐
 │   Traefik Ingress Controller (namespace: traefik)      │
 │   Terminates HTTPS on Port 443 with valid SSL cert     │
 └────────────────────────────────────────────────────────┘
```

---

## 🛠️ Step 1: Install cert-manager on GKE

**cert-manager** is the industry-standard Kubernetes operator for automating the management and issuance of TLS certificates from Let's Encrypt.

```bash
# 1. Add Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io
helm repo update jetstack

# 2. Install cert-manager with CustomResourceDefinitions (CRDs) enabled
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true

# 3. Verify all cert-manager pods are Running
kubectl get pods -n cert-manager
```

*Expected Output*:
```text
NAME                                       READY   STATUS    RESTARTS   AGE
cert-manager-577f8646b-xxxx               1/1     Running   0          60s
cert-manager-cainjector-5fdfbf668d-xxxx    1/1     Running   0          60s
cert-manager-webhook-59897c555c-xxxx       1/1     Running   0          60s
```

---

## 📜 Step 2: Create Let's Encrypt ClusterIssuer

A **ClusterIssuer** defines the ACME server configuration and contact email used to register with Let's Encrypt.

Create `cluster-issuer.yaml`:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@vikranthsunkarpally.in  # Replace with your email for renewal notices
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
      - http01:
          ingress:
            class: traefik
```

Apply the issuer:
```bash
kubectl apply -f cluster-issuer.yaml
```

---

## 🔐 Step 3: Request the TLS Certificate for `vikranthsunkarpally.in`

Create a `Certificate` manifest (`certificate.yaml`) specifying your domain:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: huntdevops-tls-cert
  namespace: huntdevops
spec:
  secretName: huntdevops-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: vikranthsunkarpally.in
  dnsNames:
    - vikranthsunkarpally.in
    - www.vikranthsunkarpally.in
```

Apply the certificate request:
```bash
kubectl apply -f certificate.yaml
```

---

## 🔍 Step 4: Verify Certificate Issuance

Watch the certificate transition from `Issuing` to `Ready`:

```bash
# 1. Check Certificate status
kubectl get certificate -n huntdevops

# 2. Inspect cert-manager challenge events
kubectl describe certificate huntdevops-tls-cert -n huntdevops

# 3. Verify the generated TLS Secret
kubectl get secret huntdevops-tls -n huntdevops
```

*Expected Output*:
```text
NAME                   READY   SECRET            AGE
huntdevops-tls-cert    True    huntdevops-tls    2m
```

---

## 🚀 Step 5: Test Live HTTPS Access

Once the certificate is marked `READY = True`:

```bash
# 1. Verify HTTPS certificate directly via curl for Frontend Web UI
curl -I https://vikranthsunkarpally.in/

# 2. Verify secure Admin Management Portal
curl -I https://vikranthsunkarpally.in/admin

# 3. Verify secure API health endpoint
curl -s https://vikranthsunkarpally.in/api/health

# 4. Verify secure Argo CD dashboard
curl -ILs https://vikranthsunkarpally.in/argocd
```

*Expected Result*:
* Modern browsers display the **secure green padlock** (`https://vikranthsunkarpally.in`).
* Traefik terminates TLS using the `huntdevops-tls` secret generated by cert-manager.
* Argo CD routes cleanly through `https://vikranthsunkarpally.in/argocd/` with full SPA asset support.
* Certificate automatically auto-renews every 60 days before the 90-day expiry without manual intervention.

---

## ⏭️ Next Step

Now explore the complete database architecture and management guide:
👉 **[08 - PostgreSQL Database Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/08-postgresql-database-guide.md)**
