import { AppBlock, events } from "@slflows/sdk/v1";
import { createJiraClient } from "../../utils/jiraClient";

export const getUserDetails: AppBlock = {
  name: "Get User Details",
  description: "Look up Jira user details by email address or account ID",
  category: "Users",

  inputs: {
    default: {
      config: {
        email: {
          name: "Email Address",
          description:
            "Email address of the user to look up (incompatible with Account ID)",
          type: "string",
          required: false,
        },
        accountId: {
          name: "Account ID",
          description:
            "Account ID of the user to look up (incompatible with Email Address)",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { jiraUrl, email: configEmail, apiToken } = input.app.config;
        const { email, accountId } = input.event.inputConfig;

        if (!email && !accountId) {
          throw new Error("Either email or accountId must be provided");
        }

        if (email && accountId) {
          throw new Error(
            "Email and accountId cannot be used together - choose one",
          );
        }

        const jiraClient = createJiraClient({
          jiraUrl,
          email: configEmail,
          apiToken,
        });

        try {
          let user;

          if (accountId) {
            // Get user by account ID
            user = await jiraClient.get<{
              accountId: string;
              displayName: string;
              emailAddress: string;
              active: boolean;
              accountType: string;
            }>(`/user?accountId=${encodeURIComponent(accountId)}`);
          } else {
            // Use the user search API to find user by email
            const users = await jiraClient.get<
              Array<{
                accountId: string;
                displayName: string;
                emailAddress: string;
                active: boolean;
                accountType: string;
              }>
            >(`/user/search?query=${encodeURIComponent(email)}`);

            // Find exact email match (search can return partial matches)
            user = users.find(
              (u) => u.emailAddress?.toLowerCase() === email.toLowerCase(),
            );

            if (!user) {
              throw new Error(`No user found with email address: ${email}`);
            }
          }

          await events.emit({
            accountId: user.accountId,
            displayName: user.displayName,
            emailAddress: user.emailAddress,
            active: user.active,
            accountType: user.accountType,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to find user: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "User Details",
      description: "Details of the found user",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          accountId: {
            type: "string",
            description: "The user's account ID for API calls",
          },
          displayName: {
            type: "string",
            description: "The user's display name",
          },
          emailAddress: {
            type: "string",
            description: "The user's email address",
          },
          active: {
            type: "boolean",
            description: "Whether the user account is active",
          },
          accountType: {
            type: "string",
            description: "The type of account (e.g., 'atlassian')",
          },
        },
        required: ["accountId", "displayName", "active", "accountType"],
      },
    },
  },
};
