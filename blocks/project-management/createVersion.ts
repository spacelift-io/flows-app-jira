import { AppBlock, events } from "@slflows/sdk/v1";
import { createJiraClient } from "../../utils/jiraClient";

export const createVersion: AppBlock = {
  name: "Create Version",
  description: "Create a new version in a Jira project",
  category: "Project Management",

  inputs: {
    default: {
      config: {
        projectIdOrKey: {
          name: "Project ID or Key",
          description:
            "The ID or key of the project to create the version in (e.g., 'PROJ' or '10001')",
          type: "string",
          required: true,
        },
        name: {
          name: "Version Name",
          description: "The name of the version (e.g., '1.0.0', 'Sprint 1')",
          type: "string",
          required: true,
        },
        description: {
          name: "Description",
          description: "Optional description of the version",
          type: "string",
          required: false,
        },
        archived: {
          name: "Archived",
          description: "Whether the version is archived (default: false)",
          type: "boolean",
          required: false,
        },
        released: {
          name: "Released",
          description: "Whether the version is released (default: false)",
          type: "boolean",
          required: false,
        },
        startDate: {
          name: "Start Date",
          description: "Start date in YYYY-MM-DD format",
          type: "string",
          required: false,
        },
        releaseDate: {
          name: "Release Date",
          description: "Release date in YYYY-MM-DD format",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { jiraUrl, email, apiToken } = input.app.config;
        const {
          projectIdOrKey,
          name,
          description,
          archived = false,
          released = false,
          startDate,
          releaseDate,
        } = input.event.inputConfig;

        const jiraClient = createJiraClient({ jiraUrl, email, apiToken });

        try {
          // Build version request
          const versionRequest: any = {
            name,
            projectId: projectIdOrKey,
            archived,
            released,
          };

          if (description) {
            versionRequest.description = description;
          }

          if (startDate) {
            versionRequest.startDate = startDate;
          }

          if (releaseDate) {
            versionRequest.releaseDate = releaseDate;
          }

          const createdVersion = await jiraClient.post<{
            id: string;
            self: string;
            name: string;
            description?: string;
            archived: boolean;
            released: boolean;
            startDate?: string;
            releaseDate?: string;
          }>("/version", versionRequest);

          await events.emit({
            versionId: createdVersion.id,
            versionUrl: createdVersion.self,
            created: true,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to create version: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Version Result",
      description: "Details of the created version",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          versionId: {
            type: "string",
            description: "The ID of the created version",
          },
          versionUrl: {
            type: "string",
            description: "The API URL for this version",
          },
          created: {
            type: "boolean",
            description: "Whether the version was successfully created",
          },
        },
        required: ["versionId", "versionUrl", "created"],
      },
    },
  },
};
