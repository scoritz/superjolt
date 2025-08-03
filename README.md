<div align="center">
  <img src="https://superjolt.com/superjolt-logo.svg" alt="Superjolt Logo" width="120" height="120">
  
  # Superjolt CLI (Beta)
  
  [![npm version](https://img.shields.io/npm/v/superjolt.svg)](https://www.npmjs.com/package/superjolt)
  [![npm downloads](https://img.shields.io/npm/dw/superjolt.svg)](https://www.npmjs.com/package/superjolt)
  [![Tests](https://github.com/scoritz/superjolt/actions/workflows/test.yml/badge.svg)](https://github.com/scoritz/superjolt/actions/workflows/test.yml)
  [![codecov](https://codecov.io/gh/scoritz/superjolt/graph/badge.svg)](https://codecov.io/gh/scoritz/superjolt)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289DA)](https://superjolt.com/discord)
  
  **🤖 AI-Powered Deployment Platform with MCP Support**
  
  Official command-line interface for [Superjolt](https://superjolt.com) - Deploy and manage JavaScript applications with AI assistance.
</div>

> ⚡ **Beta Release**: We're actively improving Superjolt based on your feedback. Join our [Discord](https://superjolt.com/discord) to share your experience!
> 
> During beta, the CLI will automatically check for critical updates to ensure compatibility with our evolving API.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [🤖 AI Integration (MCP)](#-ai-integration-mcp)
- [Installation](#installation)
- [Commands](#commands)
  - [Authentication](#authentication)
  - [Deployment](#deployment)
  - [Machine Management](#machine-management)
  - [Service Management](#service-management)
  - [Custom Domains](#custom-domains)
  - [Environment Variables](#environment-variables)
  - [Logs](#logs)
  - [Other Commands](#other-commands)
- [Configuration](#configuration)
- [CI/CD Integration](#cicd-integration)
- [Examples](#examples)
- [Web Dashboard](#web-dashboard)
- [Support](#support)
- [Contributing](#contributing)
- [License](#license)

## Overview

Superjolt CLI is the fastest way to deploy JavaScript applications to the cloud. With integrated AI support through Model Context Protocol (MCP), you can manage your entire infrastructure using natural language with Claude Desktop.

**Key Features:**
- 🚀 One-command deployment: `npx superjolt deploy`
- 🤖 AI-powered infrastructure management via MCP
- 🔧 Full service lifecycle management
- 🔐 Secure environment variable handling
- 📊 Real-time logs and monitoring
- 🌐 Automatic SSL and custom domains

## Quick Start

From your JavaScript framework project folder, run:

```bash
npx superjolt deploy
```

That's it! The CLI will guide you through authentication and deployment.

## 🤖 AI Integration (MCP)

Superjolt is one of the first deployment platforms with native Model Context Protocol (MCP) support, allowing you to manage your entire infrastructure through AI assistants like Claude Desktop.

### Why MCP?

- **Natural Language Control**: Manage deployments using conversational commands
- **Context-Aware Operations**: AI understands your infrastructure state
- **Automated Workflows**: Let AI handle complex deployment sequences
- **Error Resolution**: Get intelligent help with deployment issues

### Setup MCP

1. **Install Superjolt CLI** (includes MCP server):
   ```bash
   npm install -g superjolt
   ```

2. **Authenticate with Superjolt**:
   ```bash
   superjolt login
   ```

3. **Add to Claude Desktop configuration**:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/claude/claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "superjolt": {
         "command": "superjolt-mcp",
         "args": []
       }
     }
   }
   ```

4. **Restart Claude Desktop**

### MCP Capabilities

Once configured, you can use natural language to:

**Authentication & CI/CD Setup:**
- "Get my authentication token for CI/CD"
- "Show me how to set up GitHub Actions"
- "Check if I'm authenticated"

**Infrastructure Management:**
- "Create a new production machine"
- "List all my running services"
- "Show me services that are stopped"
- "Delete all test machines"

**Deployment Operations:**
- "Restart my API service"
- "Stop the staging environment"
- "Show logs for the web service"

**Configuration:**
- "Set DATABASE_URL for my backend"
- "List all environment variables"
- "Update API keys for production"

**Custom Domains:**
- "Add app.example.com to my web service"
- "List all custom domains"
- "Check validation status for my domain"
- "Remove old.example.com"

### Available MCP Tools

<details>
<summary>View all MCP tools</summary>

#### Authentication
- `check_auth` - Check if authenticated with Superjolt
- `get_current_user` - Get current user information
- `get_token` - Get authentication token for CI/CD use

#### Machine Management  
- `list_machines` - List all machines
- `create_machine` - Create a new machine
- `delete_machine` - Delete a machine
- `rename_machine` - Rename a machine
- `set_default_machine` - Set the default machine for deployments

#### Service Management
- `list_services` - List services (optionally filtered by machine)
- `start_service` - Start a service
- `stop_service` - Stop a service
- `restart_service` - Restart a service
- `delete_service` - Delete a service  
- `rename_service` - Rename a service

#### Environment Variables
- `list_env_vars` - List all environment variables for a service
- `set_env_vars` - Set one or more environment variables
- `get_env_var` - Get a specific environment variable
- `delete_env_var` - Delete an environment variable
- `push_env_file` - Push a .env file to a service

#### Custom Domains
- `add_custom_domain` - Add a custom domain to a service
- `list_custom_domains` - List custom domains for a service or all services
- `remove_custom_domain` - Remove a custom domain
- `get_custom_domain_status` - Get the status of a custom domain

#### Logs
- `get_logs` - Get logs for a service

</details>

### MCP Requirements & Troubleshooting

- **Node.js 16 or later is required** (The MCP server uses modern JavaScript features)
- If you see `Unexpected token '??='` errors, Claude Desktop is using an old Node.js version

**Solutions:**
1. Set your default Node version and restart Claude Desktop:
   ```bash
   nvm alias default 16  # or higher
   # Completely quit and restart Claude Desktop
   ```

2. Or use explicit paths in your Claude Desktop config:
   ```json
   {
     "mcpServers": {
       "superjolt": {
         "command": "/path/to/node16+/bin/node",
         "args": ["/path/to/node16+/bin/superjolt-mcp"]
       }
     }
   }
   ```

## Installation

You can use Superjolt CLI in several ways:

### Using npx (no installation required)

```bash
npx superjolt deploy
```

### Global Installation

Install the Superjolt CLI globally using npm:

```bash
npm install -g superjolt
```

Or using yarn:

```bash
yarn global add superjolt
```

## Commands

### Authentication

- `superjolt login` - Authenticate with your Superjolt account
- `superjolt logout` - Log out from your account
- `superjolt me` - Display current user information
- `superjolt token` - Display your authentication token for CI/CD use
  - `--show` - Show the full token (for exporting)

### Deployment

- `superjolt deploy [options]` - Deploy your application to Superjolt
  - `-p, --path <path>` - Path to the application directory (defaults to current directory)
  - `-s, --service <serviceId>` - Deploy to existing service (optional)
  - `-m, --machine <machineId>` - Machine ID to deploy to
  - `-n, --name <name>` - Service name (defaults to package.json name for new services)
  - `-v, --verbose` - Show detailed build output and logs

### Machine Management

- `superjolt machine:create` - Create a new machine
- `superjolt machine:list` - List all your machines
- `superjolt machine:delete <machine-id>` - Delete a machine
- `superjolt machine:use <machine-id>` - Set the default machine for deployments
- `superjolt machine:rename [machine-id] <new-name>` - Rename a machine (uses default machine if ID omitted)

### Service Management

- `superjolt service:list [machine-id]` - List services for a machine
- `superjolt service:start <service-id>` - Start a service
- `superjolt service:stop <service-id>` - Stop a service
- `superjolt service:restart <service-id>` - Restart a service
- `superjolt service:rename <service-id> <new-name>` - Rename a service (alias: `rename`)
- `superjolt service:delete <service-id>` - Delete a service

### Custom Domains

- `superjolt domain:add <domain> [service-id]` - Add a custom domain to a service (uses .superjolt file if service ID omitted)
  - `-p, --primary` - Set as primary domain for the service
- `superjolt domain:list [service-id]` - List custom domains (alias: `domains`)
- `superjolt domain:status <domain>` - Check domain validation status
- `superjolt domain:remove <domain>` - Remove a custom domain (alias: `domain:delete`)

### Environment Variables

- `superjolt env:list` - List environment variables
- `superjolt env:set <key> <value>` - Set an environment variable
- `superjolt env:get <key>` - Get an environment variable
- `superjolt env:unset <key>` - Remove an environment variable
- `superjolt env:push` - Push .env file to your application

### Logs

- `superjolt logs [service-id]` - View real-time logs for your application

### Other Commands

- `superjolt reset` - Delete ALL machines and services (DESTRUCTIVE - requires confirmation)
- `superjolt update` - Update CLI to the latest version
- `superjolt update --check` - Check for updates without installing
- `superjolt status` - Display CLI configuration, version, and stored data (aliases: `info`, `config`)
  - `--show-token` - Show full authentication token

## Configuration

The CLI stores authentication tokens securely using your system's keychain (keytar). If keychain access is unavailable, tokens are stored in `~/.config/superjolt/token`.

### Project Configuration

The CLI automatically creates a `.superjolt` file in your project root after the first deployment. This file tracks:

```json
{
  "serviceId": "clever-red-deer"
}
```

This allows the CLI to determine whether to update an existing deployment or create a new one.

### Deployment Ignore File (.superjoltignore)

You can create a `.superjoltignore` file in your project root to exclude specific files and directories from deployment. This file follows the same syntax as `.gitignore`.

<details>
<summary>View default exclusions and examples</summary>

#### Default Exclusions

The following patterns are always excluded from deployments:
- `node_modules/`
- `.git/`
- `dist/`
- `build/`
- `.env*`
- `*.log`
- `coverage/`
- `.nyc_output/`
- `.next/`
- `.nuxt/`
- `.cache/`
- `tmp/`
- `temp/`
- `.superjolt`

#### Custom Exclusions

Create a `.superjoltignore` file to add your own exclusion patterns:

```
# Ignore test files
**/*.test.js
**/*.spec.js
__tests__/

# Ignore development files
*.dev.js
.vscode/
.idea/

# Ignore specific directories
docs/
examples/

# Ignore large assets during development
videos/
*.mp4
```

The patterns in `.superjoltignore` are combined with the default exclusions, so you don't need to repeat them.

</details>

### Port Configuration

When your application is deployed on Superjolt, the server automatically provides the port number through the `PORT` environment variable. Your application should listen on this port to receive incoming requests.

```javascript
// Example for Node.js/Express
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```

This is similar to other PaaS platforms like Heroku - you don't choose the port, the platform assigns it dynamically. Always use `process.env.PORT` when available, with a fallback for local development.

## CI/CD Integration

Superjolt CLI supports authentication via environment variables for seamless CI/CD integration.

### Setting Up CI/CD Authentication

1. **Get your authentication token:**
   ```bash
   superjolt token --show
   ```

2. **Set the token as a secret in your CI/CD platform:**
   - **GitHub Actions**: Add as a repository secret named `SUPERJOLT_TOKEN`
   - **GitLab CI**: Add as a protected CI/CD variable
   - **CircleCI**: Add as an environment variable in project settings
   - **Other platforms**: Set `SUPERJOLT_TOKEN` as a secure environment variable

3. **Use in your CI/CD pipeline:**

#### GitHub Actions Example

```yaml
name: Deploy to Superjolt

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Deploy to Superjolt
        env:
          SUPERJOLT_TOKEN: ${{ secrets.SUPERJOLT_TOKEN }}
        run: npx superjolt deploy
```

#### GitLab CI Example

```yaml
deploy:
  stage: deploy
  image: node:18
  script:
    - npm ci
    - npx superjolt deploy
  only:
    - main
  variables:
    SUPERJOLT_TOKEN: $SUPERJOLT_TOKEN
```

#### Generic Script Example

```bash
#!/bin/bash
export SUPERJOLT_TOKEN="your-token-here"
npx superjolt deploy
```

### Security Best Practices

- **Never commit tokens to version control**
- Store tokens as encrypted secrets in your CI/CD platform
- Use different tokens for different environments (staging, production)
- Rotate tokens regularly
- Tokens provide full access to your Superjolt account - handle with care

### Environment Variable Authentication

When `SUPERJOLT_TOKEN` is set, the CLI will:
- Skip the browser-based login flow
- Use the token for all API requests
- Work in headless environments (CI/CD, containers)

You can verify the token source with:
```bash
superjolt status
```

## Examples

### Deploy a Node.js Application

```bash
# Navigate to your project
cd my-node-app

# Login to Superjolt
superjolt login

# Deploy
superjolt deploy

# Deploy with detailed build output
superjolt deploy --verbose
```

### Managing Environment Variables

```bash
# Set a single variable
superjolt env:set NODE_ENV production

# Push entire .env file
superjolt env:push

# List all variables
superjolt env:list
```

### Managing Custom Domains

```bash
# Add a custom domain (uses service ID from .superjolt file)
superjolt domain:add app.example.com

# Add to a specific service
superjolt domain:add app.example.com happy-blue-fox

# Add as primary domain
superjolt domain:add www.example.com --primary

# List all domains
superjolt domain:list

# Check domain status
superjolt domain:status app.example.com

# Remove a domain
superjolt domain:remove app.example.com
```

### Working with Machines

```bash
# Create a new machine
superjolt machine:create

# List all machines
superjolt machine:list

# Set default machine
superjolt machine:use happy-blue-fox
```

### AI-Powered Management with Claude

Once MCP is configured, you can use natural language:

```
You: "Show me all my running services"
Claude: [Lists all services with their status]

You: "Restart the API service and check its logs"
Claude: [Restarts service and shows recent logs]

You: "Set up environment variables for my database connection"
Claude: [Helps configure DATABASE_URL and related variables]
```

## Web Dashboard

Manage your deployments through our web interface at **[users.superjolt.com](https://users.superjolt.com)**:

- 📊 View deployment metrics and usage
- 🔧 Manage services and environment variables
- 📱 Monitor your applications in real-time
- 🚀 Access deployment logs and history

## Support

- **Dashboard**: https://users.superjolt.com
- **Documentation**: https://superjolt.com/docs
- **Issues**: https://github.com/scoritz/superjolt/issues
- **Discord**: https://superjolt.com/discord
- **Email**: support@superjolt.com

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT - see [LICENSE](LICENSE) for details.