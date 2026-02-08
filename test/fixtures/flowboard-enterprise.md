# FlowBoard Enterprise

## Overview

FlowBoard Enterprise is built for organizations that need advanced security, compliance, and dedicated support. Whether you're in a regulated industry, managing thousands of users, or require custom infrastructure, Enterprise gives you the control and confidence to scale FlowBoard across your organization.

Enterprise pricing starts at $29/user/month (billed monthly) or $24/user/month (billed annually). Minimum 50 users. Contact sales@flowboard.io for custom pricing and volume discounts.

## Security & Access Control

### Single Sign-On (SSO)

Centralize authentication with SAML 2.0 SSO. FlowBoard integrates with all major identity providers:

- Okta
- Azure Active Directory (Microsoft Entra ID)
- OneLogin
- Google Workspace
- Ping Identity
- Any SAML 2.0 or OIDC-compliant provider

SSO enforces your organization's password policies, MFA requirements, and session management rules. Once enabled, you can require SSO for all users -- password-based login is disabled, and a backup admin account with a recovery code is created for emergencies.

### SCIM User Provisioning

Automate user lifecycle management with SCIM (System for Cross-domain Identity Management):

- New employee added to your IdP? They're automatically provisioned in FlowBoard with the correct role.
- Employee leaves the company? Deactivating them in Okta or Azure AD instantly revokes FlowBoard access.
- Group membership changes? Role updates sync automatically based on your group-to-role mapping.

No more manual user management. SCIM keeps FlowBoard in sync with your source of truth.

### Advanced Permissions

Go beyond the standard Owner/Admin/Member/Guest roles with custom role definitions:

- Create roles like "Project Manager" (can manage projects but not billing), "Contractor" (can edit assigned tasks only), or "Auditor" (read-only across all projects)
- Set project-level access controls -- restrict who can view, edit, or admin each project
- Enforce IP allowlisting to restrict access to approved office networks or VPN ranges
- Configure session management: automatic logout after inactivity, maximum session duration, and concurrent session limits

### Two-Factor Authentication Enforcement

Require all workspace users to enable 2FA. Set a grace period (7, 14, or 30 days) for users to comply. After the grace period, users without 2FA are locked out until they enable it. Admins can exempt specific service accounts from the requirement.

## Compliance & Data Governance

### Audit Logs

Every action in your workspace is recorded in an immutable audit log:

- Task creation, edits, and deletions (with before/after diffs)
- User logins, logouts, and failed authentication attempts with IP addresses
- File uploads and downloads (for data leak prevention)
- Permission changes and role assignments
- Integration configuration changes
- SCIM provisioning events

Audit logs have unlimited retention and can be exported to CSV or streamed to your SIEM system (Splunk, Sumo Logic, Datadog) via webhook for centralized monitoring.

### Data Residency

Choose where your data is physically stored to meet regulatory requirements:

- **United States** (us-east-1, Virginia) -- default
- **European Union** (eu-central-1, Frankfurt) -- for GDPR compliance
- **United Kingdom** (eu-west-2, London)
- **Asia Pacific** (ap-southeast-1, Singapore)

Data residency is set at workspace creation or can be migrated by contacting your Customer Success Manager. Migration typically takes 2-4 hours with minimal downtime.

### Compliance Certifications

FlowBoard holds the following certifications relevant to Enterprise customers:

- **SOC 2 Type II** -- independently audited annually, covering Security, Availability, and Confidentiality
- **GDPR compliant** -- full Data Processing Agreement (DPA) available, data subject rights tools built in
- **ISO 27001** -- certification in progress, expected Q3 2026

Enterprise customers can request our SOC 2 report by emailing compliance@flowboard.io. See our Security & Compliance page for full details on encryption, backup, and vulnerability management.

## Dedicated Support

### Customer Success Manager

Every Enterprise account is assigned a dedicated Customer Success Manager (CSM) who serves as your primary point of contact:

- Onboarding assistance and custom training sessions for your team
- Quarterly business reviews to optimize your FlowBoard usage
- Proactive guidance on new features and best practices
- Escalation path for urgent issues

### Priority Support SLA

Enterprise support response times:

| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | Workspace inaccessible, data loss | 1 hour |
| High | Major feature broken, workaround available | 2 hours |
| Medium | Minor feature issue, no workaround | 8 business hours |
| Low | Question, enhancement request | 24 business hours |

Support channels: email (support@flowboard.io), live chat (24/7 with Premium Support add-on), and phone for Critical/High severity issues.

### Uptime Guarantee

Enterprise customers receive a 99.99% uptime SLA with financial credits if we fall short:

| Monthly Uptime | Credit |
|----------------|--------|
| 99.99% - 99.95% | No credit |
| 99.95% - 99.0% | 10% of monthly bill |
| 99.0% - 95.0% | 25% of monthly bill |
| Below 95.0% | 50% of monthly bill |

Uptime is measured monthly, excluding scheduled maintenance windows (announced 48 hours in advance).

## Enterprise-Only Features

Beyond security and compliance, Enterprise unlocks:

- **Unlimited automations** with conditional logic (if/else branching) and webhook actions
- **Scheduled report emails** -- automatically email dashboards to stakeholders weekly or monthly
- **Custom templates** -- create organization-wide project templates that enforce standards
- **Advanced API access** -- 5,000 requests/hour with dedicated webhook endpoints
- **Custom contract terms** -- MSA, custom DPA, and flexible billing arrangements
- **Onboarding and training** -- live training sessions for your team during rollout

## Getting Started with Enterprise

1. **Contact sales:** Email sales@flowboard.io or book a demo at flowboard.io/demo
2. **Discovery call:** We'll learn about your team size, workflow, security requirements, and integration needs
3. **Custom proposal:** Receive a tailored pricing and implementation plan
4. **Pilot program:** Start with a 30-day pilot for a subset of your team (no commitment)
5. **Rollout:** Your CSM guides full deployment, SSO/SCIM configuration, and team training

Already on Pro and ready to upgrade? Contact your account representative or email sales@flowboard.io. Upgrades are seamless -- all your projects, tasks, and data carry over automatically.
