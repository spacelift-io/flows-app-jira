import { AppBlock, events } from "@slflows/sdk/v1";
import { createJiraClient } from "../../utils/jiraClient";

export const addExternalLink: AppBlock = {
  name: "Add External Link",
  description: "Add an external/remote link to a Jira issue",
  category: "Issues",

  inputs: {
    default: {
      config: {
        issueIdOrKey: {
          name: "Issue ID or Key",
          description:
            "The ID or key of the issue to add the external link to (e.g., 'PROJ-123' or '10001')",
          type: "string",
          required: true,
        },
        url: {
          name: "URL",
          description: "The URL of the external link",
          type: "string",
          required: true,
        },
        title: {
          name: "Title",
          description: "Title/display text for the link",
          type: "string",
          required: true,
        },
        summary: {
          name: "Summary",
          description: "Optional summary or description of the link",
          type: "string",
          required: false,
        },
        iconUrl: {
          name: "Icon URL",
          description: "Optional URL to an icon for the link",
          type: "string",
          required: false,
        },
        iconTitle: {
          name: "Icon Title",
          description: "Optional title for the icon",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { jiraUrl, email, apiToken } = input.app.config;
        const { issueIdOrKey, url, title, summary, iconUrl, iconTitle } =
          input.event.inputConfig;

        const jiraClient = createJiraClient({ jiraUrl, email, apiToken });

        try {
          // Build remote link request
          const remoteLinkRequest: any = {
            object: {
              url,
              title,
            },
          };

          if (summary) {
            remoteLinkRequest.object.summary = summary;
          }

          if (iconUrl) {
            remoteLinkRequest.object.icon = {
              url16x16: iconUrl,
            };

            if (iconTitle) {
              remoteLinkRequest.object.icon.title = iconTitle;
            }
          }

          const createdLink = await jiraClient.post<{
            id: number;
            self: string;
          }>(`/issue/${issueIdOrKey}/remotelink`, remoteLinkRequest);

          await events.emit({
            linkId: createdLink.id.toString(),
            linkUrl: createdLink.self,
            created: true,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to add external link: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "External Link Result",
      description: "Details of the created external link",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          linkId: {
            type: "string",
            description: "The ID of the created remote link",
          },
          linkUrl: {
            type: "string",
            description: "The API URL for this remote link",
          },
          created: {
            type: "boolean",
            description: "Whether the link was successfully created",
          },
        },
        required: ["linkId", "linkUrl", "created"],
      },
    },
  },
};
