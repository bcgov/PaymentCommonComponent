resource "aws_sns_topic" "reconciliation_results" {
    name = "reconciliation-results-topic"
}

resource "aws_sns_topic_subscription" "reconciliation_results_target" {
  topic_arn = aws_sns_topic.reconciliation_results.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.reports.arn
}

resource "aws_lambda_permission" "sns_permission" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.reports.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.reconciliation_results.arn
}
