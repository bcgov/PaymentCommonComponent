terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.55.0"
    }
  }

  backend "s3" {
    bucket         = "terraform-remote-state-iz8ci7-dev"
    key            = ".terraform/terraform.state"
    region         = "ca-central-1"
    dynamodb_table = "terraform-remote-state-lock-iz8ci7"
    encrypt        = true

  }
}

provider "aws" {
  region = var.region
}