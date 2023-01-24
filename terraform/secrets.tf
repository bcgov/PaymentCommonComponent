# These should be manually populated in the console for each environment

data "aws_ssm_parameter" "sftp_user_sbc" {
  name = "/${var.project_code}/${var.target_env}/sftp/user/sbc"
}

data "aws_ssm_parameter" "sftp_user_pcc" {
  name = "/${var.project_code}/${var.target_env}/sftp/user/pcc"
}

data "aws_ssm_parameter" "postgres_password" {
  name = "/${var.project_code}/${var.target_env}/postgres/password"
}