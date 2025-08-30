import { AppBlock, events } from "@slflows/sdk/v1";
import { createJiraClient } from "../../utils/jiraClient";

export const updateIssue: AppBlock = {
  name: "Update Issue",
  description: "Update an existing Jira issue with new field values",
  category: "Issues",

  inputs: {
    default: {
      config: {
        issueIdOrKey: {
          name: "Issue ID or Key",
          description:
            "The ID or key of the issue to update (e.g., 'PROJ-123' or '10001')",
          type: "string",
          required: true,
        },
        summary: {
          name: "Summary",
          description: "Updated summary/title for the issue",
          type: "string",
          required: false,
        },
        description: {
          name: "Description",
          description:
            "Updated description for the issue (supports ADF format)",
          type: "string",
          required: false,
        },
        priorityName: {
          name: "Priority",
          description:
            "Updated priority level name (e.g., 'Low', 'Medium', 'High', 'Critical')",
          type: "string",
          required: false,
        },
        assigneeAccountId: {
          name: "Assignee Account ID",
          description: "Account ID of the user to assign the issue to",
          type: "string",
          required: false,
        },
        labels: {
          name: "Labels",
          description:
            "Array of labels to set on the issue (replaces existing labels)",
          type: ["string"],
          required: false,
        },
        additionalFields: {
          name: "Additional Fields",
          description:
            "Additional fields as a JSON object (for custom fields, components, etc.)",
          type: {
            type: "object",
          },
          required: false,
        },
        updateOperations: {
          name: "Update Operations",
          description:
            "Advanced update operations using Jira's update syntax (e.g., {'labels': [{'add': 'new-label'}, {'remove': 'old-label'}]})",
          type: {
            type: "object",
          },
          required: false,
        },
      },
      onEvent: async (input) => {
        const { jiraUrl, email, apiToken } = input.app.config;
        const {
          issueIdOrKey,
          summary,
          description,
          priorityName,
          assigneeAccountId,
          labels,
          additionalFields,
          updateOperations,
        } = input.event.inputConfig;

        const jiraClient = createJiraClient({ jiraUrl, email, apiToken });

        try {
          const updateData: any = {};

          // Build fields section if any simple field updates are provided
          const fields: any = {};
          let hasFields = false;

          if (summary) {
            fields.summary = summary;
            hasFields = true;
          }

          if (description) {
            fields.description = {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: description,
                    },
                  ],
                },
              ],
            };
            hasFields = true;
          }

          if (priorityName) {
            fields.priority = { name: priorityName };
            hasFields = true;
          }

          if (assigneeAccountId) {
            fields.assignee = { accountId: assigneeAccountId };
            hasFields = true;
          }

          if (labels) {
            fields.labels = labels;
            hasFields = true;
          }

          // Merge additional fields if provided
          if (additionalFields) {
            Object.assign(fields, additionalFields);
            hasFields = true;
          }

          if (hasFields) {
            updateData.fields = fields;
          }

          // Add update operations if provided
          if (updateOperations) {
            updateData.update = updateOperations;
          }

          // Ensure we have something to update
          if (!hasFields && !updateOperations) {
            throw new Error("No fields or update operations provided");
          }

          await jiraClient.put<void>(`/issue/${issueIdOrKey}`, updateData);

          await events.emit({
            issueIdOrKey,
            updated: true,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to update issue: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Update Result",
      description: "Confirmation that the issue was updated",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          issueIdOrKey: {
            type: "string",
            description: "The ID or key of the updated issue",
          },
          updated: {
            type: "boolean",
            description: "Whether the update was successful",
          },
        },
        required: ["issueIdOrKey", "updated"],
      },
    },
  },
};
