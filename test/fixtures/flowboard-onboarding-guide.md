# FlowBoard Onboarding Guide

## Welcome to FlowBoard

Getting your team up and running on FlowBoard is straightforward. This guide walks you through a recommended first-week plan so your team is productive from day one. Whether you're a startup spinning up your first project or an enterprise migrating thousands of tasks, this guide has you covered.

## Day 1: Set Up Your Workspace

### Create your workspace

1. Sign up at flowboard.io -- your 14-day Pro trial starts immediately (no credit card required)
2. Name your workspace after your company or team (e.g., "Acme Engineering")
3. Upload your company logo in **Settings > Workspace > Branding** so it appears in the sidebar and email notifications
4. Set your workspace timezone in **Settings > Workspace > General** -- this affects due date calculations and notification timing

### Configure basic settings

- **Default project visibility:** Choose whether new projects are Public (all members can see) or Private (invite-only) from **Settings > Workspace > Defaults**
- **Notification preferences:** Set workspace-wide notification defaults in **Settings > Notifications**. Teams typically start with "Mentions and Assignments" to avoid notification overload

### Invite your team

Go to **Settings > Team > Invite Members** and add your teammates:

- **Admins:** Team leads or managers who need to configure integrations and manage settings
- **Members:** Everyone who will create and work on tasks
- **Guests:** External stakeholders, clients, or contractors who need view-only access

Share the invite via email or copy the invite link to paste in Slack. New users get an onboarding tour when they first log in.

## Day 2: Create Your First Project

### Pick a real project

Don't start with a test project -- pick something your team is actively working on. Real tasks create real engagement. Good first projects:

- A feature sprint your engineering team is running
- A marketing campaign in progress
- A client deliverable with upcoming deadlines

### Choose a template

FlowBoard includes 20+ templates for common workflows. When creating your project, select the template closest to your work:

- **Sprint Planning** -- for software development teams
- **Marketing Campaign** -- for content and campaign management
- **Product Roadmap** -- for product teams planning features
- **Bug Tracker** -- for QA and support teams
- **Customer Onboarding** -- for client-facing teams

Templates pre-populate columns, example tasks, and automations. Customize or delete the examples to fit your needs.

### Set up your board columns

If starting from scratch, configure your columns to match your workflow. Common setups:

- **Simple:** To Do | In Progress | Done
- **Development:** Backlog | Ready | In Dev | Code Review | QA | Done
- **Agency:** Brief | In Progress | Client Review | Revisions | Approved

You can always add, rename, or reorder columns later from the board settings.

## Day 3: Import Existing Work

### Migrating from another tool?

FlowBoard supports direct import from popular project management tools:

- **From Trello:** Settings > Import > Trello. Authorize FlowBoard to access your Trello account, select boards to import. Columns, cards, labels, and attachments are preserved.
- **From Asana:** Settings > Import > Asana. Connect with your Asana credentials, choose projects. Tasks, sections, subtasks, and comments transfer automatically.
- **From Jira:** Settings > Import > Jira. Provide your Jira instance URL and API token. Issues, statuses, custom fields, and sprint history are mapped to FlowBoard equivalents. Large Jira imports (10,000+ issues) can take 1-2 hours.

### Importing from CSV

Have tasks in a spreadsheet? Export as CSV and import:

1. Go to your project > **"..." menu > Import from CSV**
2. Upload your CSV file
3. Map CSV columns to FlowBoard fields (title, description, assignee, priority, due date)
4. Preview the import and click **"Import"**

### Starting fresh

If you're building from scratch, use bulk task creation: click **"..." menu > Bulk Create**, paste a list of task titles (one per line), and FlowBoard creates them all in seconds. You can assign, prioritize, and schedule them afterward.

## Day 4: Connect Your Tools

### Set up integrations

Connect the tools your team already uses so work flows between platforms:

- **Slack:** Get task notifications in your team channels. Set up in **Settings > Integrations > Slack**. Use `/flowboard create` to make tasks without leaving Slack.
- **GitHub / GitLab:** Link repos to projects for automatic PR tracking. Reference task IDs in commits (e.g., "Fix WEB-123") and FlowBoard auto-links them.
- **Google Drive:** Attach Docs, Sheets, and Slides directly to tasks.
- **Figma:** Embed designs in tasks for seamless design handoff.

Free plans include Slack and Google Drive. Pro plans unlock all integrations including GitHub, GitLab, Figma, and Zapier.

### Set up automations (Pro)

Start with 2-3 simple automations to save your team time:

- "When task moves to Done, post to #wins in Slack"
- "When due date is 3 days away, email the assignee"
- "When priority set to Critical, assign to team lead"

Go to **Project Settings > Automations > Create Automation** to get started.

## Day 5: Train Your Team

### Host a 15-minute walkthrough

Schedule a quick team call to cover:

1. How to create and edit tasks (press `C` to create, `E` to edit)
2. How to switch between Kanban, List, and Timeline views
3. How to use filters ("Show me my tasks due this week")
4. How to comment and @mention teammates
5. Where to find the mobile app (App Store / Google Play)

### Share these keyboard shortcuts

Post these in your team's Slack channel for quick reference:

- `C` -- Create new task
- `K` or `Cmd+K` -- Command palette / quick search
- `/` -- Search
- `E` -- Edit selected task
- `?` -- Show all keyboard shortcuts

### Encourage mobile adoption

Have everyone download the FlowBoard app (iOS and Android). Push notifications keep the team responsive, and offline mode means tasks are always accessible.

## First-Week Checklist

Use this checklist to track your onboarding progress:

- [ ] Workspace created and branded (logo, timezone)
- [ ] Team members invited with correct roles
- [ ] First real project created from template
- [ ] Existing work imported (Trello/Asana/Jira/CSV) or tasks created
- [ ] Slack integration connected
- [ ] At least one automation set up (Pro)
- [ ] Team walkthrough completed
- [ ] Mobile app installed by all team members
- [ ] Keyboard shortcuts shared with team

## Tips for Long-Term Success

**Keep boards clean.** Archive completed projects monthly. Move stale tasks to a "Parking Lot" column rather than deleting them.

**Use labels consistently.** Agree on a shared labeling system (e.g., "bug", "feature", "design", "docs") and stick with it across projects.

**Review dashboards weekly.** Pro users should check the Reporting dashboard weekly to monitor velocity, identify bottlenecks, and track on-time delivery.

**Iterate on your workflow.** Your board columns and automations will evolve. Revisit them monthly and adjust based on what's working.

Need help onboarding? Pro users can reach us via live chat (9 AM - 6 PM EST, Mon-Fri). Enterprise customers get dedicated onboarding sessions with a Customer Success Manager. Everyone can email support@flowboard.io or visit help.flowboard.io.
