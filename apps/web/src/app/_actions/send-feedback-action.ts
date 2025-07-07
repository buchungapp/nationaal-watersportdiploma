"use server";
import {
  ComponentDividerSpacingSize,
  ComponentTextColor,
  ComponentTextSize,
  PlainClient,
  ThreadFieldSchemaType,
} from "@team-plain/typescript-sdk";
import { z } from "zod";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { getUserOrThrow, submitProductFeedback } from "~/lib/nwd";

const prioritySchema = z.enum(["low", "normal", "high"]);
const typeSchema = z.enum(["bug", "product-feedback", "question"]);

const mapToPriorityNumber = (priority: z.infer<typeof prioritySchema>) => {
  switch (priority) {
    case "low":
      return 3;
    case "normal":
      return 2;
    case "high":
      return 1;
    default:
      return 2;
  }
};

const client = process.env.PLAIN_API_KEY
  ? new PlainClient({
      apiKey: process.env.PLAIN_API_KEY,
    })
  : null;

const sendFeedbackSchema = z.object({
  type: typeSchema,
  query: z
    .record(z.string(), z.union([z.string(), z.string().array()]))
    .optional(),
  path: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  priority: prioritySchema,
  message: z.string(),
});

export const productFeedbackAction = actionClientWithMeta
  .schema(sendFeedbackSchema)
  .metadata({
    name: "send-feedback",
  })
  .action(async ({ parsedInput: data }) => {
    // Early return if Plain client is not configured
    if (!client) {
      console.warn(
        "Plain API key not configured, only storing feedback locally",
      );
      await submitProductFeedback(data);
      return;
    }

    try {
      const user = await getUserOrThrow();

      // Create or update customer
      const customerResult = await client.upsertCustomer({
        identifier: {
          emailAddress: user.email,
        },
        onCreate: {
          fullName: user.displayName ?? "Unknown User",
          externalId: user.authUserId,
          email: {
            email: user.email,
            isVerified: true,
          },
        },
        onUpdate: {
          fullName: { value: user.displayName ?? "Unknown User" },
          externalId: { value: user.authUserId },
        },
      });

      // Check for customer creation errors
      if (customerResult.error) {
        console.error(
          "Failed to create/update customer:",
          customerResult.error,
        );
        throw new Error(
          `Customer operation failed: ${customerResult.error.message}`,
        );
      }

      if (!customerResult.data?.customer.id) {
        throw new Error("Customer ID not returned from upsert operation");
      }

      // Generate title based on feedback type
      const titleMap = {
        bug: "🐛 Bug Report",
        "product-feedback": "💡 Product Feedback",
        question: "❓ Question",
      };

      // Create thread with proper structure
      const threadResult = await client.createThread({
        title: `${titleMap[data.type]}: ${data.message.substring(0, 50)}${data.message.length > 50 ? "..." : ""}`,
        priority: mapToPriorityNumber(data.priority),
        customerIdentifier: {
          customerId: customerResult.data.customer.id,
        },
        labelTypeIds: ["lt_01JZJ4HNFPT5Q1CCW7M1RCJGG4"], // Support label
        components: [
          {
            componentText: {
              text: data.message,
              textSize: ComponentTextSize.M,
            },
          },
          ...(data.path || data.query || data.headers
            ? [
                {
                  componentDivider: {
                    dividerSpacingSize: ComponentDividerSpacingSize.M,
                  },
                },
                {
                  componentText: {
                    text: "Technical Details",
                    textSize: ComponentTextSize.S,
                    textColor: ComponentTextColor.Muted,
                  },
                },
              ]
            : []),
          ...(data.path
            ? [
                {
                  componentText: {
                    text: `**Path:** ${data.path}`,
                    textSize: ComponentTextSize.S,
                  },
                },
              ]
            : []),
          ...(data.query
            ? [
                {
                  componentText: {
                    text: `**Query Parameters:**\n\`\`\`json\n${JSON.stringify(data.query, null, 2)}\n\`\`\``,
                    textSize: ComponentTextSize.S,
                  },
                },
              ]
            : []),
          ...(data.headers
            ? [
                {
                  componentText: {
                    text: `**Headers:**\n\`\`\`json\n${JSON.stringify(data.headers, null, 2)}\n\`\`\``,
                    textSize: ComponentTextSize.S,
                  },
                },
              ]
            : []),
        ],
        threadFields: [
          {
            type: ThreadFieldSchemaType.Enum,
            key: "feedback_type",
            stringValue: data.type,
          },
          ...(data.path
            ? [
                {
                  type: ThreadFieldSchemaType.String,
                  key: "path",
                  stringValue: data.path,
                },
              ]
            : []),
        ],
      });

      // Check for thread creation errors
      if (threadResult.error) {
        console.error("Failed to create thread:", threadResult.error);
        throw new Error(
          `Thread creation failed: ${threadResult.error.message}`,
        );
      }

      if (!threadResult.data?.id) {
        throw new Error("Thread ID not returned from create operation");
      }

      await submitProductFeedback(data);

      return {
        success: true,
        threadId: threadResult.data.id,
      };
    } catch (error) {
      console.warn("Plain integration failed:", error);

      await submitProductFeedback(data);

      return {
        success: true,
        fallback: true,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
