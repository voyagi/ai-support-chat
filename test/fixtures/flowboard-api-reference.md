# FlowBoard API Reference

## Authentication

All API requests require authentication via API key. Generate your API key from Settings > API in your FlowBoard workspace.

**Include your API key in the Authorization header:**

```
Authorization: Bearer YOUR_API_KEY
```

**API keys are scoped to your workspace.** They inherit your user permissions - if you're an Admin, the API key has admin access. If you're a Member, the key has member access.

**Security best practices:**
- Never commit API keys to version control
- Rotate keys every 90 days
- Use environment variables to store keys
- Revoke compromised keys immediately from Settings > API

**Rate limits:** See Rate Limits section below.

## Rate Limits

API rate limits prevent abuse and ensure fair usage.

**Free tier:** 100 requests per hour
**Pro tier:** 1,000 requests per hour
**Enterprise tier:** 5,000 requests per hour

Rate limits reset on the hour (e.g., 3:00 PM, 4:00 PM). If you exceed your limit, you'll receive a 429 status code with a `Retry-After` header indicating seconds until reset.

**Response headers:**
- `X-RateLimit-Limit`: Your total requests per hour
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets

**Need higher limits?** Enterprise customers can request custom rate limits. Contact support@flowboard.io.

## Projects Endpoint

### List all projects

```
GET https://api.flowboard.io/v1/projects
```

Returns all projects in your workspace.

**Query parameters:**
- `status` (optional): Filter by status (`active`, `archived`)
- `limit` (optional): Max results per page (default 50, max 100)
- `offset` (optional): Pagination offset

**Response:**

```json
{
  "projects": [
    {
      "id": "proj_abc123",
      "name": "Website Redesign",
      "key": "WEB",
      "status": "active",
      "created_at": "2025-01-15T10:30:00Z",
      "members": ["user_xyz", "user_def"],
      "task_count": 47
    }
  ],
  "total": 12,
  "has_more": false
}
```

### Get a single project

```
GET https://api.flowboard.io/v1/projects/{project_id}
```

Returns detailed information about a specific project.

**Response:**

```json
{
  "id": "proj_abc123",
  "name": "Website Redesign",
  "key": "WEB",
  "status": "active",
  "description": "Q1 2025 website overhaul",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-02-05T14:22:00Z",
  "owner": "user_xyz",
  "members": ["user_xyz", "user_def", "user_ghi"],
  "task_count": 47,
  "columns": [
    {"id": "col_1", "name": "To Do", "position": 0},
    {"id": "col_2", "name": "In Progress", "position": 1},
    {"id": "col_3", "name": "Done", "position": 2}
  ]
}
```

### Create a project

```
POST https://api.flowboard.io/v1/projects
```

Creates a new project.

**Request body:**

```json
{
  "name": "Mobile App v2",
  "key": "MOB",
  "description": "Rebuild mobile app with React Native",
  "template_id": "tpl_software_dev"
}
```

**Response:** Returns the created project object (same structure as GET).

## Tasks Endpoint

### List tasks

```
GET https://api.flowboard.io/v1/projects/{project_id}/tasks
```

Returns tasks in a project.

**Query parameters:**
- `status` (optional): Filter by status column ID
- `assignee` (optional): Filter by user ID
- `priority` (optional): `low`, `medium`, `high`, `critical`
- `due_before` (optional): ISO 8601 date (e.g., `2025-03-15`)
- `limit` (optional): Max results (default 50, max 100)
- `offset` (optional): Pagination offset

**Response:**

```json
{
  "tasks": [
    {
      "id": "task_def456",
      "project_id": "proj_abc123",
      "key": "WEB-1",
      "title": "Design homepage mockup",
      "description": "Focus on hero section and mobile responsive",
      "status": "col_2",
      "assignee": "user_def",
      "priority": "high",
      "due_date": "2025-02-10",
      "created_at": "2025-02-01T09:15:00Z",
      "updated_at": "2025-02-05T11:45:00Z"
    }
  ],
  "total": 47,
  "has_more": true
}
```

### Get a single task

```
GET https://api.flowboard.io/v1/tasks/{task_id}
```

Returns detailed task information including comments and attachments.

**Response:**

```json
{
  "id": "task_def456",
  "project_id": "proj_abc123",
  "key": "WEB-1",
  "title": "Design homepage mockup",
  "description": "Focus on hero section and mobile responsive",
  "status": "col_2",
  "assignee": "user_def",
  "priority": "high",
  "due_date": "2025-02-10",
  "created_at": "2025-02-01T09:15:00Z",
  "updated_at": "2025-02-05T11:45:00Z",
  "comments": [
    {
      "id": "cmt_123",
      "author": "user_xyz",
      "content": "Looks great! Ship it.",
      "created_at": "2025-02-05T11:45:00Z"
    }
  ],
  "attachments": [
    {
      "id": "att_789",
      "filename": "mockup.png",
      "url": "https://cdn.flowboard.io/files/att_789",
      "size": 245678
    }
  ]
}
```

### Create a task

```
POST https://api.flowboard.io/v1/projects/{project_id}/tasks
```

Creates a new task.

**Request body:**

```json
{
  "title": "Fix login bug on Safari",
  "description": "Users report they can't log in on Safari 16",
  "assignee": "user_def",
  "priority": "critical",
  "due_date": "2025-02-12",
  "status": "col_1"
}
```

**Response:** Returns the created task object.

### Update a task

```
PATCH https://api.flowboard.io/v1/tasks/{task_id}
```

Updates an existing task. Only include fields you want to change.

**Request body:**

```json
{
  "status": "col_3",
  "assignee": "user_ghi"
}
```

**Response:** Returns the updated task object.

### Delete a task

```
DELETE https://api.flowboard.io/v1/tasks/{task_id}
```

Deletes a task permanently. This cannot be undone.

**Response:** 204 No Content on success.

## Comments Endpoint

### Add a comment

```
POST https://api.flowboard.io/v1/tasks/{task_id}/comments
```

Adds a comment to a task.

**Request body:**

```json
{
  "content": "This is ready for review. @user_xyz please take a look."
}
```

**Response:**

```json
{
  "id": "cmt_456",
  "task_id": "task_def456",
  "author": "user_def",
  "content": "This is ready for review. @user_xyz please take a look.",
  "created_at": "2025-02-08T13:22:00Z"
}
```

## Webhooks

Webhooks deliver real-time event notifications to your server.

### Setting up webhooks

Go to Settings > API > Webhooks and click "Create Webhook".

**Configuration:**
- **URL:** Your server endpoint (must be HTTPS)
- **Events:** Select which events to receive (task.created, task.updated, task.deleted, comment.added, etc.)
- **Secret:** We generate a secret for validating webhook signatures

### Webhook payload

When an event occurs, we POST to your URL:

```json
{
  "event": "task.updated",
  "timestamp": "2025-02-08T13:22:00Z",
  "data": {
    "task_id": "task_def456",
    "project_id": "proj_abc123",
    "changes": {
      "status": {"old": "col_2", "new": "col_3"}
    }
  }
}
```

**Signature verification:** We include an `X-FlowBoard-Signature` header with an HMAC SHA-256 hash of the payload using your webhook secret. Verify this to ensure the request came from FlowBoard.

```javascript
const crypto = require('crypto');
const signature = req.headers['x-flowboard-signature'];
const hash = crypto.createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');
if (signature !== hash) throw new Error('Invalid signature');
```

### Webhook retry logic

If your endpoint returns a non-2xx status code, we retry with exponential backoff: immediately, 1 minute, 5 minutes, 30 minutes, 2 hours. After 5 failed attempts, we disable the webhook and email you.

## Error Codes

**400 Bad Request:** Invalid request body or parameters. Check the error message for details.

**401 Unauthorized:** Missing or invalid API key. Verify your Authorization header.

**403 Forbidden:** You don't have permission to access this resource. Check your role permissions.

**404 Not Found:** The requested resource doesn't exist. Verify the ID.

**429 Too Many Requests:** Rate limit exceeded. Check the Retry-After header.

**500 Internal Server Error:** Something went wrong on our end. We log these automatically. If it persists, contact support@flowboard.io.

**Error response format:**

```json
{
  "error": {
    "code": "invalid_request",
    "message": "Task title is required",
    "details": {
      "field": "title",
      "reason": "missing_required_field"
    }
  }
}
```

## SDKs and Libraries

Official SDKs available:

- **JavaScript/TypeScript:** `npm install @flowboard/sdk`
- **Python:** `pip install flowboard`
- **Ruby:** `gem install flowboard`
- **Go:** `go get github.com/flowboard/flowboard-go`

Community SDKs for PHP, C#, and Java available on GitHub. See docs.flowboard.io/sdks for setup guides and examples.
