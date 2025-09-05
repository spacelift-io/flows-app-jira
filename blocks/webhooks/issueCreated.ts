import { AppBlock, events } from "@slflows/sdk/v1";

export const issueCreated: AppBlock = {
  name: "Issue Created",
  description: "Triggered when a new Jira issue is created via webhook",
  category: "Webhooks",

  config: {
    projectKeys: {
      name: "Project Keys",
      description:
        "Filter by project keys (optional). Leave empty to receive all projects.",
      type: ["string"],
      required: false,
    },
    issueTypes: {
      name: "Issue Types",
      description:
        "Filter by issue types (optional). Leave empty to receive all issue types.",
      type: ["string"],
      required: false,
    },
    priorities: {
      name: "Priorities",
      description:
        "Filter by priorities (optional). Leave empty to receive all priorities.",
      type: ["string"],
      required: false,
    },
  },

  inputs: {},

  onInternalMessage: async (input) => {
    const { issue, user } = input.message.body;

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
        created: issue.fields?.created,
      };

      // Extract user information
      const createdBy = user
        ? {
            accountId: user.accountId,
            displayName: user.displayName,
            emailAddress: user.emailAddress,
          }
        : null;

      await events.emit({
        issue: issueData,
        createdBy,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `Failed to process issue created webhook: ${errorMessage}`,
      );
    }
  },

  outputs: {
    default: {
      name: "Issue Created Event",
      description: "Processed issue creation event data",
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
              created: { type: "string", description: "Creation timestamp" },
            },
            required: ["id", "key"],
          },
          createdBy: {
            type: "object",
            description: "User who created the issue",
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
        required: ["issue", "timestamp"],
      },
    },
  },
};
