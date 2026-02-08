# FlowBoard Mobile App

## Download & Install

FlowBoard's native mobile apps bring full project management power to your phone and tablet. Available for iOS and Android with feature parity across platforms.

### iOS

**Requirements:** iOS 15.0 or later, compatible with iPhone, iPad, and iPod touch.

**Download:** Search "FlowBoard" in the App Store or visit [apps.apple.com/flowboard](https://apps.apple.com/flowboard)

**Size:** 45 MB download, 120 MB installed

**iPad optimization:** The iPad version features a split-view interface showing your task list on the left and task details on the right. Drag-and-drop tasks between columns in Kanban view. Keyboard shortcuts work with external keyboards.

**Apple Watch companion app:** View tasks assigned to you, mark tasks complete, and see upcoming deadlines. Quick replies to comments via dictation.

### Android

**Requirements:** Android 8.0 (Oreo) or later

**Download:** Search "FlowBoard" in Google Play Store or visit [play.google.com/store/apps/flowboard](https://play.google.com/store/apps/flowboard)

**Size:** 38 MB download, 90 MB installed

**Tablet optimization:** Android tablets show a master-detail layout similar to iPad. Supports Samsung DeX for desktop-like experience on Galaxy devices.

**Wear OS:** Coming Q3 2026. Track tasks and deadlines on your smartwatch.

## Logging In

Open the FlowBoard app and you'll see the login screen.

**Email/password login:**
1. Enter your FlowBoard email and password
2. Tap "Log In"
3. If you have 2FA enabled, enter your 6-digit code from your authenticator app

**SSO login (Enterprise only):**
1. Tap "Log in with SSO"
2. Enter your workspace domain (e.g., "acme" if your workspace is acme.flowboard.io)
3. You'll be redirected to your company's SSO login page in an in-app browser
4. Complete authentication
5. You're redirected back to the app, now logged in

**Stay logged in:** The app keeps you logged in indefinitely unless you manually log out or your organization revokes your access. No need to re-enter credentials.

**Biometric login:** After first login, enable Face ID (iOS) or fingerprint (Android) from Settings > Security > Biometric Login. Subsequent logins require just your face or fingerprint.

**Multiple workspaces:** If you're part of multiple FlowBoard workspaces, tap your profile icon > Switch Workspace to toggle between them. No need to log out and back in.

## Navigating the App

FlowBoard mobile mirrors the web app's structure with touch-optimized navigation.

### Home screen

The home screen shows:

- **My Tasks:** Tasks assigned to you across all projects, sorted by due date
- **Recent projects:** Last 5 projects you viewed
- **Activity:** Recent updates from your team (comments, status changes, new tasks)

Tap any task to view full details. Swipe right on a task to mark it complete. Swipe left for quick actions: assign, set due date, change priority.

### Navigation bar

Bottom navigation bar (iOS) or drawer menu (Android):

- **Home:** Your personalized dashboard
- **Projects:** List of all projects in your workspace
- **Search:** Search across all tasks and comments
- **Create:** Quick-create tasks or projects
- **Profile:** Your profile, settings, and notifications

### Project views

Open any project to see:

- **Kanban tab:** Drag-and-drop cards between columns (horizontal scrolling)
- **List tab:** Scrollable list of all tasks with sort/filter options
- **Timeline tab:** Horizontal Gantt chart (pinch to zoom, drag to reschedule tasks)
- **Calendar tab:** Monthly calendar showing task due dates

Switch views via tabs at the top. Your preferred view persists - if you always use List view, projects open to List by default.

## Offline Mode

The FlowBoard mobile app works even without an internet connection.

### What works offline

- **View tasks:** Browse all tasks you've loaded previously (cached locally)
- **Create tasks:** New tasks are saved locally and synced when you reconnect
- **Edit tasks:** Change status, priority, due dates, or add comments offline
- **View attachments:** Files you've viewed before are cached locally
- **Search:** Search your locally cached data

### What doesn't work offline

- **Loading new data:** Can't fetch tasks or projects you haven't viewed while online
- **Uploading files:** File uploads require connection
- **Real-time collaboration:** Changes by teammates aren't visible until you reconnect

### Sync behavior

When you reconnect, FlowBoard syncs automatically:

1. **Upload your changes:** Tasks created/edited offline are pushed to the server
2. **Download updates:** Fetch changes made by teammates while you were offline
3. **Conflict resolution:** If you and a teammate edited the same task, the app shows a merge screen. Choose which changes to keep or manually merge both.

**Sync indicator:** A banner at the top shows sync status: "Syncing...", "Synced", or "Offline - changes will sync when connected". Tap it to see pending changes.

**Low bandwidth mode:** In Settings > Advanced > Low Bandwidth Mode, the app reduces data usage by loading lower-resolution images, disabling automatic file downloads, and syncing only critical data.

## Push Notifications

Stay updated on project activity even when the app is closed.

### Notification types

By default, you receive push notifications for:

- Tasks assigned to you
- Comments mentioning you (@username)
- Tasks due today or overdue
- Status changes on tasks you're watching
- New comments on tasks you created

### Customizing notifications

Settings > Notifications lets you control what you're notified about:

- **All activity:** Every update in your workspace (noisy, not recommended)
- **My tasks only:** Only tasks assigned to you
- **Mentions and assignments:** When someone @mentions you or assigns you
- **Important only:** Critical priority tasks and overdue items
- **Do Not Disturb schedule:** Silence notifications outside work hours (e.g., 8 AM - 6 PM Mon-Fri)

### Per-project notifications

Override workspace settings for individual projects:

1. Open a project
2. Tap "..." menu > Notification Settings
3. Choose: All Activity, Important Only, or Mute

**Muting projects:** Useful for archived projects or ones you're tangentially involved in. You'll still see updates when you open the project, but no push notifications.

### Notification actions

iOS supports notification actions - respond without opening the app:

- **Mark Complete:** Swipe notification, tap "Complete"
- **Reply:** Swipe notification, tap "Reply", dictate or type your comment
- **Snooze:** Swipe notification, tap "Remind me in 1 hour"

Android supports similar actions via notification buttons.

## Mobile-Specific Features

The mobile app includes features tailored for on-the-go work.

### Voice input

Tap the microphone icon when creating a task or adding a comment. Dictate your message and it's automatically transcribed. Works in 50+ languages with automatic language detection.

**Voice commands (beta):** Say "Create task" to start a new task. Say "Show my tasks due today" to filter your task list. Voice commands improve over time with usage.

### Camera attachments

Tap the attachment icon > Camera to:

- **Take photo:** Snap a picture and attach directly to a task (great for fieldwork, site visits, bug reports)
- **Scan document:** iOS uses Apple's document scanner to capture and de-skew documents like receipts, contracts, or whiteboards. Android uses Google's ML Kit scanner.
- **Attach from gallery:** Select existing photos or videos from your phone

Photos taken with the FlowBoard camera are automatically compressed to reduce upload time and storage.

### Quick actions

Long-press the FlowBoard app icon on your home screen for quick actions:

- **Create Task:** Jump directly to task creation
- **My Tasks:** View your assigned tasks
- **Search:** Open search
- **Recent:** Last project you viewed

### Widgets

**iOS widgets:** Add FlowBoard widgets to your home screen (iOS 14+):

- **My Tasks Today:** Shows up to 6 tasks due today, tap any to open
- **Recent Activity:** Latest 4 updates from your team
- **Quick Create:** One-tap button to create a new task

**Android widgets:** Home screen widgets for My Tasks, Recent Activity, and Quick Create. Resizable from 2x2 to 4x4 grid.

### Swipe gestures

Speed up workflows with swipe gestures:

- **Swipe right on task:** Mark complete
- **Swipe left on task:** Quick actions menu (assign, priority, due date)
- **Swipe down on task list:** Refresh / pull to sync
- **Swipe up from bottom:** Quick-create task (like Cmd+K on web)

**Customizable swipes:** Settings > Gestures lets you customize swipe actions. Change "Swipe right" to "Archive" instead of "Complete" if you prefer.

### Siri shortcuts (iOS only)

Create Siri shortcuts to automate common tasks:

1. Settings > Siri Shortcuts
2. Tap "+" to create a shortcut
3. Choose action: Create Task, Show My Tasks, Search, etc.
4. Record a phrase (e.g., "Show my work" opens My Tasks)

**Pre-built shortcuts:**
- "Log work" - Opens FlowBoard to task creation with pre-filled project
- "Standup report" - Shows tasks assigned to you due today or overdue
- "Check deadlines" - Opens calendar view filtered to next 7 days

### Dark mode

FlowBoard mobile automatically matches your system dark mode setting (iOS Settings > Display or Android Settings > Display > Dark Theme).

**Manual override:** Settings > Appearance > Theme: Auto, Light, or Dark. Useful if you want FlowBoard in dark mode but the rest of your phone in light mode.

**Custom dark theme colors (Pro):** Pro users can customize dark mode accent colors from Settings > Appearance > Dark Theme Colors.

## Tips for Mobile Power Users

### Keyboard shortcuts (external keyboard)

Connect a Bluetooth keyboard to your phone or tablet and use keyboard shortcuts:

- **Cmd/Ctrl + K:** Command palette / quick search
- **C:** Create new task
- **Enter:** Open selected task
- **Escape:** Close task detail view
- **Arrow keys:** Navigate task list
- **/** (forward slash):** Jump to search

Full keyboard shortcut list: Settings > Keyboard Shortcuts

### Batch operations

Select multiple tasks in list view (long-press to start selection, tap to add more) and apply actions to all:

- Change status
- Bulk assign
- Change priority
- Set due dates
- Move to another project

Great for weekly planning sessions - select all tasks for the week and bulk-assign them.

### Task templates

Save frequently created tasks as templates:

1. Create a task with all the details (title format, description template, checklist items)
2. Open task details > "..." menu > Save as Template
3. Give it a name: "Bug Report Template", "Client Onboarding", etc.

Next time you create a task, tap "Templates" and select your template. All fields pre-fill instantly.

### Smart filters

Create custom filters and save them for quick access:

1. In any project, tap Filter icon
2. Set criteria: assigned to you, due this week, high priority
3. Tap "Save Filter" and give it a name
4. Saved filter appears in your sidebar

Example filters: "My High Priority", "Overdue Team Tasks", "Unassigned Bugs", "This Sprint".

## Troubleshooting

### App crashes or freezes

1. Force-close the app and reopen
2. Check for app updates in App Store / Play Store
3. Restart your phone
4. If problem persists, contact support@flowboard.io with device model and iOS/Android version

### Sync issues

If changes aren't syncing:

1. Check your internet connection
2. Pull down on task list to force a refresh
3. Log out and back in (Settings > Log Out)
4. Clear app cache: Settings > Advanced > Clear Cache (doesn't delete data)

### Login problems

**Forgot password:** Tap "Forgot password?" on login screen, enter your email, follow reset link sent to your inbox.

**2FA locked out:** If you lost your authenticator device, use one of your recovery codes. No recovery codes? Contact support@flowboard.io from your registered email address for manual verification.

**SSO not working:** Ensure your workspace has SSO enabled. If it was recently configured, wait 5-10 minutes for changes to propagate. Still stuck? Contact your workspace admin.

### Performance issues

If the app is slow:

- Close and reopen the app (kills background processes)
- Clear cache: Settings > Advanced > Clear Cache
- Reduce data usage: Settings > Advanced > Low Bandwidth Mode
- Check available storage - iOS and Android need 500MB+ free for smooth operation

### Getting help

- **In-app help:** Tap "?" in bottom right for help articles
- **Email support:** support@flowboard.io
- **Live chat (Pro users):** Tap "?" > "Chat with Support"
- **Status page:** status.flowboard.io to check for outages
