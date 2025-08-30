import { AppBlock, events } from "@slflows/sdk/v1";
import { createJiraClient } from "../../utils/jiraClient";

export const linkIssues: AppBlock = {
  name: "Link Issues",
  description: "Create a link between two Jira issues",
  category: "Issues",

  inputs: {
    default: {
      config: {
        linkType: {
          name: "Link Type",
          description:
            "The type of link (e.g., 'Blocks', 'Relates', 'Duplicates', 'Cloners')",
          type: "string",
          required: true,
        },
        inwardIssue: {
          name: "Inward Issue",
          description: "The ID or key of the inward issue (e.g., 'PROJ-123')",
          type: "string",
          required: true,
        },
        outwardIssue: {
          name: "Outward Issue",
          description: "The ID or key of the outward issue (e.g., 'PROJ-124')",
          type: "string",
          required: true,
        },
        comment: {
          name: "Comment",
          description: "Optional comment to add when creating the link",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { jiraUrl, email, apiToken } = input.app.config;
        const { linkType, inwardIssue, outwardIssue, comment } =
          input.event.inputConfig;

        const jiraClient = createJiraClient({ jiraUrl, email, apiToken });

        try {
          // Build link request
          const linkRequest: any = {
            type: {
              name: linkType,
            },
            inwardIssue: {
              key: inwardIssue,
            },
            outwardIssue: {
              key: outwardIssue,
            },
          };

          // Add comment if provided
          if (comment) {
            linkRequest.comment = {
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
            };
          }

          await jiraClient.post<void>("/issueLink", linkRequest);

          await events.emit({
            linked: true,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to link issues: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Link Result",
      description: "Confirmation that the issues were linked",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          linked: {
            type: "boolean",
            description: "Whether the link was successful",
          },
        },
        required: ["linked"],
      },
    },
  },
};
