Propose the following for automating deployments:
Tools
Tools is our “sandbox” environment and should be used for testing out potentially breaking changes, and also for deploying PR’s to ensure they build without error before we merge onto main. It makes sense to keep these deployments manual.

*note:* if you are deploying this project for the first time you must uncomment the lines for running the seeder lambda as this will be required for a new env

Tools Deployments:
local cli using Makefile cmds

GHA

Tools Terraform:
the developer who is using tools should run make plan and verify the output prior to deployment

make apply should run automatically during deployments

Tools Rollback (steps):
git checkout <stable-branch-name>

trigger GHA to wipe DB

run make plan and verify output

run make tag-tools to redeploy to the previous stable branch

Dev
Dev is the first place our QA goes to test. QA owns this env and whenever we merge a pull request we move the ticket into QA. In order to keep the dev environment in sync with our main branch, we should deploy automatically to dev whenever code is merged onto main. We should have already tested our deployment and verified the terraform output to the tools env while the PR was in review, and since we will want to be sure that our infra is in sync with our codebase we should run terraform apply automatically during deployments.

Dev Deployments:
automated deployments when we merge onto main

disable deploying to dev from cli - we should only deploy from GH automatically when we merge

Dev Terraform:
runs automatically when we merge onto main

make plan/apply should have been verified when the PR was in review (deployed and tf apply ran on tools)

Dev Rollback (steps):
Create a bug ticket

Fix the issue

Open PR

Deploy/tf apply on tools

Verify that the issue is resolved

Merge onto main

Verify that the issue is resolved

Test
Test is used as our staging environment and most cloesly resembles prod. For this reason, we should also deploy to test similarily to how we deploy to production.

Test Deployments:
After the QA or tester has verified that dev is working correctly and all dev env tests are passing, the deployment to test should be manually triggered via GHA (not from local machine - the QA/tester/dev who has verified that dev is working correctly should go to the GH repo and trigger the deployment to test through GHA )

The GHA for test should deploy and tag each deployment with a version. This will enable us to test out rollbacks similarily to how it will be done in production. These version do not need to be in sync with prod and should not require any additional sign off - they are simply a way for us to easily rollback test if needed.

Test Terraform:
Should run automatically when the deployment is triggered

Should have already verified plan/apply on tools

Should have already verified plan/apply on dev

Test Rollback (steps):
Create a GHA to deploy test to a previous version

Prod
Prod Deployments:
Manual deployments with approvers

Deployment is triggered, and the output from make plan is displayed

Deployment is paused until approver has reviewed the plan

Upon approval, make apply will run

Upon approval, deployment will run

Prod Terraform:
Make plan run as first step in deployment process

Use GHA to require approval

Make apply will run automatically as part of the GHA to deploy (after approved)

Prod Rollback (steps):
Create a hotfix bug ticket

In github, go to the last stable version and retrigger the deployment (follow steps outline for deployment)