import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { ChatCompletionTool } from "openai/resources/chat/completions.js";

export interface McpServerConfig {
  name: string;
  url: string;
}

interface ConnectedServer {
  config: McpServerConfig;
  client: Client;
}

/**
 * Manages connections to multiple MCP servers and aggregates their tools.
 * Each instance is bound to a single user token (for scope-based filtering).
 */
export class McpManager {
  private servers: ConnectedServer[] = [];
  private toolMap = new Map<string, ConnectedServer>();
  private tools: ChatCompletionTool[] = [];

  async connect(
    configs: McpServerConfig[],
    accessToken: string
  ): Promise<void> {
    for (const config of configs) {
      const client = new Client({ name: "agent-service", version: "1.0.0" });

      const transport = new StreamableHTTPClientTransport(
        new URL(config.url),
        {
          requestInit: {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        }
      );

      await client.connect(transport);
      const connected: ConnectedServer = { config, client };
      this.servers.push(connected);

      // List tools and register them with namespacing
      const { tools } = await client.listTools();
      for (const tool of tools) {
        const namespacedName = `${config.name}__${tool.name}`;
        this.toolMap.set(namespacedName, connected);
        this.tools.push({
          type: "function",
          function: {
            name: namespacedName,
            description: tool.description || "",
            parameters: tool.inputSchema as Record<string, unknown>,
          },
        });
      }

      console.log(
        `[MCP] Connected to "${config.name}" — ${tools.length} tools: ${tools.map((t) => t.name).join(", ")}`
      );
    }
  }

  getTools(): ChatCompletionTool[] {
    return this.tools;
  }

  async callTool(
    namespacedName: string,
    args: Record<string, unknown>
  ): Promise<string> {
    const server = this.toolMap.get(namespacedName);
    if (!server) {
      throw new Error(`Unknown tool: ${namespacedName}`);
    }

    // Strip namespace prefix to get original tool name
    const toolName = namespacedName.slice(server.config.name.length + 2);

    const result = await server.client.callTool({
      name: toolName,
      arguments: args,
    });

    // Extract text content from MCP result
    const texts = (result.content as { type: string; text?: string }[])
      .filter((c) => c.type === "text" && c.text)
      .map((c) => c.text!);

    return texts.join("\n");
  }

  async disconnect(): Promise<void> {
    for (const { client } of this.servers) {
      try {
        await client.close();
      } catch {
        // Ignore close errors
      }
    }
    this.servers = [];
    this.toolMap.clear();
    this.tools = [];
  }
}
