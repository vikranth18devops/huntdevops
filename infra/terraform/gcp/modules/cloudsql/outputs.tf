output "instance_name" {
  value       = google_sql_database_instance.instance.name
  description = "Name of the Cloud SQL PostgreSQL instance"
}

output "instance_connection_name" {
  value       = google_sql_database_instance.instance.connection_name
  description = "Connection name of Cloud SQL instance (project:region:instance)"
}

output "private_ip_address" {
  value       = google_sql_database_instance.instance.private_ip_address
  description = "Private IP address of the Cloud SQL PostgreSQL instance"
}

output "public_ip_address" {
  value       = google_sql_database_instance.instance.public_ip_address
  description = "Public IP address of the Cloud SQL PostgreSQL instance"
}

output "database_name" {
  value       = google_sql_database.database.name
  description = "Name of the database"
}

output "database_user" {
  value       = google_sql_user.users.name
  description = "Database username"
}
