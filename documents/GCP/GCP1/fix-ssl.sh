#!/bin/bash
# ==============================================================================
# HuntDevOps SSL/TLS Automated Diagnostic & Fix Script for GKE
# ==============================================================================
set -e

DOMAIN="huntdevops.online"
EXPECTED_IP="136.112.185.77"
NAMESPACE="huntdevops"

echo "===================================================================="
echo " 🔒 HuntDevOps SSL/TLS Diagnostic & Let's Encrypt Fix Tool"
echo " Target Domain: https://${DOMAIN}"
echo "===================================================================="

# 1. Check DNS resolution
echo ""
echo "[Step 1/5] Checking DNS A Record for ${DOMAIN} & www.${DOMAIN}..."
RESOLVED_APEX=$(dig +short ${DOMAIN} | tail -n1 || echo "")
RESOLVED_WWW=$(dig +short www.${DOMAIN} | tail -n1 || echo "")

echo "  - Apex (${DOMAIN}) resolves to: '${RESOLVED_APEX}'"
echo "  - WWW (www.${DOMAIN}) resolves to: '${RESOLVED_WWW}'"

if [ "${RESOLVED_APEX}" != "${EXPECTED_IP}" ]; then
  echo "⚠️ WARNING: ${DOMAIN} does not yet point to ${EXPECTED_IP}."
  echo "Please verify your Namecheap DNS records:"
  echo "  Type: A Record | Host: @   | Value: ${EXPECTED_IP}"
  echo "  Type: A Record | Host: www | Value: ${EXPECTED_IP}"
else
  echo "✅ DNS Resolution verified pointing to GCP Traefik IP (${EXPECTED_IP})."
fi

# 2. Check cert-manager pods
echo ""
echo "[Step 2/5] Checking cert-manager controller pods..."
kubectl get pods -n cert-manager || {
  echo "❌ cert-manager not found in cluster. Installing cert-manager..."
  helm repo add jetstack https://charts.jetstack.io --force-update
  helm upgrade --install cert-manager jetstack/cert-manager \
    --namespace cert-manager \
    --create-namespace \
    --set crds.enabled=true
}

# 3. Apply ClusterIssuer & Certificate
echo ""
echo "[Step 3/5] Applying Let's Encrypt ClusterIssuer & Certificate..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
kubectl apply -f "${SCRIPT_DIR}/cluster-issuer.yaml"
kubectl apply -f "${SCRIPT_DIR}/certificate.yaml"

# 4. Wait for Certificate Issuance
echo ""
echo "[Step 4/5] Watching certificate issuance (waiting for READY = True)..."
for i in {1..30}; do
  READY_STATUS=$(kubectl get certificate -n ${NAMESPACE} huntdevops-tls-cert -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "False")
  if [ "${READY_STATUS}" == "True" ]; then
    echo "🎉 SUCCESS: Certificate 'huntdevops-tls-cert' is READY and valid!"
    break
  fi
  echo "  [$i/30] Status: ${READY_STATUS} (Issuing challenge with Let's Encrypt... waiting 5s)"
  sleep 5
done

# 5. Check generated secret and reload Traefik
echo ""
echo "[Step 5/5] Checking TLS secret & reloading Traefik to load new certificate..."
kubectl get secret -n ${NAMESPACE} huntdevops-tls
kubectl rollout restart deployment -n traefik traefik

echo ""
echo "===================================================================="
echo " 🚀 Verification:"
echo " curl -Iv https://${DOMAIN}/"
echo "===================================================================="
