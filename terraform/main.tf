terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.27.0"
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