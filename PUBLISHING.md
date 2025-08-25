# Automated Workflow Deployment and MCP-Based Management

This guide provides instructions for the automated deployment of n8n workflows to `n8n.informedcrew.com` using semantic versioning, GitHub Actions, and MCP (Model Context Protocol) tools for interactive management.

## Prerequisites

Before deploying workflows, make sure you have:

1. Access to n8n.informedcrew.com with API permissions
2. GitHub repository with configured secrets
3. MCP server configured with n8n-workflow-builder (for interactive management)
4. Properly configured package.json with semantic versioning
5. All changes committed to git using conventional commits

## Deployment and Management Process

### 1. Configure GitHub Secrets

Set up the following secrets in your GitHub repository:

- `N8N_API_URL`: The n8n instance URL (e.g., `https://n8n.informedcrew.com`)
- `N8N_API_KEY`: Your n8n API key
- `N8N_WORKFLOW_ID`: The ID of the workflow to update

### 2. Configure MCP Server (Optional)

For interactive workflow management, set up the n8n-workflow-builder MCP server:

```json
{
  "n8n-workflow-builder": {
    "command": "node",
    "args": ["path/to/your/project/build/index.js"],
    "env": {
      "N8N_HOST": "https://n8n.informedcrew.com/api/v1/",
      "N8N_API_KEY": "your_n8n_api_key_here",
      "MCP_PORT": "3456"
    },
    "disabled": false,
    "alwaysAllow": [
      "list_workflows",
      "get_workflow",
      "list_executions",
      "get_execution"
    ],
    "autoApprove": [
      "create_workflow",
      "update_workflow",
      "activate_workflow",
      "deactivate_workflow",
      "delete_workflow",
      "delete_execution"
    ]
  }
}
```

### 2. Commit Changes Using Conventional Commits

All commits must follow the conventional commits format:

```bash
# For new workflow features
git commit -m "workflow-feat: add new integration workflow"

# For workflow bug fixes
git commit -m "workflow-fix: resolve authentication error"

# For workflow improvements
git commit -m "workflow-refactor: optimize search performance"
```

### 3. Push to Main Branch

Push your changes to the main branch to trigger automated deployment and semantic versioning:

```bash
git push origin main
```

### 4. Automated Deployment and Release Process

The GitHub Actions workflow will automatically:

1. **Build and Test**: Compile the project and run tests
2. **Deploy Workflow**: Update the workflow in n8n.informedcrew.com
3. **Create Release**: Generate new version and changelog using semantic-release
4. **Tag Release**: Create GitHub release with version tag

### 5. Verify Deployment and Manage Workflows

After deployment, verify that the workflow is updated in n8n:

1. Log into n8n.informedcrew.com
2. Navigate to the updated workflow
3. Check that changes are reflected
4. Test the workflow functionality

### 6. MCP-Based Workflow Management (Optional)

Use MCP tools to manage workflows interactively:

- **List workflows**: View all available workflows
- **Create workflow**: Build new workflows from templates
- **Update workflow**: Modify existing workflows
- **Activate/Deactivate**: Control workflow execution
- **Execute workflow**: Manually trigger workflow runs

## Troubleshooting

### Deployment Failures

If deployment fails, check the following:

1. **GitHub Secrets Configuration**
   - Verify all required secrets are set
   - Check that API keys are valid and not expired
   - Ensure workflow ID exists in n8n

2. **MCP Connection Issues**

If MCP tools are not working:

1. **Check MCP Server Configuration**
   - Verify the server is running on the correct port
   - Ensure API credentials are correct
   - Check that the server is accessible

3. **Authentication Errors**
   ```bash
   # Test API access manually
   curl -H "X-N8N-API-KEY: your-api-key" \
        https://n8n.informedcrew.com/api/v1/workflows
   ```

3. **Workflow Validation Errors**
   - Check workflow JSON syntax
   - Verify node configurations
   - Ensure all required parameters are set

### Version Conflicts

If you encounter version conflicts:

1. **Check existing tags**
   ```bash
   git tag --list
   ```

2. **Verify commit history**
   ```bash
   git log --oneline
   ```

3. **Reset semantic-release if needed**
   ```bash
   npm run release:dry-run
   ```

## Manual Deployment and Workflow Management

For emergency deployments or testing:

```bash
# Set environment variables
export N8N_API_URL="https://n8n.informedcrew.com"
export N8N_API_KEY="your-api-key"
export N8N_WORKFLOW_ID="your-workflow-id"

# Deploy workflow
npm run deploy:workflow
```

For direct workflow management using MCP tools:

```bash
# Start the MCP server
npm run start

# Use MCP tools through your IDE or CLI
# - list_workflows: View all workflows
# - create_workflow: Create new workflow
# - update_workflow: Modify existing workflow
# - activate_workflow: Enable workflow execution
```

## Future Updates

To update workflows in the future:

1. Make your workflow changes
2. Commit using conventional commits format
3. Push to main branch
4. Automated deployment will handle the rest
5. Use MCP tools for additional workflow management as needed
