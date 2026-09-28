# Helm Infrastructure & Environment Overrides

This directory contains environment-specific values files and infrastructure-level Helm configurations.

## Directory Structure

* `values-dev.yaml`: Overrides for lightweight development/testing environments on GKE.
* `values-prod.yaml`: Overrides for high-availability production deployments.

## Usage

To apply a specific environment override during manual Helm testing:

```bash
helm template huntdevops helm/huntdevops -f infra/helm/values-prod.yaml
```
