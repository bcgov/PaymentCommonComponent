variable "target_env" {}

variable "api_endpoint" {}

variable "project_code" {}

variable "lz2_code" {}

variable "target_aws_account_id" {}

variable "build_id" {}

variable "build_info" {}

variable "db_username" {}

variable "mail_base_url" {}

variable "mail_default_to" {}

variable "disable_automated_reconciliation" {} 

variable "sns_topic_arn_reconciler" {}
variable "sns_topic_arn_parser" {}
variable "sns_topic_arn_batch" {}

variable "auth_base_url" {}
variable "region" {
  default = "ca-central-1"
}

variable "instance_type" {
  default = "t2.small"
}

variable "root_block_device" {
  default = {
    type = "gp2",
    size = "10"
  }
}

locals {
  namespace = "${var.project_code}_${var.target_env}"
  pcc_api_name = "paycocoapi"
  db_name = "${var.project_code}-db"
}
