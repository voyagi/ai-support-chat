# FlowBoard Reporting & Analytics

## Overview

FlowBoard's reporting tools help you understand how your team works, identify bottlenecks, and make data-driven decisions. Built-in dashboards provide instant insights, while the custom report builder (Pro and Enterprise) lets you create exactly the views you need.

Reporting is available on Pro and Enterprise plans. Free plan users can see basic task counts and completion rates on the project overview page.

## Built-In Dashboards

Every Pro and Enterprise workspace comes with pre-configured dashboards that update in real time.

### Velocity Dashboard

Track how much work your team completes over time.

- **Velocity chart:** Tasks or story points completed per sprint/week/month. Spot trends -- is your team speeding up, slowing down, or staying consistent?
- **Completion rate:** Percentage of tasks finished by their original due date. A healthy team maintains 80%+ on-time delivery.
- **Throughput:** Number of tasks moving through each status column per day. Identifies which stages are flowing smoothly and which are bottlenecks.

**Use case:** Sprint retrospectives, capacity planning, and setting realistic deadlines based on historical data.

### Burndown Dashboard

Visualize progress toward a goal.

- **Sprint burndown:** Ideal line vs. actual completion for the current sprint. If the actual line is above the ideal, you're behind schedule. Below means you're ahead.
- **Project burndown:** Track overall project completion against a target date. Shows how much scope remains and whether you'll finish on time at current pace.
- **Burnup chart:** Shows total scope (including scope creep) alongside completed work. Useful for seeing how much new work is being added mid-sprint.

**Use case:** Daily standups, mid-sprint check-ins, and communicating project status to stakeholders.

### Cycle Time Dashboard

Measure how long tasks take from start to finish.

- **Average cycle time:** Mean time from "In Progress" to "Done" across all tasks. Track weekly to spot slowdowns.
- **Cycle time by priority:** Compare how quickly Critical vs. Low priority tasks move through your workflow. Critical tasks should have shorter cycle times.
- **Cycle time distribution:** Histogram showing the spread of completion times. A wide distribution suggests inconsistent processes.
- **Lead time:** Time from task creation to completion (includes time in backlog). Useful for understanding total delivery time, not just active work time.

**Use case:** Process improvement, identifying slow-moving task types, and setting accurate delivery expectations.

### Team Workload Dashboard

See how work is distributed across your team.

- **Tasks per person:** Bar chart showing assigned task count by team member. Quickly spot overallocation or underutilization.
- **Workload heatmap:** Color-coded grid showing each person's capacity by week. Red means overloaded, green means available.
- **Task status by assignee:** Stacked bar chart showing how many tasks each person has in each status. Identify if someone has too many tasks stuck in "In Progress".

**Use case:** Resource planning, preventing burnout, and rebalancing work during sprint planning.

### Activity Heatmap

Visualize when your team is most productive.

- **Hour-of-day heatmap:** Shows task completions and status changes by hour. See if your team is most productive in the morning or afternoon.
- **Day-of-week heatmap:** Identify which days see the most activity. Useful for scheduling meetings around peak productivity hours.

**Use case:** Optimizing meeting schedules, understanding remote team work patterns across time zones.

## Custom Report Builder

Pro and Enterprise users can create custom reports tailored to their needs.

### Creating a custom report

1. Go to **Reports > Custom Reports > Create Report**
2. Choose a report type: chart, table, or metric card
3. Select your data source: tasks, projects, or activity
4. Configure filters: project, assignee, date range, priority, labels, custom fields
5. Choose visualization: bar chart, line chart, pie chart, stacked bar, or data table
6. Name your report and save it

### Building custom dashboards

Combine multiple reports into a single dashboard view:

1. Go to **Reports > Dashboards > Create Dashboard**
2. Add report widgets by clicking "Add Widget"
3. Arrange widgets by dragging them into position
4. Resize widgets to emphasize what matters most
5. Save and share the dashboard URL with stakeholders

Each dashboard can hold up to 12 widgets. Create multiple dashboards for different audiences -- an executive summary dashboard, a team performance dashboard, and a project-specific dashboard.

## Data Export

### Manual export

Export any report or dashboard to CSV or PDF:

1. Open the report or dashboard
2. Click the **export icon** (top right)
3. Choose format: CSV (for data analysis) or PDF (for presentations)
4. Download begins immediately

CSV exports include all underlying data, not just what's visible in the chart. Use CSV exports with Excel, Google Sheets, or BI tools like Tableau and Looker.

### API export

Pro and Enterprise users can pull reporting data via the FlowBoard API:

```
GET https://api.flowboard.io/v1/reports/{report_id}/data
```

Returns JSON data that powers the report. Use this to build custom integrations with your BI stack or internal tools.

### Scheduled exports (Enterprise)

Automate report delivery:

1. Open any report or dashboard
2. Click **"Schedule"** (top right, next to export)
3. Set frequency: daily, weekly, or monthly
4. Choose recipients (email addresses)
5. Select format: PDF summary or CSV raw data
6. Set delivery day and time

Scheduled reports are sent as email attachments. Great for keeping executives informed without manual reporting work.

## Tips for Effective Reporting

- **Start with built-in dashboards.** They cover 80% of what most teams need. Customize only when you have specific questions the built-ins don't answer.
- **Set a reporting cadence.** Review velocity and burndown weekly during sprint planning. Review cycle time and workload monthly for process improvements.
- **Share dashboards, not screenshots.** Dashboard URLs stay up to date. Screenshots go stale immediately.
- **Use date range filters.** Compare this sprint vs. last sprint, or this month vs. last month. Trends matter more than absolute numbers.
- **Act on what you measure.** If cycle time is increasing, investigate why. If one person is overloaded, redistribute work. Reports are only valuable if they lead to action.

Need help setting up reports? Pro users can reach us via live chat. Enterprise customers can work with their CSM to configure dashboards during onboarding.
