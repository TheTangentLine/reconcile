# Amazon DocumentDB: a managed, MongoDB-compatible database in the database
# subnets. Only the EKS worker nodes (and the pods on them) may connect.

resource "random_password" "docdb" {
  length  = 32
  special = false # keeps the connection string URL-safe
}

resource "aws_docdb_subnet_group" "this" {
  name       = "${var.name}-docdb"
  subnet_ids = module.vpc.database_subnets
}

resource "aws_security_group" "docdb" {
  name        = "${var.name}-docdb"
  description = "DocumentDB: MongoDB port from EKS nodes only"
  vpc_id      = module.vpc.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "docdb_from_nodes" {
  for_each = {
    nodes   = module.eks.node_security_group_id
    cluster = module.eks.cluster_primary_security_group_id
  }

  security_group_id            = aws_security_group.docdb.id
  referenced_security_group_id = each.value
  ip_protocol                  = "tcp"
  from_port                    = 27017
  to_port                      = 27017
  description                  = "MongoDB from EKS (${each.key})"
}

resource "aws_docdb_cluster_parameter_group" "this" {
  name        = "${var.name}-docdb"
  family      = "docdb${regex("^\\d+\\.\\d+", var.docdb_engine_version)}"
  description = "Reconcile DocumentDB parameters"

  # Encrypt every connection.
  parameter {
    name  = "tls"
    value = "enabled"
  }

  # Record connections and changes; exported to CloudWatch Logs below.
  parameter {
    name  = "audit_logs"
    value = "enabled"
  }
}

resource "aws_docdb_cluster" "this" {
  cluster_identifier = var.name
  engine             = "docdb"
  engine_version     = var.docdb_engine_version

  master_username = "reconcile"
  master_password = random_password.docdb.result

  db_subnet_group_name            = aws_docdb_subnet_group.this.name
  vpc_security_group_ids          = [aws_security_group.docdb.id]
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.this.name

  enabled_cloudwatch_logs_exports = ["audit", "profiler"]

  storage_encrypted       = true
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"

  deletion_protection       = var.docdb_deletion_protection
  skip_final_snapshot       = var.docdb_skip_final_snapshot
  final_snapshot_identifier = var.docdb_skip_final_snapshot ? null : "${var.name}-final"
}

resource "aws_docdb_cluster_instance" "this" {
  count = var.docdb_instance_count

  identifier         = "${var.name}-${count.index + 1}"
  cluster_identifier = aws_docdb_cluster.this.id
  instance_class     = var.docdb_instance_class
}

locals {
  # Read from the nearest replica when there is one; TLS with the Amazon CA
  # bundle baked into the backend image; DocumentDB doesn't support retryable writes.
  mongodb_uri = format(
    "mongodb://%s:%s@%s:%d/reconcile?tls=true&tlsCAFile=%s&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false&authSource=admin",
    aws_docdb_cluster.this.master_username,
    random_password.docdb.result,
    aws_docdb_cluster.this.endpoint,
    aws_docdb_cluster.this.port,
    "/app/certs/rds-global-bundle.pem",
  )
}
