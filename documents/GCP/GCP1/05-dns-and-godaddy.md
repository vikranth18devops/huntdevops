# Phase 5 — DNS + GoDaddy Domain Setup (GCP)

**Goal:** Make **HuntDevOps** reachable on the internet via your own custom domain name (e.g. `huntdevops.com` or `devops.yourname.in`) instead of a raw public IP address.

**Time:** ~15 minutes (DNS propagation takes 2–10 minutes).

> **Before this phase:** `http://136.116.192.196/` (Raw GCP Load Balancer IP)  
> **After this phase:** `http://<your-domain>/` and `http://<your-domain>/api/health`

---

## ✅ Prerequisites

| Requirement | How to check |
| :--- | :--- |
| **Phase 4 completed** | App is live and returning HTTP 200 at `http://136.116.192.196` |
| **A registered custom domain** | Domain registered on **GoDaddy**, **Namecheap**, **Cloudflare**, or **Google Domains** |
| **DNS diagnostic CLI tools** | `dig` and `nslookup` available on your local terminal (`dig +short google.com`) |

---

## 🛠️ Step 1: Retrieve the GCP LoadBalancer Public IP

Read the external IP allocated to the `huntdevops-frontend` service directly from the cluster:

```bash
LB_IP=$(kubectl -n huntdevops get svc huntdevops-frontend \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "GCP Frontend LoadBalancer Public IP: ${LB_IP}"
```

*Live Output from Cluster*:
```text
GCP Frontend LoadBalancer Public IP: 136.116.192.196
```

---

## 🌐 Step 2: Add DNS A Records at GoDaddy / DNS Provider

1. Log into your registrar console: [https://account.godaddy.com/products](https://account.godaddy.com/products)
2. Locate your domain name and click **DNS** (or **Manage DNS**).
3. Under the **DNS Records** table, click **Add New Record**.
4. Configure the primary record for your root/apex domain or subdomain:

### Record 1 — Apex Domain (Root URL)

| Field | Value | Explanation |
| :--- | :--- | :--- |
| **Type** | `A` | Maps a hostname to an IPv4 address |
| **Name** | `@` | The root domain (e.g. `yourdomain.com`) |
| **Value** | `136.116.192.196` | Paste the GCP Load Balancer IP from Step 1 |
| **TTL** | `600` (10 minutes) | Short TTL ensures fast initial propagation |

### Record 2 — Subdomain (Optional / Recommended)

If you prefer hosting under a specific subdomain (e.g. `app.yourdomain.com` or `huntdevops.yourdomain.com`):

| Field | Value | Explanation |
| :--- | :--- | :--- |
| **Type** | `A` | IPv4 address mapping |
| **Name** | `huntdevops` (or `app`) | Becomes `huntdevops.yourdomain.com` |
| **Value** | `136.116.192.196` | Same GCP Load Balancer IP |
| **TTL** | `600` | 10 minutes |

5. Click **Save** to publish the records.

---

## ⏱️ Step 3: Verify DNS Propagation

DNS propagation across global resolvers typically takes between 1 and 10 minutes. Run these verification commands:

```bash
# Query public DNS servers directly (Google DNS 8.8.8.8 and Cloudflare DNS 1.1.1.1)
dig @8.8.8.8 +short <your-domain>
dig @1.1.1.1 +short <your-domain>

# Using nslookup
nslookup <your-domain>
```

*Expected Output*:
```text
136.116.192.196
```

---

## 🚀 Step 4: Test Application Access via Domain

Once `dig` returns `136.116.192.196`, verify that both the Frontend Web UI and the Backend REST API respond cleanly via your domain:

```bash
# 1. Test Web UI headers
curl -I http://<your-domain>/

# 2. Test Backend Health Check through the Nginx reverse proxy
curl -s http://<your-domain>/api/health
```

*Expected JSON Output from API*:
```json
{
  "status": "online",
  "database": "PostgreSQL (Connected)",
  "timestamp": "2026-09-28T14:10:57.082Z"
}
```

Now open **`http://<your-domain>`** in your web browser to interact with the live application!

---

## ⏭️ Next Steps

Now that your application is reachable over HTTP via your custom domain, proceed to:
- 👉 **[06 - Monitoring & Logging Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/06-monitoring-and-logging.md)**: Set up metrics and log aggregation on GKE.
- 👉 **[07 - HTTPS with Let's Encrypt Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/07-https-letsencrypt-and-routes.md)**: Secure your domain with free automated SSL/TLS certificates via cert-manager.
