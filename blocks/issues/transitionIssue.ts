import { AppBlock, events } from "@slflows/sdk/v1";
import { createJiraClient } from "../../utils/jiraClient";

export const transitionIssue: AppBlock = {
  name: "Transition Issue",
  description:
    "Transition a Jira issue through workflow states (e.g., In Progress → Done)",
  category: "Issues",

  inputs: {
    default: {
      config: {
        issueIdOrKey: {
          name: "Issue ID or Key",
          description:
            "The ID or key of the issue to transition (e.g., 'PROJ-123' or '10001')",
          type: "string",
          required: true,
        },
        transitionName: {
          name: "Transition Name",
          description:
            "The name of the transition to perform (e.g., 'In Progress', 'Done', 'Close Issue')",
          type: "string",
          required: true,
        },
        comment: {
          name: "Comment",
          description: "Optional comment to add when transitioning the issue",
          type: "string",
          required: false,
        },
        resolution: {
          name: "Resolution",
          description:
            "Resolution to set (e.g., 'Fixed', 'Won\\'t Fix', 'Duplicate') - typically used when closing issues",
          type: "string",
          required: false,
        },
        additionalFields: {
          name: "Additional Fields",
          description:
            "Additional fields to set during transition as a JSON object",
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
          transitionName,
          comment,
          resolution,
          additionalFields,
        } = input.event.inputConfig;

        const jiraClient = createJiraClient({ jiraUrl, email, apiToken });

        try {
          // Find the transition ID by name
          const transitions = await jiraClient.get<{
            transitions: Array<{
              id: string;
              name: string;
              to: {
                name: string;
                id: string;
              };
            }>;
          }>(`/issue/${issueIdOrKey}/transitions`);

          const matchingTransition = transitions.transitions.find(
            (t) => t.name.toLowerCase() === transitionName.toLowerCase(),
          );

          if (!matchingTransition) {
            const availableTransitions = transitions.transitions
              .map((t) => t.name)
              .join(", ");
            throw new Error(
              `Transition '${transitionName}' not found. Available transitions: ${availableTransitions}`,
            );
          }

          const targetTransitionId = matchingTransition.id;

          // Build transition request
          const transitionData: any = {
            transition: {
              id: targetTransitionId,
            },
          };

          // Add fields if any are provided
          const fields: any = {};
          let hasFields = false;

          if (resolution) {
            fields.resolution = { name: resolution };
            hasFields = true;
          }

          // Merge additional fields if provided
          if (additionalFields) {
            Object.assign(fields, additionalFields);
            hasFields = true;
          }

          if (hasFields) {
            transitionData.fields = fields;
          }

          // Add comment if provided
          if (comment) {
            transitionData.update = {
              comment: [
                {
                  add: {
                    body: {
                      type: "doc",
                      version: 1,
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            {
                              type: "text",
                              text: comment,
                            },
                          ],
                        },
                      ],
                    },
                  },
                },
              ],
            };
          }

          await jiraClient.post<void>(
            `/issue/${issueIdOrKey}/transitions`,
            transitionData,
          );

          await events.emit({
            issueIdOrKey,
            transitionId: targetTransitionId,
            transitioned: true,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to transition issue: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Transition Result",
      description: "Confirmation that the issue was transitioned",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          issueIdOrKey: {
            type: "string",
            description: "The ID or key of the transitioned issue",
          },
          transitionId: {
            type: "string",
            description: "The ID of the transition that was performed",
          },
          transitioned: {
            type: "boolean",
            description: "Whether the transition was successful",
          },
        },
        required: ["issueIdOrKey", "transitionId", "transitioned"],
      },
    },
  },
};
