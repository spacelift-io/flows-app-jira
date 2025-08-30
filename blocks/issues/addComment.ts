import { AppBlock, events } from "@slflows/sdk/v1";
import { createJiraClient } from "../../utils/jiraClient";

export const addComment: AppBlock = {
  name: "Add Comment",
  description: "Add a comment to a Jira issue",
  category: "Issues",

  inputs: {
    default: {
      config: {
        issueIdOrKey: {
          name: "Issue ID or Key",
          description:
            "The ID or key of the issue to comment on (e.g., 'PROJ-123' or '10001')",
          type: "string",
          required: true,
        },
        comment: {
          name: "Comment Text",
          description: "The comment text to add to the issue",
          type: "string",
          required: true,
        },
        visibility: {
          name: "Visibility",
          description:
            "Comment visibility restriction (e.g., 'Developers', 'Administrators'). Leave empty for public comment.",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { jiraUrl, email, apiToken } = input.app.config;
        const { issueIdOrKey, comment, visibility } = input.event.inputConfig;

        const jiraClient = createJiraClient({ jiraUrl, email, apiToken });

        try {
          // Build comment request with proper ADF format
          const commentRequest: any = {
            body: {
              version: 1,
              type: "doc",
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

          // Add visibility restriction if provided
          if (visibility) {
            commentRequest.visibility = {
              type: "group",
              value: visibility,
            };
          }

          const addedComment = await jiraClient.post<{
            id: string;
            created: string;
            self: string;
          }>(`/issue/${issueIdOrKey}/comment`, commentRequest);

          await events.emit({
            commentId: addedComment.id,
            created: addedComment.created,
            commentUrl: addedComment.self,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to add comment: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Comment Result",
      description: "Details of the added comment",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          commentId: {
            type: "string",
            description: "The ID of the created comment",
          },
          created: {
            type: "string",
            description: "When the comment was created (ISO timestamp)",
          },
          commentUrl: {
            type: "string",
            description: "The API URL for this comment",
          },
        },
        required: ["commentId", "created", "commentUrl"],
      },
    },
  },
};
