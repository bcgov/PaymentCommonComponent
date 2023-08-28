terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.55.0"
    }
    postgresql = {
      source = "cyrilgdn/postgresql"
      version = "1.20.0"
    }
  }
  

  backend "remote" {}
}

provider "aws" {
  region = var.region
  assume_role {
    role_arn = "arn:aws:iam::${var.target_aws_account_id}:role/BCGOV_${var.target_env}_Automation_Admin_Role"
  }
}

provider "postgresql" {
  host      = aws_rds_cluster.pgsql.endpoint
  database  = aws_rds_cluster.pgsql.database_name
  username  = aws_rds_cluster.pgsql.master_username
  password  = data.aws_ssm_parameter.postgres_password.value
  sslmode   = "require"
  connect_timeout = 15
}

