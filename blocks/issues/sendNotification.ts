import { AppBlock, events } from "@slflows/sdk/v1";
import { createJiraClient } from "../../utils/jiraClient";

export const sendNotification: AppBlock = {
  name: "Send Notification",
  description: "Send notification to users about a Jira issue",
  category: "Issues",

  inputs: {
    default: {
      config: {
        issueIdOrKey: {
          name: "Issue ID or Key",
          description:
            "The ID or key of the issue to notify about (e.g., 'PROJ-123' or '10001')",
          type: "string",
          required: true,
        },
        subject: {
          name: "Subject",
          description: "Subject line for the notification",
          type: "string",
          required: true,
        },
        textBody: {
          name: "Text Body",
          description: "Plain text content of the notification",
          type: "string",
          required: false,
        },
        htmlBody: {
          name: "HTML Body",
          description: "HTML content of the notification",
          type: "string",
          required: false,
        },
        recipients: {
          name: "Recipients",
          description:
            "List of user account IDs, email addresses, or group names to notify",
          type: ["string"],
          required: true,
        },
        restrict: {
          name: "Restrict Visibility",
          description:
            "Restrict notifications to users who can see the issue (default: true)",
          type: "boolean",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { jiraUrl, email, apiToken } = input.app.config;
        const {
          issueIdOrKey,
          subject,
          textBody,
          htmlBody,
          recipients,
          restrict = true,
        } = input.event.inputConfig;

        const jiraClient = createJiraClient({ jiraUrl, email, apiToken });

        try {
          // Build notification request
          const notificationRequest: any = {
            subject,
            to: {
              users: recipients.map((recipient: string) => {
                // Check if recipient looks like an email
                if (recipient.includes("@")) {
                  return { email: recipient };
                }
                // Check if recipient looks like a group
                if (recipient.includes("-")) {
                  return { name: recipient };
                }
                // Otherwise treat as account ID
                return { accountId: recipient };
              }),
            },
            restrict: {
              permissions: restrict ? [{ key: "BROWSE" }] : [],
            },
          };

          // Add body content
          if (textBody && htmlBody) {
            notificationRequest.textBody = textBody;
            notificationRequest.htmlBody = htmlBody;
          } else if (textBody) {
            notificationRequest.textBody = textBody;
          } else if (htmlBody) {
            notificationRequest.htmlBody = htmlBody;
          }

          await jiraClient.post<void>(
            `/issue/${issueIdOrKey}/notify`,
            notificationRequest,
          );

          await events.emit({
            issueIdOrKey,
            subject,
            recipientCount: recipients.length,
            notified: true,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to send notification: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Notification Result",
      description: "Confirmation that the notification was sent",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          issueIdOrKey: {
            type: "string",
            description: "The ID or key of the issue",
          },
          subject: {
            type: "string",
            description: "The subject of the notification",
          },
          recipientCount: {
            type: "number",
            description: "Number of recipients notified",
          },
          notified: {
            type: "boolean",
            description: "Whether the notification was successful",
          },
        },
        required: ["issueIdOrKey", "subject", "recipientCount", "notified"],
      },
    },
  },
};
