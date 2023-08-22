locals {
    total_monthly_budget_amount = "600"
    total_monthly_budget_threshold_percentage = "100"
    total_monthly_budget_subscribers = ["Pay.Digital@gov.bc.ca"]
}



resource "aws_budgets_budget" "budget-monthly" {
    name = "Total Monthly Budget (${local.environment})"
    budget_type = "COST"
    limit_amount = local.total_monthly_budget_amount
    limit_unit = "USD"
    time_period_end = "2087-06-15_00:00"
    time_period_start = "2023-08-01_00:00"
    time_unit = "MONTHLY"

    notification {
        comparison_operator = "GREATER_THAN"
        threshold = local.total_monthly_budget_threshold_percentage
        threshold_type = "PERCENTAGE"
        notification_type = "ACTUAL"
        subscriber_email_addresses = local.total_monthly_budget_subscribers
    }
}