# FlowBoard Integrations

## Integrations Overview

FlowBoard connects with the tools you already use. Integrations sync data automatically, trigger actions across platforms, and eliminate manual copy-pasting between systems. All integrations are configured from Settings > Integrations in your workspace.

Free tier includes Slack and Google Drive. Pro and Enterprise users get access to all integrations. Each integration has per-project granularity - enable GitHub for your development projects, but not for marketing campaigns.

## Slack

The Slack integration posts FlowBoard notifications directly to your Slack channels or DMs.

**Setup:**
1. Go to Settings > Integrations > Slack
2. Click "Add to Slack" and authorize FlowBoard
3. Choose default notification channel (e.g., #project-updates)
4. Configure notification rules: task created, completed, assigned, due soon, comments added

**Per-project channels:** In each project's settings, override the default and route notifications to specific channels. Development tasks go to #engineering, marketing tasks to #campaigns.

**Slash commands:** Type `/flowboard create [task name]` in Slack to create tasks without leaving your conversation. Use `/flowboard search [query]` to find tasks and get direct links. `/flowboard standup` generates a summary of your assigned tasks due today - perfect for daily standup meetings.

**Unfurling:** Paste FlowBoard task URLs in Slack and they automatically expand with task details: title, status, assignee, and due date. Click "View Task" to jump directly to FlowBoard.

**Use cases:** Stay in Slack during focused work while still tracking project progress. Reduce notification overload by routing high-priority tasks to dedicated channels and low-priority updates to a catch-all thread.

## GitHub

Link GitHub repositories to FlowBoard projects for automatic issue sync and pull request tracking.

**Setup:**
1. Go to Project Settings > Integrations > GitHub
2. Click "Connect GitHub" and authorize FlowBoard
3. Select which repositories to link (one repo per project, or multiple repos for monorepo setups)
4. Choose sync direction: GitHub → FlowBoard, FlowBoard → GitHub, or bidirectional

**Automatic task linking:** Reference FlowBoard tasks in commit messages or PR descriptions using the task key (e.g., "Fix login bug WEB-123"). FlowBoard automatically links the PR to the task, shows commit history, and updates task status when the PR is merged.

**Branch name mapping:** Name branches like `feature/WEB-123-add-login` and FlowBoard auto-detects the task ID. The task details page shows linked branches and their PR status.

**Status automation:** Configure status mapping in integration settings. For example, when PR is opened → task status "In Review". When PR is merged → task status "Done". When CI fails → add "Failing" label to task.

**Use cases:** Developers work in GitHub, project managers work in FlowBoard, and everyone stays synced automatically. No more "did this get merged?" questions.

## GitLab

GitLab integration works identically to GitHub, with support for GitLab's merge requests, pipelines, and issue boards.

**Setup:**
1. Project Settings > Integrations > GitLab
2. Enter your GitLab instance URL (gitlab.com or self-hosted)
3. Provide a personal access token with `api` and `read_repository` scopes
4. Select projects to link

**Pipeline status:** Task cards show CI/CD pipeline status badges. See at a glance if builds are passing or failing. Click the badge to jump to GitLab pipeline details.

**Merge request templates:** Configure default merge request descriptions that include FlowBoard task links. Enforce a rule that every MR must reference a FlowBoard task ID.

**Self-hosted support:** FlowBoard works with GitLab self-hosted instances. Provide your instance URL during setup. Enterprise customers can configure webhook endpoints behind VPNs or firewalls.

## Google Drive

Attach Google Docs, Sheets, and Slides directly to FlowBoard tasks without downloading and re-uploading files.

**Setup:**
1. Settings > Integrations > Google Drive
2. Click "Connect Google Drive" and authorize FlowBoard
3. FlowBoard can now access files you explicitly attach (we never scan your Drive)

**Attaching files:** Open any task, click "Attach", and select "Google Drive". Browse your Drive folders or search by filename. The file appears in task attachments with a live preview. Click to open in a new tab.

**Permissions:** When you attach a private Google Doc to a task, FlowBoard prompts you to share it with team members. You can grant view or edit access automatically.

**Collaboration:** Team members see the same live document. Changes in Google Docs are immediately visible to everyone - no need to re-upload new versions.

**Use cases:** Store meeting notes in Docs, project plans in Sheets, and slide decks in Slides, all linked to the relevant FlowBoard tasks. Great for remote teams collaborating on shared documents.

## Figma

Embed Figma designs directly in FlowBoard tasks for seamless design handoff.

**Setup:**
1. Settings > Integrations > Figma
2. Click "Connect Figma" and authorize FlowBoard
3. Figma files now appear as attachable items

**Embedding designs:** When attaching Figma files, FlowBoard embeds a live preview of the selected frame. Designers can leave annotations directly in Figma, and developers see them in FlowBoard without switching contexts.

**Version history:** FlowBoard tracks which Figma file version was attached. If the designer updates the file, task comments show "New version available" with a diff view of what changed.

**Inspect mode:** Pro users can click "Inspect" on embedded Figma frames to see CSS properties, spacing, colors, and assets - all without leaving FlowBoard.

**Use cases:** Design → development handoff. Designers attach mockups to implementation tasks, developers reference them while coding, and everyone sees the latest version.

## Jira Import

Migrating from Jira? FlowBoard's Jira Import wizard transfers your projects, issues, comments, attachments, and history.

**Setup:**
1. Settings > Integrations > Jira Import
2. Enter your Jira instance URL (cloud or server)
3. Provide admin credentials or API token
4. Select which Jira projects to import

**Data mapping:** The wizard maps Jira concepts to FlowBoard equivalents:
- Projects → Projects
- Issues → Tasks
- Statuses → Custom columns (we create columns matching your Jira workflow)
- Custom fields → FlowBoard custom fields (types are auto-detected)
- Attachments → Files are downloaded from Jira and uploaded to FlowBoard
- Comments → Preserved with original authors and timestamps

**Incremental import:** Run the import multiple times to keep FlowBoard in sync while you transition. The import is idempotent - running it again updates existing tasks rather than duplicating.

**What doesn't transfer:** Jira workflows (too complex), time tracking logs (we migrate totals but not individual entries), and Jira plugins/extensions (no equivalent in FlowBoard).

**Timeline:** Small projects (< 1,000 issues) import in minutes. Large projects (10,000+ issues) can take 1-2 hours. FlowBoard emails you when the import completes.

**Use cases:** Painless Jira migration. Keep your data and history while moving to a simpler, faster tool.

## Zapier

Zapier opens FlowBoard to 5,000+ apps. Create "Zaps" (automations) that trigger when things happen in FlowBoard or update FlowBoard based on events in other tools.

**Setup:**
1. Go to zapier.com and search for FlowBoard
2. Create a Zap and select FlowBoard as the trigger or action
3. Authenticate with your FlowBoard API key (from Settings > API)
4. Configure the Zap logic

**Popular Zaps:**
- When a new lead is added to HubSpot CRM, create a FlowBoard task in the Sales project
- When a FlowBoard task is marked Done, log it to a Google Sheet for reporting
- When a Typeform response is submitted, create a FlowBoard task with the submission details
- When a FlowBoard task is assigned to you, create a reminder in Todoist
- When a Stripe payment succeeds, create a FlowBoard task for order fulfillment

**Bi-directional sync:** Zapier supports both triggers (FlowBoard → other apps) and actions (other apps → FlowBoard). Build complex workflows like "When Calendly meeting is booked, create FlowBoard task, send Slack notification, and add to Google Calendar."

**Multi-step Zaps:** Chain multiple actions. For example: "When FlowBoard task is completed → post to Slack → update Google Sheet → send thank-you email via Gmail."

**Use cases:** Connect FlowBoard to niche tools that don't have native integrations. Great for agencies with custom workflows or companies using lesser-known software.

## Integration Limits

**Free tier:** Slack and Google Drive only. API access is read-only.

**Pro tier:** All integrations. API rate limit: 1,000 requests/hour. Webhook events for real-time updates.

**Enterprise tier:** All integrations plus priority API access (5,000 requests/hour), dedicated webhooks, and custom integration development assistance from our solutions engineering team.

**Need a custom integration?** Enterprise customers can request bespoke integrations. We've built custom connectors for Salesforce, SAP, Oracle, and internal tools for Fortune 500 companies. Contact your Customer Success Manager to discuss requirements.
