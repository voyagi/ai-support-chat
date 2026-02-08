# FlowBoard Features

## Kanban Boards

FlowBoard's Kanban boards bring visual clarity to your workflow. Drag-and-drop task cards across customizable columns to represent your process stages. Create as many columns as you need - from simple "To Do / Doing / Done" to complex workflows with 10+ stages like "Backlog / Ready / In Dev / Code Review / QA / Staging / Released".

Each card shows key task information at a glance: title, assignee avatar, priority color, due date, attachment count, and comment count. Hover for quick actions: edit, assign, add labels, or set due dates without opening the full task view.

**Swimlanes** divide your board horizontally by priority, assignee, or custom fields. Great for visualizing team capacity or separating urgent work from routine tasks. **WIP limits** (Pro feature) prevent column overload - set a maximum number of tasks per column and FlowBoard warns you when you exceed it.

**Board customization:** Change column names, reorder them, collapse infrequently-used columns, or hide completed tasks to focus on active work. Each board member can configure their own view preferences without affecting others.

## Timeline View

The Timeline (Gantt chart) view transforms your task list into a horizontal calendar. Each task appears as a bar spanning from its start date to due date. Drag bars left/right to reschedule, stretch them to extend duration, or drag their ends to adjust timing.

**Dependencies** show as arrows connecting related tasks. Mark "Task B blocks Task A" and FlowBoard automatically adjusts scheduling when you move the blocker. Critical path highlighting shows which tasks must finish on time to avoid delaying your project.

**Milestones** appear as diamond markers on your timeline. Use them for launches, client presentations, or sprint end dates. Click any milestone to see all tasks due by that date.

**Resource view** (Pro feature) switches from task-based to person-based timeline. See each team member's workload across all projects, identify overallocation, and rebalance work visually. Drag tasks between people to reassign.

Timeline view is perfect for project managers coordinating complex initiatives with hard deadlines and interdependent work streams.

## Sprint Planning

FlowBoard's sprint planning tools help software teams maintain consistent velocity and predictable delivery.

**Sprint setup:** Define your sprint duration (1-4 weeks), start date, and capacity (story points or hours). FlowBoard creates a sprint container and opens the planning board. Drag tasks from your backlog into the sprint. FlowBoard tracks total points and warns when you exceed capacity.

**Sprint board:** A focused Kanban board showing only tasks in the current sprint. Columns adapt to development workflows: Backlog / To Do / In Progress / Code Review / Testing / Done. Integrate with GitHub or GitLab to auto-update task status when PRs are opened, reviewed, or merged.

**Burndown charts** track progress throughout the sprint. The ideal line shows perfect steady progress; the actual line shows your team's real completion rate. If you're trending above the line, you're ahead of schedule. Below the line means you might not finish everything - FlowBoard suggests tasks to move out.

**Sprint retrospectives:** At sprint end, FlowBoard generates a report showing completed tasks, velocity, cycle time, and carryover. Use this data in your retro meetings to identify bottlenecks and improve your process.

**Multi-sprint planning:** Pro users can plan 2-3 sprints ahead. View future sprints, pre-assign tasks, and adjust based on learned velocity. Dependencies between sprints show which tasks must finish before future work can begin.

## Custom Fields

Projects have diverse metadata needs. FlowBoard's custom fields (Pro feature) let you track anything beyond standard task properties.

**Field types:**
- **Text:** Short text like ticket IDs, design URLs, or customer names
- **Number:** Story points, hours estimate, bug severity rating
- **Date:** Launch date, contract deadline, review due date
- **Dropdown:** Single-select options like "Design Status: Draft / In Review / Approved"
- **Checkboxes:** Multi-select tags like "Platforms: iOS / Android / Web"
- **URL:** Link to Figma designs, Google Docs, staging environments
- **Person:** Additional assignees, reviewers, or stakeholders

**Creating custom fields:** Go to Project Settings > Custom Fields > Add Field. Give it a name, choose a type, and optionally provide a description or default value. The field immediately appears on all task detail pages.

**Field visibility:** Show custom fields on Kanban cards, in List view columns, or keep them hidden until you open task details. Reorder fields to prioritize what's most important.

**Filtering and grouping:** Filter tasks by custom field values ("Show only High severity bugs") or group your board by custom field ("Group by Design Status"). This turns one board into multiple dynamic views.

## Automations

Automations (Pro feature) eliminate repetitive work by triggering actions when conditions are met.

**Trigger types:**
- When a task is created
- When status changes to [specific status]
- When due date is X days away
- When a task is assigned to [person]
- When priority is set to Critical
- When a custom field value changes

**Actions:**
- Post to Slack channel or DM someone
- Send email to assignee, creator, or custom recipients
- Create a follow-up task
- Update a field (change priority, set due date, add label)
- Move to another project or archive
- Assign to a person or team

**Example automations:**
- "When status changes to Done, post to #wins Slack channel with task title and assignee"
- "When due date is 3 days away and task is still To Do, send email to assignee with reminder"
- "When priority is set to Critical, assign to @manager for review and post to #urgent"
- "When task is moved to Code Review, create a follow-up task 'QA Test [task name]' and assign to QA team"

**Automation builder:** Visual drag-and-drop interface guides you through creating automations. Test your automation before activating to see what would happen. View automation history to debug unexpected behavior.

## Reporting & Dashboards

FlowBoard's reporting tools (Pro feature) help you understand team performance and identify bottlenecks.

**Built-in reports:**
- **Velocity:** Track completed tasks/points per sprint or month. Spot trends in productivity.
- **Cycle time:** Measure average time from "In Progress" to "Done". Identify slow-moving tasks.
- **Burndown/Burnup:** Visual progress toward sprint or project completion.
- **Task distribution:** See workload balance across team members. Catch overallocation early.
- **Completion rate:** Percentage of tasks finished by their due date. Track on-time delivery.
- **Activity heatmap:** Visualize when your team is most productive (time of day, day of week).

**Custom dashboards:** Combine multiple reports into a single view. Add filters to focus on specific projects, teams, or time ranges. Save dashboards and share URLs with stakeholders.

**Export data:** Download reports as CSV for analysis in Excel or Google Sheets. Pro users get API access to build custom integrations with BI tools like Tableau, Looker, or PowerBI.

**Scheduled reports:** Email reports to stakeholders weekly or monthly. Great for keeping executives informed without manual reporting work.

## Templates

Save time setting up new projects with FlowBoard's template library.

**Pre-built templates:**
- Software Development (with sprint columns, bug tracking, and release milestones)
- Marketing Campaign (creative brief, asset creation, review, launch stages)
- Product Launch (market research, design, development, QA, go-to-market)
- Event Planning (venue, speakers, marketing, logistics, day-of tasks)
- Hiring Pipeline (sourcing, screening, interviews, offer, onboarding)
- Content Calendar (ideation, drafting, editing, publishing, promotion)

**Using templates:** When creating a project, select a template instead of starting blank. FlowBoard copies the template's columns, example tasks, custom fields, and automations. Delete or customize the example content to fit your needs.

**Creating templates:** Turn any project into a reusable template from Project Settings > Save as Template. Choose what to include: columns, custom fields, automations, or even task content. Templates are private by default; admins can publish them workspace-wide.

**Template variables:** Use placeholders like `{{PROJECT_NAME}}` or `{{START_DATE}}` in task titles and descriptions. When creating a project from the template, FlowBoard prompts you for values and fills them in automatically.

Templates dramatically reduce project setup time. What once took 30 minutes of column creation and task seeding now takes 2 minutes with a template.
