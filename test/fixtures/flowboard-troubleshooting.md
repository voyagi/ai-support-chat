# FlowBoard Troubleshooting

## Common Issues and Solutions

Having trouble with FlowBoard? This guide covers the most frequently reported issues and how to resolve them. If your issue isn't listed here, contact support@flowboard.io or use live chat (Pro users, 9 AM - 6 PM EST, Mon-Fri).

### Why aren't my notifications working?

If you're not receiving email or push notifications:

1. **Check notification settings:** Go to **Settings > Notifications** and verify your preferences. Make sure the notification types you expect are enabled (assignments, mentions, due dates, etc.).
2. **Check per-project settings:** Open the project > **"..." menu > Notification Settings**. If the project is muted, you won't receive notifications for it regardless of workspace settings.
3. **Check email spam folder:** FlowBoard emails come from notifications@flowboard.io. Add this address to your email contacts to prevent spam filtering.
4. **Push notifications (mobile):** Ensure notifications are enabled for FlowBoard in your phone's Settings > Notifications. On iOS, check that "Allow Notifications" is toggled on. On Android, verify the app isn't in battery optimization mode.
5. **Browser notifications (web):** Click the lock icon in your browser's address bar and ensure notifications are set to "Allow" for flowboard.io.

If notifications are configured correctly but still not arriving, there may be a brief delivery delay during high-traffic periods. Delays longer than 5 minutes are unusual -- contact support.

### Why is FlowBoard loading slowly?

Performance issues are usually caused by one of these:

1. **Large projects:** Projects with 1,000+ tasks can take longer to load. Try switching to List view (lighter than Kanban) or apply filters to reduce visible tasks.
2. **Browser extensions:** Ad blockers or privacy extensions sometimes interfere with FlowBoard. Try disabling extensions temporarily or use an incognito/private window.
3. **Browser cache:** Clear your browser cache and cookies for flowboard.io. In Chrome: Settings > Privacy > Clear browsing data > select "Cached images and files".
4. **Internet connection:** Run a speed test at speedtest.net. FlowBoard requires at least 1 Mbps for smooth operation. If you're on a slow connection, enable **Settings > Advanced > Low Bandwidth Mode** in the mobile app.
5. **Outdated browser:** FlowBoard supports Chrome, Firefox, Safari, and Edge (last 2 versions). If you're on an older version, update your browser.

If performance issues persist across browsers and devices, check status.flowboard.io for any ongoing incidents.

### Why did my import fail?

If importing from Trello, Asana, Jira, or CSV fails:

1. **CSV format issues:** Ensure your CSV is UTF-8 encoded with comma separators (not semicolons). The first row must be column headers. Common issues: special characters in task titles, dates in non-standard format (use YYYY-MM-DD), or empty required fields.
2. **Authentication expired:** For Trello/Asana/Jira imports, your OAuth token may have expired. Go to **Settings > Import**, disconnect the service, and reconnect.
3. **File size limit:** CSV imports support up to 10 MB (roughly 50,000 tasks). For larger imports, split your CSV into multiple files.
4. **Jira-specific:** Jira Server imports require admin-level API access. If using Jira Cloud, ensure your API token has the correct scopes. Custom fields with complex data types (cascading selects, multi-user pickers) may not map automatically -- you'll need to clean up manually.

If an import partially completes, don't re-run it immediately. Check the import log in **Settings > Import > History** to see which tasks succeeded and which failed. Fix the failing rows and import only those.

### Why can't I see a project?

If a project is missing from your sidebar or project list:

1. **Private project:** The project may be set to Private. Ask the project owner or an Admin to invite you.
2. **Guest role:** If you're a Guest, you can only see projects you've been explicitly invited to. Ask an Admin to add you to the project.
3. **Archived project:** The project may have been archived. Go to **Projects > Show Archived** to find it. Admins can unarchive projects.
4. **Workspace switch:** If you belong to multiple workspaces, make sure you're in the correct one. Click your workspace name in the top left to switch.

### Why is sync not working between FlowBoard and GitHub?

If tasks aren't updating when PRs are merged or branches are created:

1. **Check integration status:** Go to **Project Settings > Integrations > GitHub** and verify the connection shows "Connected". If it shows "Disconnected", re-authorize.
2. **Repository mismatch:** Ensure the correct repository is linked to the correct project. One repo can be linked to one project (or multiple repos for monorepo setups).
3. **Task key format:** FlowBoard detects task IDs in commit messages and branch names. Use the format "WEB-123" (project key + number). Writing "task 123" or "issue #123" won't be detected.
4. **Permissions:** The GitHub app needs read/write access to the repository. If your organization restricts GitHub apps, ask an admin to approve FlowBoard in GitHub > Settings > Installed GitHub Apps.

### Why can't I upload a file?

File upload failures are typically caused by:

1. **File size:** Free plan allows files up to 25 MB each. Pro allows up to 100 MB. Enterprise has no limit.
2. **Storage quota:** Free plan includes 5 GB total. Check your usage in **Settings > Workspace > Storage**. Delete old attachments or upgrade to Pro for 100 GB per user.
3. **File type:** FlowBoard accepts most file types but blocks potentially dangerous ones (.exe, .bat, .cmd, .msi). If you need to share an executable, zip it first.
4. **Network timeout:** Large files on slow connections may time out. Try a wired connection or upload from a faster network.

### Why did my automation stop working?

If an automation you set up is no longer firing:

1. **Automation disabled:** Check **Project Settings > Automations** and verify the automation is toggled on (green). Automations are automatically disabled after 5 consecutive failures.
2. **Trigger conditions changed:** If you renamed a column or changed custom field options, the automation trigger may no longer match. Edit the automation and re-select the trigger condition.
3. **Slack disconnected:** If the automation posts to Slack and Slack was recently re-authorized, the channel mapping may be lost. Edit the automation and re-select the Slack channel.
4. **Automation limit reached:** Pro plans allow 50 active automations. If you hit the limit, deactivate unused ones or upgrade to Enterprise for unlimited automations.

Check the automation history log for error details: **Project Settings > Automations > History**.

### How do I reset my password?

1. Go to flowboard.io/login
2. Click **"Forgot password?"**
3. Enter your registered email address
4. Check your inbox for a reset link (arrives within 2 minutes)
5. Click the link and set a new password (minimum 8 characters)

If you don't receive the email, check your spam folder. If you use SSO (Enterprise), your password is managed by your identity provider (Okta, Azure AD, etc.) -- reset it there instead.

### How do I recover a deleted task?

Deleted tasks are moved to the project's trash. To recover:

1. Open the project
2. Click **"..." menu > Trash**
3. Find the deleted task and click **"Restore"**

Tasks remain in trash for 30 days before permanent deletion. After 30 days, contact support@flowboard.io -- we can restore from backup within an additional 30 days (60 days total from deletion).

## Still Need Help?

- **Help center:** help.flowboard.io -- guides, videos, and tutorials
- **Email support:** support@flowboard.io (all plans, response within 24 hours)
- **Live chat:** Click the **?** icon in the bottom right (Pro users, 9 AM - 6 PM EST, Mon-Fri)
- **Phone support:** Enterprise customers with Premium Support get 24/7 phone access
- **Status page:** status.flowboard.io -- check for outages or degraded performance
- **Community forum:** community.flowboard.io -- ask questions, share tips, and connect with other FlowBoard users
