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

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT - see [LICENSE](LICENSE) for details.