import {
  defineApp,
  http,
  messaging,
  blocks as blocksApi,
} from "@slflows/sdk/v1";
import { blocks } from "./blocks/index";
import { createJiraClient } from "./utils/jiraClient";
import { validatePayloadAgainstBlockConfig } from "./utils/webhookFilters";

export const app = defineApp({
  name: "Jira Integration",
  installationInstructions:
    "Jira integration app for managing issues, projects, and workflows.\n\nTo install:\n1. Add your Jira instance URL (e.g., https://your-domain.atlassian.net)\n2. Add your email address\n3. Add your Jira API token (generate from Account Settings > Security > API tokens)\n4. (Optional) Set up webhook integration:\n   - In Jira, go to Settings > System > Webhooks\n   - Click 'Create a Webhook'\n   - Use <copyable>`{appEndpointUrl}`</copyable> as webhook URL\n   - Select desired events: Issue Created, Issue Updated, Comment Created, etc.\n   - Click 'Create'\n   - Copy the generated secret and paste it in the 'Webhook Secret' field below\n5. Start using the blocks in your flows",

  blocks,

  config: {
    jiraUrl: {
      name: "Jira URL",
      description:
        "Your Jira instance URL (e.g., https://your-domain.atlassian.net)",
      type: "string",
      required: true,
    },
    email: {
      name: "Email",
      description: "Your Jira account email address",
      type: "string",
      required: true,
    },
    apiToken: {
      name: "API Token",
      description:
        "Your Jira API token (generate from Account Settings > Security > API tokens)",
      type: "string",
      required: true,
      sensitive: true,
    },
    webhookSecret: {
      name: "Webhook Secret",
      description:
        "Optional secret for webhook verification (used to validate incoming webhook requests). The secret will only be verified if you provide it.",
      type: "string",
      required: false,
      sensitive: true,
    },
  },

  signals: {
    userAccountId: {
      name: "User Account ID",
      description: "The account ID of the authenticated user",
    },
    userDisplayName: {
      name: "User Display Name",
      description: "Display name of the authenticated user",
    },
    userEmailAddress: {
      name: "User Email",
      description: "Email address of the authenticated user",
    },
  },

  async onSync(input) {
    const { jiraUrl, email, apiToken } = input.app.config;

    try {
      const jiraClient = createJiraClient({ jiraUrl, email, apiToken });

      // Validate credentials and get user info
      const userInfo = await jiraClient.get<{
        accountId: string;
        displayName: string;
        emailAddress: string;
      }>("/myself");

      return {
        newStatus: "ready",
        signalUpdates: {
          userAccountId: userInfo.accountId,
          userDisplayName: userInfo.displayName,
          userEmailAddress: userInfo.emailAddress,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error during Jira API authentication:", errorMessage);

      return {
        newStatus: "failed",
        customStatusDescription: "Authentication error, see logs",
      };
    }
  },

  http: {
    async onRequest(input) {
      const webhookSecret = input.app.config.webhookSecret;

      try {
        // Verify webhook signature if secret is configured
        if (webhookSecret) {
          const providedSignature = input.request.headers["X-Hub-Signature"];

          if (!providedSignature) {
            console.warn("Webhook request rejected: Missing signature");
            await http.respond(input.request.requestId, {
              statusCode: 401,
              body: "Unauthorized",
            });
            return;
          }

          // Calculate expected signature
          const crypto = await import("crypto");
          const expectedSignature = `sha256=${crypto
            .createHmac("sha256", webhookSecret)
            .update(input.request.rawBody, "utf8")
            .digest("hex")}`;

          // Constant-time comparison to prevent timing attacks
          if (
            !crypto.timingSafeEqual(
              Buffer.from(expectedSignature, "utf8"),
              Buffer.from(providedSignature, "utf8"),
            )
          ) {
            console.warn("Webhook request rejected: Invalid signature");
            await http.respond(input.request.requestId, {
              statusCode: 401,
              body: "Unauthorized",
            });
            return;
          }
        }

        // Parse and log the webhook payload
        const payload = JSON.parse(input.request.rawBody);
        console.log("Jira webhook received:", JSON.stringify(payload, null, 2));

        let typeId: string | undefined;
        let messageBody: any;

        // Process webhook event
        if (payload.webhookEvent === "jira:issue_created") {
          typeId = "issueCreated";
          messageBody = {
            issue: payload.issue,
            user: payload.user,
          };
        } else if (payload.webhookEvent === "jira:issue_updated") {
          typeId = "issueUpdated";
          messageBody = {
            issue: payload.issue,
            user: payload.user,
            changelog: payload.changelog,
          };
        } else if (payload.webhookEvent === "comment_created") {
          typeId = "commentCreated";
          messageBody = {
            issue: payload.issue,
            comment: payload.comment,
          };
        } else if (payload.webhookEvent === "jira:version_released") {
          typeId = "versionReleased";
          messageBody = {
            version: payload.version,
            user: payload.user,
          };
        }

        if (!typeId) {
          console.log(
            `Unsupported webhook event type: ${payload.webhookEvent}`,
          );
        } else {
          const listOutput = await blocksApi.list({ typeIds: [typeId] });
          const filteredBlocks = listOutput.blocks.filter((block) => {
            return validatePayloadAgainstBlockConfig(messageBody, block.config);
          });
          const blockIds = filteredBlocks.map((block) => block.id);

          if (blockIds.length > 0) {
            await messaging.sendToBlocks({
              blockIds,
              body: messageBody,
            });
          }
        }

        await http.respond(input.request.requestId, {
          statusCode: 200,
          body: "OK",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Error processing webhook:", errorMessage);

        await http.respond(input.request.requestId, {
          statusCode: 400,
          body: "Bad Request",
        });
      }
    },
  },
});
