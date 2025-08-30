import { AppBlock, events } from "@slflows/sdk/v1";
import { createJiraClient } from "../../utils/jiraClient";

export const createIssue: AppBlock = {
  name: "Create Issue",
  description: "Create a new Jira issue with specified details",
  category: "Issues",

  inputs: {
    default: {
      config: {
        projectKey: {
          name: "Project Key",
          description:
            "The key of the project where the issue will be created (e.g., 'PROJ')",
          type: "string",
          required: true,
        },
        issueTypeName: {
          name: "Issue Type",
          description:
            "The name of the issue type (e.g., 'Bug', 'Task', 'Story', 'Epic')",
          type: "string",
          required: true,
        },
        summary: {
          name: "Summary",
          description: "Brief title/summary of the issue",
          type: "string",
          required: true,
        },
        description: {
          name: "Description",
          description:
            "Detailed description of the issue (supports ADF format)",
          type: "string",
          required: false,
        },
        priorityName: {
          name: "Priority",
          description:
            "The priority level name (e.g., 'Low', 'Medium', 'High', 'Critical'). Note: Priority field must be available on the Create Issue screen for this project/issue type.",
          type: "string",
          required: false,
        },
        assigneeAccountId: {
          name: "Assignee Account ID",
          description:
            "Account ID of the user to assign the issue to (optional)",
          type: "string",
          required: false,
        },
        parentKey: {
          name: "Parent Issue Key",
          description:
            "Key of the parent issue (for subtasks) or epic (for stories/tasks under an epic)",
          type: "string",
          required: false,
        },
        labels: {
          name: "Labels",
          description: "Array of labels to add to the issue",
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
      },
      onEvent: async (input) => {
        const { jiraUrl, email, apiToken } = input.app.config;
        const {
          projectKey,
          issueTypeName,
          summary,
          description,
          priorityName,
          assigneeAccountId,
          parentKey,
          labels,
          additionalFields,
        } = input.event.inputConfig;

        const jiraClient = createJiraClient({ jiraUrl, email, apiToken });

        // Build the issue fields
        const fields: any = {
          project: { key: projectKey },
          issuetype: { name: issueTypeName },
          summary,
        };

        // Add optional fields if provided
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
        }

        if (priorityName) {
          fields.priority = { name: priorityName };
        }

        if (assigneeAccountId) {
          fields.assignee = { accountId: assigneeAccountId };
        }

        if (parentKey) {
          fields.parent = { key: parentKey };
        }

        if (labels) {
          fields.labels = labels;
        }

        // Merge additional fields if provided
        if (additionalFields) {
          Object.assign(fields, additionalFields);
        }

        const issueData = { fields };

        try {
          const createdIssue = await jiraClient.post<{
            id: string;
            key: string;
            self: string;
          }>("/issue", issueData);

          await events.emit({
            issueId: createdIssue.id,
            issueKey: createdIssue.key,
            issueUrl: createdIssue.self,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to create Jira issue: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Created Issue",
      description: "Details of the successfully created issue",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          issueId: {
            type: "string",
            description: "The ID of the created issue",
          },
          issueKey: {
            type: "string",
            description: "The key of the created issue (e.g., PROJECT-123)",
          },
          issueUrl: {
            type: "string",
            description: "The API URL of the created issue",
          },
        },
        required: ["issueId", "issueKey", "issueUrl"],
      },
    },
  },
};
