import { AppBlock, events } from "@slflows/sdk/v1";

export const issueUpdated: AppBlock = {
  name: "Issue Updated",
  description: "Triggered when a Jira issue is updated via webhook",
  category: "Webhooks",

  inputs: {},

  onInternalMessage: async (input) => {
    const { issue, user, changelog } = input.message.body;

    try {
      // Extract key information from the issue
      const issueData = {
        id: issue.id,
        key: issue.key,
        summary: issue.fields?.summary,
        status: issue.fields?.status?.name,
        assignee: issue.fields?.assignee?.displayName,
        priority: issue.fields?.priority?.name,
        issueType: issue.fields?.issuetype?.name,
        project: issue.fields?.project?.key,
        updated: issue.fields?.updated,
      };

      // Extract changelog information if available
      const changes =
        changelog?.items?.map((item: any) => ({
          field: item.field,
          fieldtype: item.fieldtype,
          from: item.fromString,
          to: item.toString,
        })) || [];

      // Extract user information
      const updatedBy = user
        ? {
            accountId: user.accountId,
            displayName: user.displayName,
            emailAddress: user.emailAddress,
          }
        : null;

      await events.emit({
        issue: issueData,
        changes,
        updatedBy,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `Failed to process issue updated webhook: ${errorMessage}`,
      );
    }
  },

  outputs: {
    default: {
      name: "Issue Updated Event",
      description: "Processed issue update event data",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          issue: {
            type: "object",
            description: "Structured issue data",
            properties: {
              id: { type: "string", description: "Issue ID" },
              key: {
                type: "string",
                description: "Issue key (e.g., PROJ-123)",
              },
              summary: { type: "string", description: "Issue summary" },
              status: { type: "string", description: "Current status" },
              assignee: {
                type: "string",
                description: "Assignee display name",
              },
              priority: { type: "string", description: "Priority level" },
              issueType: { type: "string", description: "Issue type" },
              project: { type: "string", description: "Project key" },
              updated: {
                type: "string",
                description: "Last updated timestamp",
              },
            },
            required: ["id", "key"],
          },
          changes: {
            type: "array",
            description: "List of changes made to the issue",
            items: {
              type: "object",
              properties: {
                field: {
                  type: "string",
                  description: "Field that was changed",
                },
                fieldtype: { type: "string", description: "Type of field" },
                from: { type: "string", description: "Previous value" },
                to: { type: "string", description: "New value" },
              },
              required: ["field"],
            },
          },
          updatedBy: {
            type: "object",
            description: "User who made the update",
            properties: {
              accountId: { type: "string", description: "User account ID" },
              displayName: { type: "string", description: "User display name" },
              emailAddress: { type: "string", description: "User email" },
            },
          },
          timestamp: {
            type: "string",
            description: "When the event was processed",
          },
        },
        required: ["issue", "changes", "timestamp"],
      },
    },
  },
};
