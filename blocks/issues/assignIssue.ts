import { AppBlock, events } from "@slflows/sdk/v1";
import { createJiraClient } from "../../utils/jiraClient";

export const assignIssue: AppBlock = {
  name: "Assign Issue",
  description: "Assign a Jira issue to a user",
  category: "Issues",

  inputs: {
    default: {
      config: {
        issueIdOrKey: {
          name: "Issue ID or Key",
          description:
            "The ID or key of the issue to assign (e.g., 'PROJ-123' or '10001')",
          type: "string",
          required: true,
        },
        accountId: {
          name: "Account ID",
          description:
            "Account ID of the user to assign the issue to. Use null or empty string to unassign.",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { jiraUrl, email, apiToken } = input.app.config;
        const { issueIdOrKey, accountId } = input.event.inputConfig;

        const jiraClient = createJiraClient({ jiraUrl, email, apiToken });

        try {
          // Build assignment request
          const assignmentRequest = {
            accountId: accountId || null,
          };

          await jiraClient.put<void>(
            `/issue/${issueIdOrKey}/assignee`,
            assignmentRequest,
          );

          await events.emit({
            issueIdOrKey,
            assigned: true,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to assign issue: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Assignment Result",
      description: "Confirmation that the issue was assigned",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          issueIdOrKey: {
            type: "string",
            description: "The ID or key of the assigned issue",
          },
          assigned: {
            type: "boolean",
            description: "Whether the assignment was successful",
          },
        },
        required: ["issueIdOrKey", "assigned"],
      },
    },
  },
};
