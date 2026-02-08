# FlowBoard Templates

## Overview

Templates let you spin up new projects in minutes instead of building boards from scratch. Each template comes with pre-configured columns, example tasks, custom fields, and automations tailored to a specific workflow. Pick a template, customize it to your needs, and start working immediately.

## Built-In Templates

FlowBoard includes 25+ templates organized by category. Here are the most popular ones:

### Sprint Planning

Designed for software development teams running agile sprints.

- **Columns:** Backlog | Ready | In Dev | Code Review | QA | Done
- **Custom fields:** Story Points, Sprint Number, Bug Severity
- **Automations:** When task moves to Code Review, assign to designated reviewer. When task moves to Done, update sprint burndown.
- **Includes:** Example user stories, bug report template, and sprint retrospective task

### Product Roadmap

For product teams planning features across quarters.

- **Columns:** Ideas | Evaluating | Planned | In Progress | Shipped
- **Custom fields:** Quarter, Impact Score, Effort Estimate
- **Automations:** When task moves to Shipped, post to #product-updates in Slack
- **Includes:** Example feature cards with acceptance criteria format

### Bug Tracker

Track and resolve bugs efficiently.

- **Columns:** New | Triaged | In Progress | Fixed | Verified | Closed
- **Custom fields:** Severity (Critical/High/Medium/Low), Affected Version, Browser/OS
- **Automations:** When severity is Critical, assign to on-call engineer and post to #incidents in Slack
- **Includes:** Bug report template with reproduction steps format

### Marketing Campaign

Coordinate marketing launches from planning to post-launch analysis.

- **Columns:** Planning | Content Creation | Review | Scheduled | Live | Complete
- **Custom fields:** Campaign Type, Channel, Budget, Launch Date
- **Automations:** When task moves to Review, notify campaign manager
- **Includes:** Example tasks for blog post, social media, email, and landing page

### Customer Onboarding

Guide new customers through your onboarding process.

- **Columns:** Welcome | Setup | Training | Go-Live | Follow-Up
- **Custom fields:** Customer Name, Plan Tier, CSM Assigned, Go-Live Date
- **Automations:** When all tasks in Setup are done, move project to Training. When go-live date is 3 days away, send reminder to CSM.
- **Includes:** Checklist tasks for account setup, data migration, training, and launch

### Additional Templates

Other built-in templates include:

- **Hiring Pipeline** -- sourcing, screening, interviews, offer, onboarding
- **Content Calendar** -- ideation, drafting, editing, publishing, promotion
- **Event Planning** -- venue, speakers, marketing, logistics, day-of tasks
- **Product Launch** -- research, design, development, QA, go-to-market
- **Design Sprint** -- understand, sketch, decide, prototype, test (Google Ventures style)
- **Client Project** -- brief, discovery, design, development, delivery, feedback

## Using Templates

### Creating a project from a template

1. Click **"Create Project"** from the sidebar or Projects page
2. Instead of starting blank, click **"Use Template"**
3. Browse templates by category or search by name
4. Preview the template to see its columns, tasks, and automations
5. Click **"Use This Template"**
6. Name your project and set the project key
7. FlowBoard copies the template's structure into your new project

Everything in the template is fully editable once copied -- rename columns, delete example tasks, adjust automations, and add your own content.

### Template variables

Templates support placeholder variables that auto-fill when you create a project:

- `{{PROJECT_NAME}}` -- replaced with your project name
- `{{START_DATE}}` -- replaced with the project start date you specify
- `{{OWNER}}` -- replaced with the project creator's name

Use these in task titles and descriptions for automatic personalization. For example, a template task titled "Welcome to {{PROJECT_NAME}}" becomes "Welcome to Website Redesign Q2" when you create the project.

## Creating Your Own Templates

Turn any project into a reusable template:

1. Open the project you want to save as a template
2. Go to **Project Settings > Save as Template**
3. Choose what to include:
   - Column structure (always included)
   - Task content (titles, descriptions, checklists)
   - Custom field definitions
   - Automations
   - Labels
4. Name your template and add a description
5. Click **"Save Template"**

**Template visibility:**

- **Private templates** (default) -- only you can use them
- **Workspace templates** -- Admins can publish templates workspace-wide so any member can create projects from them

## Template Limits

**Free plan:** Access to 5 built-in templates. Cannot create custom templates.

**Pro plan:** Access to all 25+ built-in templates. Create unlimited custom templates (private only).

**Enterprise plan:** All built-in templates plus workspace-wide custom templates. Admins can enforce that new projects must use an approved template to maintain organizational standards.

## Tips for Great Templates

- **Start with real projects.** Your best templates come from projects you've already run successfully. Save them as templates after completing a project.
- **Include example tasks.** A template with 5-10 example tasks helps new users understand the intended workflow. Prefix example tasks with "[Example]" so users know to customize or delete them.
- **Document the workflow.** Add a task at the top titled "How to Use This Template" with instructions on each column's purpose and the expected flow.
- **Keep automations simple.** Templates with complex automations can confuse users. Start with 1-2 essential automations and let teams add their own.
- **Review and update.** Templates go stale. Review your custom templates quarterly and update them based on process improvements.
