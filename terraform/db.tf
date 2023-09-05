locals {
  pgaudit_role_name = "rds_pgaudit"
  rds_engine = "aurora-postgresql"
  rds_engine_version = "13.8"
  rds_engine_version_short = "13"
  parameter_group_params = {
    shared_preload_libraries = "pgaudit"
    log_connections    = "1"
    log_disconnections = "1"

    // pgAudit configuration parameters
    // Reference for available settings: https://access.crunchydata.com/documentation/pgaudit/latest/#settings
    "pgaudit.role" = local.pgaudit_role_name
    "pgaudit.log" = "ALL"
  }

}
resource "aws_db_subnet_group" "pgsql" {
  name       = "pgsql"
  subnet_ids = data.aws_subnets.data.ids
}

resource "aws_rds_cluster_instance" "pgsql" {
  count              = var.target_env == "prod" ? 2 : 1
  identifier         = "${local.db_name}-${count.index}"
  cluster_identifier = aws_rds_cluster.pgsql.id
  # https://instances.vantage.sh/aws/rds/db.t3.large
  instance_class     = "db.t3.large" 
  engine             = aws_rds_cluster.pgsql.engine
  engine_version     = aws_rds_cluster.pgsql.engine_version
}

resource "aws_rds_cluster" "pgsql" {
  cluster_identifier  = local.db_name
  engine              = local.rds_engine
  engine_version      = local.rds_engine_version
  availability_zones  = ["ca-central-1a", "ca-central-1b"]
  database_name       = replace(var.project_code, "-", "_")
  master_username     = var.db_username
  master_password     = data.aws_ssm_parameter.postgres_password.value
  storage_encrypted   = true
  deletion_protection = true

  db_subnet_group_name   = aws_db_subnet_group.pgsql.name
  vpc_security_group_ids = [data.aws_security_group.data.id]
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # 2AM-4AM PST
  preferred_backup_window = "09:00-11:00"
  backup_retention_period = var.target_env == "dev" ? 1: 14

  lifecycle {
    # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/rds_cluster#argument-reference
    ignore_changes = [
      availability_zones
    ]
  }
}

resource "aws_db_parameter_group" "pgsql-audit-param-group" {
  count = 1
  name = "pgsql-audit-param-group"
  family = "${local.rds_engine}${local.rds_engine_version_short}"
  // Load pgaudit extension 
  dynamic "parameter" {
    for_each = local.parameter_group_params
    content {
      apply_method = "pending-reboot"
      name = parameter.key
      value = parameter.value
    }
  }
}
