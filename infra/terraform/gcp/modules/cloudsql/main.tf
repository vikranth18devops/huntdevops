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
      query_insights_enabled = true
      query_string_length    = 1024
      record_application_tags = false
      record_client_address  = false
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
