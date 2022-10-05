variable "target_env" {
}

variable "project_code" {}

variable "target_aws_account_id" {}


variable "build_id" {}

variable "build_info" {}

variable "region" {
  default = "ca-central-1"
}


locals {
  namespace = "${var.project_code}_${var.target_env}"
  pcc_api_name = "Payment_Common_Component_API"
}
