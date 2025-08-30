import { AppBlock, events } from "@slflows/sdk/v1";
import { createJiraClient } from "../../utils/jiraClient";

export const searchIssues: AppBlock = {
  name: "Search Issues",
  description: "Search for Jira issues using JQL (Jira Query Language)",
  category: "Issues",

  inputs: {
    default: {
      config: {
        jql: {
          name: "JQL Query",
          description:
            "JQL query to search for issues (e.g., 'project = PROJ AND status = \"In Progress\"')",
          type: "string",
          required: true,
        },
        fields: {
          name: "Fields to Include",
          description:
            "Array of fields to include in results (e.g., ['summary', 'status', 'assignee']). If empty, returns default fields.",
          type: ["string"],
          required: false,
        },
        expand: {
          name: "Expand Options",
          description:
            "Array of entities to expand (e.g., ['names', 'renderedFields', 'changelog'])",
          type: ["string"],
          required: false,
        },
        startAt: {
          name: "Start At",
          description: "Starting index for pagination (default: 0)",
          type: "number",
          required: false,
        },
        maxResults: {
          name: "Max Results",
          description:
            "Maximum number of results to return (default: 50, max: 100)",
          type: "number",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { jiraUrl, email, apiToken } = input.app.config;
        const {
          jql,
          fields,
          expand,
          startAt = 0,
          maxResults = 50,
        } = input.event.inputConfig;

        const jiraClient = createJiraClient({ jiraUrl, email, apiToken });

        try {
          // Build search request body
          const searchRequest: any = {
            jql,
            startAt,
            maxResults: Math.min(maxResults, 100), // Cap at 100 to prevent excessive results
          };

          if (fields && fields.length > 0) {
            searchRequest.fields = fields;
          }

          if (expand && expand.length > 0) {
            searchRequest.expand = expand;
          }

          const searchResults = await jiraClient.post<{
            startAt: number;
            maxResults: number;
            total: number;
            issues: Array<{
              id: string;
              key: string;
              self: string;
              fields: any;
              expand?: string;
              names?: Record<string, string>;
              renderedFields?: Record<string, any>;
              changelog?: any;
            }>;
            warningMessages?: string[];
          }>("/search", searchRequest);

          await events.emit({
            total: searchResults.total,
            startAt: searchResults.startAt,
            maxResults: searchResults.maxResults,
            issues: searchResults.issues.map((issue) => ({
              id: issue.id,
              key: issue.key,
              issueUrl: issue.self,
              fields: issue.fields,
              expand: issue.expand,
              names: issue.names,
              renderedFields: issue.renderedFields,
              changelog: issue.changelog,
            })),
            warningMessages: searchResults.warningMessages || [],
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to search issues: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Search Results",
      description: "Issues matching the JQL query with pagination info",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          total: {
            type: "number",
            description: "Total number of issues matching the query",
          },
          startAt: {
            type: "number",
            description: "Starting index of this page",
          },
          maxResults: {
            type: "number",
            description: "Maximum results requested per page",
          },
          issues: {
            type: "array",
            description: "Array of issues matching the query",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "The issue ID" },
                key: {
                  type: "string",
                  description: "The issue key (e.g., PROJ-123)",
                },
                issueUrl: {
                  type: "string",
                  description: "The API URL for this issue",
                },
                fields: { type: "object", description: "The issue fields" },
                expand: {
                  type: "string",
                  description: "The expand parameter used",
                },
                names: {
                  type: "object",
                  description: "Translated field names (when expanded)",
                },
                renderedFields: {
                  type: "object",
                  description: "HTML-rendered field values (when expanded)",
                },
                changelog: {
                  type: "object",
                  description: "Issue change history (when expanded)",
                },
              },
              required: ["id", "key", "issueUrl", "fields"],
            },
          },
          warningMessages: {
            type: "array",
            description: "Warning messages from the search",
            items: { type: "string" },
          },
        },
        required: [
          "total",
          "startAt",
          "maxResults",
          "issues",
          "warningMessages",
        ],
      },
    },
  },
};
