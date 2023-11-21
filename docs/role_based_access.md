We can end up with a mix of ministry-specific roles and role-based access control on specific endpoints. We have possibilities to use just the API Gateway, or a mix of API Gateway and database RBAC.

What is the process in which we assign and approve roles?

Users will need to login to the API Gateway with their IDIRs and request access to the Payment application. This will create a service account for them which can then be granted access and roles.

They will need to communicate with the team (PO?) which ministry they are a part of and which “role” they will be (as we define them). The separate roles for now might be consumer (read results, reports) and producer (submit data)

Users will be approved by PO, and the approval process will involve creating the service account on API gateway. We will need to document how to do this, but it will involve logging in with an IDIR, creating a consumer, approving them, and adding the ministry specific roles on the Gateway.

Can consumer creation be done with an API Request to the API Gateway? I’m not seeing a way at the moment.

Where will roles be managed?

One easy option would be to manage both Ministry-based roles and task-based roles in the API Gateway. This makes the approval process simple and something that can be managed by the PO.

One possible option too would be to manage one of the role types in our database. This gives us more fine-grained options, making it easier to create, remove, and query existing roles. This however would have ramifications on the process to accept people, as we would have to write endpoints for an admin to be able to assign roles.

In this sense, my recommendation is to start with roles managed strictly on API Gateway and move to something managed on the backend if the need arises. The transition wouldn’t be too difficult.

What, from the token, can we use to determine one's role?


Tokens include all the roles attached to a user, so we can determine with guards what role is passed in by sending credentials to API Gateway and decoding the returned JWT. We can have a RoleGuard that checks the jwt from context and finds the roles attached, so for example, one would have consumer and sbc as roles to be able to read SBC reports.