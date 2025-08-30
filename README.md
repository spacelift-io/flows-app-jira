# Jira Integration for Flows

Comprehensive Jira integration for DevOps teams. Automate issue management, track deployments, manage releases, and integrate Jira workflows with your CI/CD pipelines.

## Features

### Issue Management

- **Create & Update Issues**: Full issue lifecycle with custom fields, labels, and assignees
- **Transition Issues**: Move issues through workflows with proper state management
- **Search & Filter**: Powerful JQL-based searching with pagination
- **Link Issues**: Create relationships between issues for dependency tracking
- **Comments & Collaboration**: Add comments, watchers, and external links

### Release Management

- **Version Control**: Create and manage project versions/releases
- **Deployment Tracking**: Track releases from development to production
- **Release Notes**: Automate changelog generation from issues

### Real-time Integration

- **Webhook Events**: Live updates for issue changes, comments, and releases
- **Event Processing**: React to Jira events in your Flows workflows
- **Secure Verification**: HMAC signature verification for webhook security

### User Management

- **User Lookup**: Find users by email or account ID
- **Team Coordination**: Send notifications and manage assignments

## Quick Start

### 1. Configure Jira Connection

1. Generate credentials:

   **For Atlassian Cloud:**
   - Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
   - Click "Create API token" and copy it

   **For Self-hosted Jira:**
   - Use your Jira username and password, or
   - Generate a Personal Access Token in Jira settings

2. Configure the app:
   - **Jira URL**: Your instance URL (e.g., `https://yourcompany.atlassian.net` or `https://jira.yourcompany.com`)
   - **Email**: Your Jira account email (for Cloud) or username (for self-hosted)
   - **API Token**: The token from step 1 or your password

### 2. Set up Webhooks (Optional)

For real-time event processing:

1. In Jira, go to **Settings > System > Webhooks**
2. Click "Create a Webhook"
3. Set webhook URL to the app endpoint URL shown in settings
4. Select events: Issue Created, Issue Updated, Comment Created, Version Released
5. Generate a webhook secret and add it to the app configuration

### 3. Start Automating

Add Jira blocks to your flows and connect them to your DevOps pipelines.

## Available Blocks

### Issue Operations (10 blocks)

- **Create Issue**: Create tickets with full configuration
- **Get Issue**: Retrieve issue details with custom fields
- **Update Issue**: Modify summaries, descriptions, labels, and assignments
- **Search Issues**: JQL-powered search with pagination
- **Transition Issue**: Move issues through workflow states
- **Add Comment**: Rich text comments with ADF formatting
- **Assign Issue**: Set issue assignees
- **Add Watchers**: Subscribe users to issue notifications
- **Link Issues**: Create dependencies and relationships
- **Add External Link**: Connect issues to external resources

### Project Management (2 blocks)

- **Create Version**: Define new release versions
- **Update Version**: Manage release dates and status

### User Management (1 block)

- **Get User Details**: Find users by email or account ID

### Webhook Events (4 blocks)

- **Issue Created**: Triggered on new issue creation
- **Issue Updated**: Triggered on issue changes with changelog
- **Comment Created**: Triggered on new comments
- **Version Released**: Triggered on version/release events

## DevOps Integration Patterns

### CI/CD Pipeline Integration

```text
Deployment Success → Update Issue → Transition to Done → Create Release
```

### Incident Management

```text
Alert Triggered → Create Issue → Assign Team → Add Watchers → Track Resolution
```

### Release Automation

```text
Version Created → Search Related Issues → Generate Release Notes → Notify Team
```

### Code Review Integration

```text
PR Merged → Link to Issue → Add Comment → Update Story Points
```

## Authentication & Security

- **API Token Authentication**: Secure token-based authentication with Atlassian
- **Webhook Security**: HMAC-SHA256 signature verification for webhook requests
- **Permission Scoping**: Uses your Jira permissions - only access what you can access
- **Encrypted Storage**: API tokens stored securely with encryption

## Common Use Cases

- **Deployment Tracking**: Automatically update issues when deployments succeed/fail
- **Release Management**: Create versions, track issues, and generate release notes
- **Incident Response**: Auto-create issues from monitoring alerts with proper assignment
- **Sprint Automation**: Update issue status based on CI/CD pipeline results
- **Team Notifications**: Alert teams when critical issues are created or updated
- **Dependency Management**: Link issues to track feature dependencies and blockers

## Technical Details

- **Jira REST API v3**: Uses the latest Jira Cloud API
- **ADF Support**: Rich text formatting using Atlassian Document Format
- **TypeScript**: Full type safety with comprehensive error handling
- **Webhook Processing**: Real-time event handling with proper signature verification
- **JQL Integration**: Full support for Jira Query Language for powerful searching

## Best Practices

- Use JQL search blocks for complex issue queries rather than iterating through lists
- Set up webhook events for real-time automation instead of polling
- Use version management blocks to track releases and deployments
- Link issues to create clear dependency chains for feature development
- Leverage custom fields for DevOps-specific metadata (deployment info, environment details)
