# FlowBoard Automations

## Overview

FlowBoard Automations eliminate repetitive work by running actions when specific conditions are met. Instead of manually updating statuses, sending reminders, or assigning tasks, set up rules once and let FlowBoard handle the rest. Automations are available on Pro and Enterprise plans.

## How Automations Work

Every automation follows a simple pattern: **When** something happens, **Then** do something.

**Triggers (the "When"):**

- Task is created in a specific project
- Task status changes to a specific column (e.g., moved to "Done")
- Task is assigned to a person
- Priority is changed to Critical or High
- Due date is within X days (1, 3, 7, or custom)
- A custom field value changes
- A comment is added to a task
- A label is added or removed

**Actions (the "Then"):**

- Post a message to a Slack channel or DM someone
- Send an email to the assignee, creator, or custom recipients
- Create a follow-up task in the same or different project
- Update a field (change priority, set status, add a label, set due date)
- Move the task to another project
- Assign or reassign the task to a person or team
- Archive the task

You can chain multiple actions on a single trigger. For example, when a task moves to "Done", you could post to Slack, send an email to the creator, and create a follow-up QA task -- all automatically.

## Setting Up Automations

1. Open your project and go to **Project Settings > Automations**
2. Click **"Create Automation"**
3. Choose a trigger from the dropdown
4. Configure trigger conditions (e.g., "When status changes to Done")
5. Add one or more actions (e.g., "Post to #releases in Slack")
6. Name your automation (e.g., "Notify team on completion")
7. Click **"Test"** to preview what would happen without actually running
8. Click **"Activate"** to turn it on

**Testing mode:** Always test your automation before activating. FlowBoard simulates the trigger against recent tasks and shows you what actions would fire. This prevents surprise notifications or unintended task changes.

## Example Automations

Here are popular automations FlowBoard teams use:

**Code review workflow:** When a task moves to "Code Review", automatically assign it to the team's designated reviewer and post to #code-review in Slack with the task title and a link.

**Deadline reminders:** When a task's due date is 3 days away and the task is still in "To Do" or "In Progress", send an email reminder to the assignee and add a "Needs Attention" label.

**Critical escalation:** When priority is set to Critical, immediately assign the task to the team lead, post to #urgent in Slack, and set the due date to tomorrow if no due date exists.

**QA handoff:** When a task moves to "Ready for QA", create a follow-up task titled "QA: [original task name]" in the QA project, assign it to the QA team, and link it to the original task.

**Sprint cleanup:** When a task has been in "In Progress" for more than 5 business days, add a "Stale" label and notify the assignee via email.

**Client notification:** When a task in a client-facing project moves to "Done", send an email to the project's guest users with a summary of what was completed.

## Automation Limits

**Free plan:** Automations are not available.

**Pro plan:** Up to 50 active automations per workspace. Each automation can have up to 5 chained actions.

**Enterprise plan:** Unlimited automations with up to 10 chained actions each. Enterprise also gets access to conditional logic (if/else branching) and webhook actions for custom integrations.

## Automation History

Every automation run is logged in **Project Settings > Automations > History**. The log shows:

- When the automation fired
- Which task triggered it
- What actions ran
- Whether actions succeeded or failed

Use the history to debug unexpected behavior. If an automation fires too often, add more specific trigger conditions. If it doesn't fire when expected, check that the trigger conditions match your task data.

## Tips for Effective Automations

- **Start simple.** Begin with one or two automations and add more as you learn what works for your team.
- **Name descriptively.** "Slack notify on done" is easier to manage than "Automation 1".
- **Avoid loops.** Don't create automations that trigger each other (e.g., changing status triggers another status change). FlowBoard detects simple loops and warns you, but complex chains may not be caught.
- **Use test mode.** Always test before activating, especially for automations that send notifications to clients or external stakeholders.
- **Review monthly.** Audit your active automations quarterly. Disable ones you no longer need to keep things clean.

Need help setting up automations? Check our help center at help.flowboard.io or reach out to support@flowboard.io.
