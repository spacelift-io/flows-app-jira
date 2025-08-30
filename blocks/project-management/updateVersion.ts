import { AppBlock, events } from "@slflows/sdk/v1";
import { createJiraClient } from "../../utils/jiraClient";

export const updateVersion: AppBlock = {
  name: "Update Version",
  description: "Update an existing version in a Jira project",
  category: "Project Management",

  inputs: {
    default: {
      config: {
        versionId: {
          name: "Version ID",
          description: "The ID of the version to update",
          type: "string",
          required: true,
        },
        name: {
          name: "Version Name",
          description: "The name of the version (e.g., '1.0.0', 'Sprint 1')",
          type: "string",
          required: false,
        },
        description: {
          name: "Description",
          description: "Description of the version",
          type: "string",
          required: false,
        },
        archived: {
          name: "Archived",
          description: "Whether the version is archived",
          type: "boolean",
          required: false,
        },
        released: {
          name: "Released",
          description: "Whether the version is released",
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
          versionId,
          name,
          description,
          archived,
          released,
          startDate,
          releaseDate,
        } = input.event.inputConfig;

        const jiraClient = createJiraClient({ jiraUrl, email, apiToken });

        try {
          // Build version update request with only provided fields
          const versionRequest: any = {};

          if (name !== undefined) {
            versionRequest.name = name;
          }

          if (description !== undefined) {
            versionRequest.description = description;
          }

          if (archived !== undefined) {
            versionRequest.archived = archived;
          }

          if (released !== undefined) {
            versionRequest.released = released;
          }

          if (startDate !== undefined) {
            versionRequest.startDate = startDate;
          }

          if (releaseDate !== undefined) {
            versionRequest.releaseDate = releaseDate;
          }

          await jiraClient.put<void>(`/version/${versionId}`, versionRequest);

          await events.emit({
            updated: true,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to update version: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Update Result",
      description: "Confirmation that the version was updated",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          updated: {
            type: "boolean",
            description: "Whether the version was successfully updated",
          },
        },
        required: ["updated"],
      },
    },
  },
};
