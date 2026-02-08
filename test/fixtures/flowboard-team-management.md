# FlowBoard Team Management

## Workspace Roles

FlowBoard has four workspace-level roles, each with different permissions. Choose roles carefully - they control access to billing, data, and workspace settings.

### Owner

The workspace creator is the Owner. There's only one Owner per workspace. Owners have full administrative access:

- Manage billing and subscription
- Delete the workspace
- Transfer ownership to another user
- Add/remove Admins
- All Admin permissions

**Transferring ownership:** Go to Settings > Team > Your Profile > Transfer Ownership. Select the new owner (must be an existing Admin). They'll receive an email to confirm. Ownership transfer is immediate and irreversible - you'll become an Admin after transfer.

### Admin

Admins have nearly full control except workspace deletion and billing:

- Invite and remove users
- Create and delete projects
- Configure integrations
- Manage API keys and webhooks
- View workspace activity logs
- Change workspace settings (name, logo, branding)
- Promote Members to Admin or demote Admins to Member

**When to use:** Admins should be trusted leadership (VPs, directors, senior PMs) who need to manage the workspace but shouldn't handle billing.

### Member

Members are standard users. They can create and work in projects but can't access workspace-level settings.

**Member permissions:**
- Create projects
- Edit tasks in projects they're part of
- Invite Guests to their projects
- Create API keys (scoped to their own permissions)
- View other projects (unless set to Private)

**Member restrictions:**
- Can't access Settings > Billing or Team
- Can't delete other users' projects
- Can't configure workspace integrations
- Can't view audit logs (Enterprise only)

**When to use:** Most of your team should be Members. This prevents accidental workspace changes while allowing full project collaboration.

### Guest

Guests are external collaborators with read-only access to specific projects.

**Guest permissions:**
- View assigned projects only
- Comment on tasks
- View attachments and activity history
- Receive email notifications

**Guest restrictions:**
- Can't create or edit tasks
- Can't create projects
- Can't invite other users
- Can't access any workspace settings
- Can't see other projects (even public ones)

**Guest billing:** Guests don't count as billable users. You can invite unlimited guests at no extra cost on any plan tier.

**When to use:** Perfect for clients, external contractors, stakeholders, or anyone who needs visibility but not editing access. Common use case: design agencies giving clients view-only access to project status.

## Inviting Members

There are three ways to invite people to your FlowBoard workspace.

### Email invitations

1. Go to Settings > Team
2. Click "Invite Members"
3. Enter email addresses (comma-separated for multiple)
4. Select role: Admin, Member, or Guest
5. Click "Send Invitations"

Invitees receive an email with a link to join. Links expire after 7 days. If they don't respond, resend the invitation from Settings > Team > Pending Invitations.

### Shareable invite link

For teams onboarding many people at once:

1. Go to Settings > Team > Invite Members
2. Click "Generate Invite Link"
3. Select role and optional expiration date (1 day, 7 days, 30 days, never)
4. Copy the link and share via Slack, email, or your intranet

Anyone with the link can join your workspace with the specified role. Revoke the link anytime from Settings > Team > Invite Links.

**Security note:** Be cautious with invite links. Anyone with the link can join. For sensitive workspaces, prefer email invitations over shareable links.

### SSO auto-provisioning (Enterprise only)

Enterprise customers with SSO enabled can configure auto-provisioning:

1. Settings > Security > SSO
2. Enable "Auto-provision new users"
3. Set default role (typically Member)
4. Save

Now when someone from your domain logs in via SSO for the first time, they're automatically added to your workspace. No manual invitation needed. Great for large organizations where employees should have immediate access.

## Managing Permissions

### Project-level permissions

Individual projects have their own permission settings independent of workspace roles.

**Project visibility:**
- **Public:** All workspace members can view and edit (unless restricted by role)
- **Private:** Only invited members can see the project

**Setting project permissions:**
1. Open a project
2. Click Settings (gear icon) > Members
3. Add specific people to the project
4. Set per-person permissions: Can Edit or View Only

**Use case:** A Public workspace project allows all Members to collaborate. A Private project restricts access to a specific team - great for confidential initiatives like acquisitions, layoff planning, or stealth product launches.

### Guest permissions

When inviting a Guest to your workspace:

1. Specify which project(s) they can access
2. Guests automatically get View Only permission
3. Guests can't access any projects unless explicitly invited

**Changing guest access:**
- To give a Guest access to another project: open that project > Settings > Members > Add the Guest
- To revoke access: open the project > Settings > Members > Remove the Guest

### Custom roles (Enterprise only)

Enterprise customers can create custom roles with granular permissions:

1. Settings > Team > Roles
2. Click "Create Custom Role"
3. Name the role (e.g., "Contractor", "View-Only Admin", "Project Manager")
4. Configure permissions:
   - Create/delete projects
   - Invite users
   - Configure integrations
   - View billing (without ability to change)
   - Export data
   - Manage API keys

Custom roles appear as options when inviting users or changing existing members' roles.

**Use case:** A "Contractor" role might allow creating projects and tasks but not accessing billing or inviting others. A "Viewer" role might allow read access to all projects without edit permissions.

## Team Activity Log

Track what's happening across your workspace with the activity log.

**Access:** Settings > Team > Activity Log (Admin only; Enterprise gets full audit log)

**What's logged:**
- User invitations sent and accepted
- Role changes (Member promoted to Admin)
- Project creation and deletion
- Integration configurations
- API key creation
- Billing changes (plan upgrades, payment method updates)
- User removals

**Activity log retention:**
- **Free/Pro:** 90 days
- **Enterprise:** Unlimited retention with export to CSV or JSON

**Use case:** Investigate unexpected changes ("Who deleted the Marketing project?"), compliance auditing for SOC 2, or tracking team growth trends.

### Audit logs (Enterprise only)

Enterprise customers get enhanced audit logs with:

- Every task creation, edit, and deletion with before/after diffs
- File uploads and downloads (for data leak prevention)
- Login attempts, IP addresses, and session management
- SCIM provisioning events
- SSO authentication logs

Export audit logs to your SIEM system (Splunk, Sumo Logic) via webhook. Retention is unlimited. Logs are immutable - even Owners can't delete audit records.

## Removing Members

### Removing a user

1. Settings > Team
2. Find the user and click "..." menu
3. Select "Remove from Workspace"
4. Confirm removal

**What happens:**
- User loses access immediately
- Tasks assigned to them remain assigned (reassign manually or use bulk-reassign)
- Comments and activity history remain (attributed to "Removed User" with their name)
- If on Pro/Enterprise, billing adjusts next cycle with prorated credit

**Can't remove Admins?** Only Owners can remove Admins. Admins can remove Members and Guests.

### Offboarding checklist

When an employee leaves:

1. Remove from workspace (immediate access revocation)
2. Reassign their active tasks to others
3. Revoke any API keys they created: Settings > API > find keys by creator
4. Rotate any shared credentials they had access to
5. Review projects they owned and assign new owners

**Enterprise customers:** Use SCIM to sync with your identity provider (Okta, Azure AD). When you deactivate a user there, FlowBoard automatically removes them and revokes access.

## Managing Teams at Scale

### Organizing large workspaces

For organizations with 100+ users:

**Use projects as teams:** Create projects named "Engineering Team", "Marketing Team", "Sales Team" and add only those department members. Pin these projects for easy navigation.

**Naming conventions:** Standardize project naming (e.g., "2025-Q1-Website-Redesign", "Client-Acme-Corp"). Makes searching and filtering easier.

**Guest accounts for clients:** Each client gets Guest access to their specific project(s). They see only their work, not other clients' projects.

**Department admins:** Promote department heads to Admin so they can manage their team's invitations and projects without IT bottleneck.

### User provisioning (Enterprise)

Enterprise customers can automate user management with SCIM:

1. Settings > Security > SCIM
2. Generate SCIM token
3. Configure in your identity provider (Okta, Azure AD, OneLogin)
4. Map SCIM attributes to FlowBoard roles

**Benefits:**
- New employee added to Okta → automatically added to FlowBoard
- Employee deactivated → loses FlowBoard access instantly
- Role changes sync automatically
- No manual user management

**Group mapping:** Map Okta/Azure AD groups to FlowBoard roles. "Engineering" group → Member, "Leadership" group → Admin.

### Bulk operations

Need to update many users at once?

**CSV import/export:**
1. Settings > Team > Export Users (download current users as CSV)
2. Edit in Excel: change roles, add new users, or mark users for removal
3. Settings > Team > Import Users (upload edited CSV)
4. Preview changes and confirm

**Bulk role changes:** Select multiple users (checkbox) in Settings > Team and click "Change Role" to update everyone at once.

**API automation:** Use the FlowBoard API to script bulk user operations. See API documentation for the `/users` endpoint.
