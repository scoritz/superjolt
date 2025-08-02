#!/usr/bin/env node
import { NestFactory } from '@nestjs/core';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpModule } from './mcp.module';
import { McpService } from './mcp.service';

async function bootstrap() {
  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(McpModule, {
    logger: false, // Disable NestJS logging for MCP
  });

  // Get the MCP service
  const mcpService = app.get(McpService);

  // Create and configure the MCP server
  const server = await mcpService.createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    server
      .close()
      .then(() => app.close())
      .then(() => {
        process.exit(0);
      })
      .catch(() => {
        process.exit(1);
      });
  });

  process.on('SIGTERM', () => {
    server
      .close()
      .then(() => app.close())
      .then(() => {
        process.exit(0);
      })
      .catch(() => {
        process.exit(1);
      });
  });
}

bootstrap().catch((error) => {
  // Write error to stderr instead of stdout to avoid breaking JSON-RPC
  process.stderr.write(`Fatal error: ${error.message}\n`);
  process.exit(1);
});
