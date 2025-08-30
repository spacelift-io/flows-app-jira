import { AppBlock, events } from "@slflows/sdk/v1";
import { createJiraClient } from "../../utils/jiraClient";

export const addWatchers: AppBlock = {
  name: "Add Watchers",
  description: "Add watchers to a Jira issue",
  category: "Issues",

  inputs: {
    default: {
      config: {
        issueIdOrKey: {
          name: "Issue ID or Key",
          description:
            "The ID or key of the issue to add watchers to (e.g., 'PROJ-123' or '10001')",
          type: "string",
          required: true,
        },
        accountIds: {
          name: "Account IDs",
          description: "Array of user account IDs to add as watchers",
          type: ["string"],
          required: true,
        },
      },
      onEvent: async (input) => {
        const { jiraUrl, email, apiToken } = input.app.config;
        const { issueIdOrKey, accountIds } = input.event.inputConfig;

        const jiraClient = createJiraClient({ jiraUrl, email, apiToken });

        try {
          // Add watchers one by one as the API accepts single account IDs
          const results = [];

          for (const accountId of accountIds) {
            try {
              await jiraClient.post<void>(
                `/issue/${issueIdOrKey}/watchers`,
                accountId,
              );
              results.push({ accountId, added: true });
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
              results.push({ accountId, added: false, error: errorMessage });
            }
          }

          const successCount = results.filter((r) => r.added).length;
          const failureCount = results.filter((r) => !r.added).length;

          await events.emit({
            issueIdOrKey,
            totalWatchers: accountIds.length,
            successCount,
            failureCount,
            results,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to add watchers: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Watchers Result",
      description: "Results of adding watchers to the issue",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          issueIdOrKey: {
            type: "string",
            description: "The ID or key of the issue",
          },
          totalWatchers: {
            type: "number",
            description: "Total number of watchers attempted to add",
          },
          successCount: {
            type: "number",
            description: "Number of watchers successfully added",
          },
          failureCount: {
            type: "number",
            description: "Number of watchers that failed to be added",
          },
          results: {
            type: "array",
            description: "Detailed results for each watcher",
            items: {
              type: "object",
              properties: {
                accountId: {
                  type: "string",
                  description: "Account ID of the user",
                },
                added: {
                  type: "boolean",
                  description:
                    "Whether the user was successfully added as a watcher",
                },
                error: {
                  type: "string",
                  description: "Error message if adding failed",
                },
              },
              required: ["accountId", "added"],
            },
          },
        },
        required: [
          "issueIdOrKey",
          "totalWatchers",
          "successCount",
          "failureCount",
          "results",
        ],
      },
    },
  },
};
