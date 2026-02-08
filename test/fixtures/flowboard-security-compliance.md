# FlowBoard Security & Compliance

## Data Encryption

FlowBoard uses industry-standard encryption to protect your data at every layer.

### Encryption in transit

All data transmitted between your browser and FlowBoard servers uses TLS 1.3 encryption. This includes API requests, file uploads, and websocket connections for real-time updates. We enforce HTTPS for all connections - plain HTTP requests are automatically redirected to HTTPS.

Our TLS configuration scores A+ on SSL Labs tests. We support only strong cipher suites and disable legacy protocols (SSL, TLS 1.0, TLS 1.1) that have known vulnerabilities.

### Encryption at rest

All data stored in FlowBoard's databases is encrypted at rest using AES-256 encryption. This includes:

- Task titles, descriptions, and comments
- File attachments and uploads
- User profile information
- Project metadata and settings
- Activity logs and audit trails

Database encryption keys are managed by AWS Key Management Service (KMS) with automatic rotation every 90 days. We maintain separate encryption keys per customer for Enterprise customers requiring data isolation.

### File storage security

Uploaded files are stored in AWS S3 with server-side encryption (SSE-S3). Files are never publicly accessible - every download requires an authenticated, time-limited signed URL valid for 60 seconds. File URLs expire immediately after download to prevent sharing.

We scan all uploaded files for malware using ClamAV. Files flagged as malicious are quarantined and never served to users. Admins receive notifications of blocked uploads.

## SOC 2 Compliance

FlowBoard is SOC 2 Type II certified, audited annually by an independent third-party auditor.

### What is SOC 2?

SOC 2 is an auditing standard developed by the American Institute of CPAs (AICPA) for service organizations that store customer data. It evaluates five trust service criteria:

1. **Security:** Protection against unauthorized access
2. **Availability:** System uptime and reliability
3. **Processing Integrity:** Complete, accurate, timely processing
4. **Confidentiality:** Protection of sensitive information
5. **Privacy:** Personal information handling practices

FlowBoard's SOC 2 report covers Security, Availability, and Confidentiality criteria.

### Requesting our SOC 2 report

Enterprise customers and prospects evaluating FlowBoard for security compliance can request our latest SOC 2 Type II report:

1. Email compliance@flowboard.io with subject "SOC 2 Report Request"
2. Provide your company name and intended use case
3. Sign the NDA (required by audit firm)
4. We'll send the report within 2 business days

Reports are typically 40-80 pages detailing our security controls, testing procedures, and audit results.

## GDPR Compliance

FlowBoard is fully compliant with the European Union's General Data Protection Regulation (GDPR).

### Data residency

By default, FlowBoard stores data in US-based AWS data centers. EU customers can request data residency in AWS Frankfurt (eu-central-1) during account setup or by contacting support@flowboard.io.

**Enterprise data residency options:**
- United States (us-east-1)
- European Union (eu-central-1, Frankfurt)
- United Kingdom (eu-west-2, London)
- Asia Pacific (ap-southeast-1, Singapore)

Data residency affects where your workspace data is physically stored but doesn't impact performance - we use CloudFront CDN globally for fast access from anywhere.

### Data Processing Agreement (DPA)

FlowBoard provides a Data Processing Agreement (DPA) to all customers, required under GDPR for data processors. The DPA defines:

- FlowBoard's role as data processor, you as data controller
- Data processing purposes (providing project management services)
- Data subject rights (access, deletion, portability)
- Sub-processors (AWS, Stripe, SendGrid)
- Security measures and breach notification procedures

**Signing the DPA:** Go to Settings > Legal > Data Processing Agreement, review the terms, and click "Accept DPA". A signed copy is emailed to your billing address. Enterprise customers can negotiate custom DPA terms.

### GDPR rights

FlowBoard provides tools for exercising GDPR data subject rights:

**Right to access:** Users can download their personal data from Settings > Privacy > Download My Data. Includes profile information, tasks created/assigned, comments, and activity history.

**Right to deletion:** Users can request account deletion from Settings > Privacy > Delete Account. All personal data is permanently deleted within 30 days. Workspace owners can delete user accounts via Settings > Team.

**Right to portability:** Export data in machine-readable JSON format from Settings > Data Export. Includes all workspace data: projects, tasks, comments, attachments, and metadata.

**Right to rectification:** Users can update their profile information, email address, and preferences anytime from Settings > Profile.

**Right to restrict processing:** Users can deactivate their account (Settings > Privacy > Deactivate) without deletion. Deactivated accounts retain data but prevent new processing. Reactivate anytime.

### Lawful basis for processing

FlowBoard processes personal data under these lawful bases:

- **Contract performance:** Providing the project management service you signed up for
- **Legitimate interests:** Analytics to improve the product, fraud prevention, security monitoring
- **Consent:** Marketing emails (opt-in only), optional product analytics

You can withdraw consent for marketing emails via the unsubscribe link in any email or Settings > Notifications > Marketing Emails.

## Single Sign-On (SSO)

Enterprise customers can configure SSO for centralized authentication and user management.

### Supported identity providers

FlowBoard supports SAML 2.0 SSO with these providers:

- Okta
- Azure Active Directory (Microsoft Entra ID)
- OneLogin
- Google Workspace
- Ping Identity
- Any SAML 2.0 compliant IdP

### SSO setup

1. Settings > Security > Single Sign-On
2. Click "Configure SAML SSO"
3. Provide your IdP metadata URL or upload metadata XML
4. FlowBoard generates a unique ACS URL and Entity ID for your workspace
5. Configure the SAML application in your IdP with these values
6. Map SAML attributes: email (required), name, role (optional for auto-provisioning)
7. Test SSO with a non-admin user before enforcing

**Enforcing SSO:** After testing, enable "Require SSO" to disable password logins. Users must authenticate via your IdP. Existing sessions remain valid; new logins require SSO.

**Emergency access:** SSO enforcement creates a backup admin account with a secure recovery code. Store this in your password manager - it's needed if your IdP is down.

### SCIM provisioning

Enterprise customers can automate user provisioning with SCIM (System for Cross-domain Identity Management).

**SCIM setup:**
1. Settings > Security > SCIM
2. Generate SCIM API token (treat as a password - never share)
3. Copy SCIM endpoint URL
4. Configure SCIM in your IdP with endpoint and token
5. Enable push to FlowBoard in your IdP

**What SCIM automates:**
- New user in IdP → auto-created in FlowBoard with default role
- User deactivated in IdP → immediately removed from FlowBoard
- User group changes in IdP → role updates in FlowBoard
- Profile changes (name, email) sync automatically

**Group mapping:** Map IdP groups to FlowBoard roles. Users in the "Engineering" group become Members, "Leadership" group becomes Admins.

## Two-Factor Authentication (2FA)

Enable 2FA to protect your account from credential theft.

### Setting up 2FA

1. Settings > Security > Two-Factor Authentication
2. Click "Enable 2FA"
3. Scan QR code with authenticator app (Authy, Google Authenticator, 1Password)
4. Enter 6-digit verification code from your app
5. Save recovery codes in a secure location

**Recovery codes:** 10 single-use codes for accessing your account if you lose your authenticator device. Print them and store securely. You can regenerate codes anytime from Settings > Security.

### 2FA enforcement (Enterprise only)

Workspace admins can require all users to enable 2FA:

1. Settings > Security > Require Two-Factor Authentication
2. Set grace period (7, 14, or 30 days)
3. Users without 2FA see a banner prompting them to enable it
4. After grace period, users without 2FA are locked out until they enable it

**Exceptions:** Admins can mark specific users as 2FA-exempt (e.g., service accounts, API-only users).

## Backup & Recovery

FlowBoard maintains multiple backup layers to ensure your data is never lost.

### Automated backups

**Database backups:** Continuous backup with point-in-time recovery. We can restore your workspace to any point in the last 30 days.

**File backups:** Attachments are stored in S3 with versioning enabled. Deleted or modified files remain recoverable for 30 days.

**Backup frequency:** Full backup every 24 hours, incremental backups every 6 hours, transaction logs every 5 minutes.

**Geographic redundancy:** Backups are replicated across 3 AWS availability zones. If an entire data center fails, your data remains safe.

### Data recovery

**Accidental deletion:** If you accidentally delete a project or task, contact support@flowboard.io within 30 days. We can restore from backup. Recovery typically takes 2-4 hours.

**Disaster recovery:** In the unlikely event of a major outage, FlowBoard can failover to a backup region within 2 hours (Enterprise SLA: 1 hour). Your workspace remains accessible with minimal data loss (< 5 minutes of recent changes).

### Customer-managed backups (Pro/Enterprise)

Pro and Enterprise customers can configure automated exports to their own cloud storage:

1. Settings > Data Export > Automated Backups
2. Connect Google Drive, Dropbox, AWS S3, or Azure Blob Storage
3. Set backup frequency (daily, weekly)
4. FlowBoard exports your entire workspace as JSON nightly

This gives you an independent backup under your control. Restore by contacting support or use the API to import data into a fresh workspace.

## Penetration Testing & Vulnerability Management

FlowBoard undergoes regular security testing to identify and fix vulnerabilities before attackers can exploit them.

### Annual penetration testing

We hire third-party security firms to conduct penetration tests annually. Tests cover:

- Web application vulnerabilities (OWASP Top 10)
- API security and authentication bypass attempts
- Infrastructure penetration (network, servers, AWS environment)
- Social engineering attempts on employees
- Mobile app security (iOS and Android)

**Results:** High and critical findings are remediated within 30 days. Medium findings within 90 days. Penetration test reports are available to Enterprise customers under NDA.

### Bug bounty program

We run a private bug bounty program on HackerOne for security researchers to report vulnerabilities responsibly. Rewards range from $100 for low-severity issues to $5,000+ for critical vulnerabilities.

**Reporting vulnerabilities:** If you discover a security issue in FlowBoard, report it to security@flowboard.io or via our HackerOne program. We respond within 24 hours and provide bounties for valid reports.

### Vulnerability scanning

We scan our infrastructure weekly with:

- **Dependabot:** Monitors npm and Python dependencies for known CVEs, auto-creates PRs with patches
- **Trivy:** Scans Docker images for OS package vulnerabilities
- **AWS Inspector:** Scans EC2 instances and Lambda functions for security issues
- **Snyk:** Monitors code for security anti-patterns and credential leaks

Critical vulnerabilities trigger alerts to our security team and are patched within 48 hours.

## Compliance Certifications

In addition to SOC 2 and GDPR compliance, FlowBoard holds:

**ISO 27001 (in progress):** Information security management certification, expected Q3 2026.

**HIPAA:** FlowBoard is not currently HIPAA compliant. Healthcare organizations handling PHI should not store protected health information in FlowBoard. Contact sales@flowboard.io if you need HIPAA compliance - we're evaluating demand for a HIPAA-compliant version.

**FedRAMP (planned):** For US government customers. Expected 2027.

## Security Incident Response

Despite our best efforts, security incidents can happen. Here's how we respond.

### Incident response plan

1. **Detection:** Security monitoring alerts our on-call team to suspicious activity
2. **Containment:** Isolate affected systems, revoke compromised credentials, block malicious IPs
3. **Investigation:** Determine scope, what data was accessed, how the breach occurred
4. **Notification:** Notify affected customers within 72 hours (GDPR requirement)
5. **Remediation:** Patch vulnerabilities, rotate secrets, implement additional controls
6. **Post-mortem:** Internal review of what went wrong and how to prevent recurrence

### Customer notification

If a security incident affects your workspace:

- **72 hours:** Email notification to workspace Owner and billing contact
- **Notification includes:** What happened, what data was affected, steps we've taken, actions you should take
- **Updates:** We provide updates every 24 hours until the incident is resolved

**Status page:** During major incidents, we post updates to status.flowboard.io for real-time information.

### Reporting security concerns

If you notice suspicious activity in your workspace or receive phishing emails claiming to be from FlowBoard:

1. Email security@flowboard.io immediately
2. Include details: suspicious IP addresses, email headers, screenshots
3. Don't click links or download attachments from suspicious emails
4. We'll investigate within 24 hours and respond with findings

**Phishing:** FlowBoard will never ask for your password via email. We'll never request sensitive information via unsolicited phone calls. All legitimate FlowBoard emails come from @flowboard.io domains.
