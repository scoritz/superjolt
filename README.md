<div align="center">
  <img src="https://superjolt.com/superjolt-logo.svg" alt="Superjolt Logo" width="120" height="120">
  
  # Superjolt CLI (Beta)
  
  [![npm version](https://img.shields.io/npm/v/superjolt.svg)](https://www.npmjs.com/package/superjolt)
  [![npm downloads](https://img.shields.io/npm/dw/superjolt.svg)](https://www.npmjs.com/package/superjolt)
  [![Tests](https://github.com/scoritz/superjolt/actions/workflows/test.yml/badge.svg)](https://github.com/scoritz/superjolt/actions/workflows/test.yml)
  [![codecov](https://codecov.io/gh/scoritz/superjolt/graph/badge.svg)](https://codecov.io/gh/scoritz/superjolt)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289DA)](https://superjolt.com/discord)
  
  Official command-line interface for [Superjolt](https://superjolt.com) - The fastest way to deploy JavaScript applications.
</div>

> ⚡ **Beta Release**: We're actively improving Superjolt based on your feedback. Join our [Discord](https://superjolt.com/discord) to share your experience!
> 
> During beta, the CLI will automatically check for critical updates to ensure compatibility with our evolving API.

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

## Quick Start

From your JavaScript framework project folder, run:

```bash
npx superjolt deploy
```

That's it! The CLI will guide you through authentication and deployment.

## Commands

### Authentication

- `superjolt login` - Authenticate with your Superjolt account
- `superjolt logout` - Log out from your account
- `superjolt me` - Display current user information

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

## Configuration

The CLI stores authentication tokens securely using your system's keychain (keytar). If keychain access is unavailable, tokens are stored in `~/.config/superjolt/token`.


## Project Configuration

The CLI automatically creates a `.superjolt` file in your project root after the first deployment. This file tracks:

```json
{
  "serviceId": "clever-red-deer"
}
```

This allows the CLI to determine whether to update an existing deployment or create a new one.

## Deployment Ignore File (.superjoltignore)

You can create a `.superjoltignore` file in your project root to exclude specific files and directories from deployment. This file follows the same syntax as `.gitignore`.

### Default Exclusions

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

### Custom Exclusions

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

## Port Configuration

When your application is deployed on Superjolt, the server automatically provides the port number through the `PORT` environment variable. Your application should listen on this port to receive incoming requests.

```javascript
// Example for Node.js/Express
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```

This is similar to other PaaS platforms like Heroku - you don't choose the port, the platform assigns it dynamically. Always use `process.env.PORT` when available, with a fallback for local development.

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

### Working with Machines

```bash
# Create a new machine
superjolt machine:create

# List all machines
superjolt machine:list

# Set default machine
superjolt machine:use happy-blue-fox
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

## MCP (Model Context Protocol) Server

Superjolt includes an integrated MCP server that allows AI assistants like Claude to interact with your deployments directly.

### Requirements

- **Node.js 16 or later is required** (The MCP server uses modern JavaScript features not available in older versions)
- If you have multiple Node versions installed, ensure Node 16+ is the default or remove older versions

### Setup

1. Install Superjolt CLI (includes MCP server):
   ```bash
   npm install -g superjolt
   ```

2. Authenticate with Superjolt:
   ```bash
   superjolt login
   ```

3. Add to Claude Desktop configuration:
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

4. Restart Claude Desktop

### Available MCP Tools

#### Authentication
- `check_auth` - Check if authenticated with Superjolt
- `get_current_user` - Get current user information

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

#### Logs
- `get_logs` - Get logs for a service

### Troubleshooting

**Node.js version errors**: If you see `Unexpected token '??='` errors, Claude Desktop is using an old Node.js version. This often happens when:
- Claude Desktop was launched before you switched Node versions with nvm
- Your system's default `node` is older than v16

Solutions:
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

### Example Usage

Once configured, you can ask Claude to:

**Machine Management:**
- "Create a new machine"
- "List all my machines"
- "Set machine happy-blue-fox as default"
- "Rename machine old-name to production-server"
- "Delete machine test-machine"

**Service Management:**
- "List all my services"
- "Show services on machine production-server"
- "Start service my-api"
- "Stop the database service"
- "Restart my web app"
- "Rename service old-api to new-api"

**Environment Variables:**
- "List environment variables for my-service"
- "Set DATABASE_URL for my API service"
- "Get the API_KEY value for my service"
- "Delete the OLD_VAR environment variable"
- "Push my .env file to the service"

**Logs:**
- "Show me the logs for my API service"
- "Get the last 50 log lines for my-app"

**Authentication:**
- "Check if I'm authenticated with Superjolt"
- "Show my Superjolt user info"

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT - see [LICENSE](LICENSE) for details.