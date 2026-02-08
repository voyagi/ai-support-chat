# FlowBoard Changelog

## Recent Updates

We ship improvements to FlowBoard every two weeks. Here's what's new.

## v3.2 -- January 2026

**Headline:** Command palette redesign and automation conditional logic

**New features:**

- **Redesigned command palette (Cmd+K):** Faster search across tasks, projects, and people. Results now show inline previews with status, assignee, and due date. Navigate entirely with keyboard -- arrow keys to browse, Enter to open, Tab to switch categories.
- **Conditional logic in automations (Enterprise):** Add if/else branches to automation workflows. For example: "When task moves to Done, IF priority is Critical THEN post to #releases in Slack, ELSE just archive the task." Build complex workflows without code.
- **Bulk task editing in List view:** Select multiple tasks with checkboxes and apply changes to all at once -- update status, reassign, change priority, or set due dates. Saves hours of repetitive clicking.
- **Calendar view improvements:** Tasks now show colored priority indicators. Drag tasks between days to reschedule. Week view added alongside existing month view.

**Improvements:**

- Timeline view loads 40% faster for projects with 500+ tasks
- Slack notifications now include clickable task links (previously plain text)
- Mobile app: swipe gestures are now customizable in Settings > Gestures
- CSV export includes custom field data (previously omitted)

**Bug fixes:**

- Fixed an issue where duplicate notifications were sent when a task was assigned and status-changed simultaneously
- Fixed Timeline view dependency arrows disappearing after browser zoom
- Fixed mobile app crash when opening tasks with 50+ comments
- Fixed SCIM provisioning failing for usernames with special characters

## v3.1 -- December 2025

**Headline:** Dark mode for web and Figma integration v2

**New features:**

- **Dark mode (web):** Toggle between Light, Dark, or System-matching themes from Settings > Appearance. Dark mode uses carefully calibrated colors for comfortable extended use. Pro users can customize accent colors.
- **Figma integration v2:** Embedded Figma previews now update in real-time when designers modify frames. New "Inspect" mode shows CSS properties, spacing, and color values directly in FlowBoard -- no need to switch to Figma for handoff details.
- **Task dependencies in Kanban view:** Dependency arrows now appear on Kanban boards (previously only in Timeline view). Hover over a task to see what it blocks and what blocks it.
- **Scheduled reports (Enterprise):** Automatically email dashboard reports to stakeholders on a weekly or monthly schedule. Configure recipients, report format (PDF or CSV), and delivery day/time.

**Improvements:**

- Project templates now include automation rules (previously stripped on template creation)
- Guest users can now add emoji reactions to comments (previously restricted to Members)
- Search results now highlight matching terms in task descriptions, not just titles
- API rate limits increased: Pro from 750 to 1,000 requests/hour

**Bug fixes:**

- Fixed an issue where archiving a project didn't properly archive its automations, causing ghost notifications
- Fixed Google Drive attachments showing "Access Denied" for newly invited team members
- Fixed sprint burndown chart miscounting tasks moved between sprints
- Fixed 2FA setup failing on Firefox when using Authy browser extension

## v3.0 -- November 2025

**Headline:** New reporting engine, custom dashboards, and API v2

**New features:**

- **Custom dashboards (Pro):** Build your own dashboards by combining report widgets. Available widgets: velocity chart, burndown, cycle time, task distribution by assignee, completion rate trend, and activity heatmap. Save multiple dashboards and share URLs with stakeholders.
- **Reporting engine overhaul:** Reports now load 3x faster with real-time data (previously refreshed every 15 minutes). New report types: cycle time analysis and activity heatmap showing when your team is most productive.
- **API v2:** New versioned API with improved pagination, filtering, and webhook event types. v1 remains supported through June 2026. See our API Reference for migration guide.
- **Resource view in Timeline (Pro):** Switch from task-based to person-based timeline. See each team member's workload across all projects. Drag tasks between people to reassign and rebalance workload visually.

**Improvements:**

- Onboarding flow redesigned with interactive tutorial for new users
- Project templates library expanded to 25+ templates (added: Hiring Pipeline, Content Calendar, Event Planning)
- Mobile app now supports iPad split-view and Samsung DeX
- Webhook payloads now include before/after diffs for task updates

**Bug fixes:**

- Fixed memory leak in Kanban view when rapidly switching between large projects
- Fixed GitLab integration failing for self-hosted instances using custom ports
- Fixed task due date resetting to null when editing description via API
- Fixed invite emails occasionally not being delivered to Outlook.com addresses

## Older Releases

For the complete changelog going back to FlowBoard v1.0, visit flowboard.io/changelog. Each release includes detailed notes, migration guides for breaking changes, and video walkthroughs of major features.

## Stay Updated

- **In-app:** A "What's New" badge appears on the ? icon when we ship updates. Click to see highlights.
- **Email:** Subscribe to release notes at flowboard.io/changelog (monthly digest or per-release).
- **Twitter/X:** Follow @flowboard for feature announcements and tips.
- **Blog:** flowboard.io/blog for deep dives into new features and customer stories.
