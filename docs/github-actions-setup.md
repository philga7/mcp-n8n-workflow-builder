# GitHub Actions Setup for n8n Workflow Deployment and Semantic Versioning

This document explains how to configure GitHub Actions for automated n8n workflow deployments to `n8n.informedcrew.com` and semantic versioning using semantic-release.

## Required GitHub Secrets

To enable automated workflow deployments and semantic versioning, you need to configure the following secrets in your GitHub repository:

### 1. Navigate to Repository Settings

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**

### 2. Add Required Secrets

Add the following secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `GITHUB_TOKEN` | Automatically provided by GitHub Actions | `${{ secrets.GITHUB_TOKEN }}` |
| `NPM_TOKEN` | Your npm token (if publishing to npm) | `your-npm-token-here` |
| `N8N_API_URL` | The n8n instance URL | `https://n8n.informedcrew.com` |
| `N8N_API_KEY` | Your n8n API key | `your-api-key-here` |
| `N8N_WORKFLOW_ID` | The ID of the workflow to update | `12345678-1234-1234-1234-123456789012` |

### 3. How to Get NPM Token (Optional)

If you plan to publish to npm:

1. Log into your npm account
2. Go to **Access Tokens**
3. Click **Generate New Token**
4. Select **Automation** token type
5. Copy the generated token

### 4. How to Get n8n API Key

1. Log into your n8n instance at `https://n8n.informedcrew.com`
2. Go to **Settings** → **API`
3. Click **Create API Key**
4. Give it a name (e.g., "GitHub Actions Deployment")
5. Copy the generated API key

### 5. How to Get Workflow ID

1. Open the workflow you want to deploy in n8n
2. Look at the URL: `https://n8n.informedcrew.com/workflow/12345678-1234-1234-1234-123456789012`
3. The last part is your workflow ID: `12345678-1234-1234-1234-123456789012`

## Workflow Deployment and Semantic Versioning Process

The GitHub Actions workflow will:

1. **Trigger**: Run on every push to the `main` branch
2. **Deploy**: Update the specified workflow in n8n using the API
3. **Analyze**: Parse commit messages to determine version bump
4. **Release**: Generate new version and changelog using semantic-release
5. **Tag**: Create GitHub release with version tag

## Commit Message Format

All commits must follow the conventional commits format:

```bash
# For new features (minor version bump)
git commit -m "feat: add new workflow functionality"

# For bug fixes (patch version bump)
git commit -m "fix: resolve authentication error"

# For breaking changes (major version bump)
git commit -m "feat!: breaking change in API"

# For workflow-specific changes
git commit -m "workflow-feat: add new integration workflow"
git commit -m "workflow-fix: resolve workflow error"
```

## Project Structure

The deployment and semantic-release configuration expects the following structure:

```
project/
├── .github/workflows/deploy.yml  # GitHub Actions workflow
├── release.config.js             # Semantic-release configuration
├── package.json                  # Project metadata
├── scripts/deploy-workflow.js    # Deployment script
├── workflows/                    # Directory containing workflow JSON files
│   ├── cipher-weaviate-integration.json
│   └── other-workflows.json
└── CHANGELOG.md                  # Generated changelog
```

## Testing the Process

To test the deployment and semantic-release process locally:

```bash
# Test deployment
export N8N_API_URL="https://n8n.informedcrew.com"
export N8N_API_KEY="your-api-key"
export N8N_WORKFLOW_ID="your-workflow-id"
npm run deploy:workflow

# Test semantic-release configuration
npm run release:dry-run

# Check version without creating release
npm run version:check
```
```

## Troubleshooting

### Common Issues

1. **No Release Created**: Check that commits follow conventional format
2. **Version Conflicts**: Verify no existing tags for the version
3. **Authentication Errors**: Ensure GitHub token has proper permissions
4. **401 Unauthorized**: Check your `N8N_API_KEY` is correct
5. **404 Not Found**: Verify the `N8N_WORKFLOW_ID` exists
6. **Network Error**: Ensure `N8N_API_URL` is accessible

### Debug Mode

To enable debug logging, add this to your workflow:

```yaml
- name: Deploy to n8n
  env:
    N8N_API_URL: ${{ secrets.N8N_API_URL }}
    N8N_API_KEY: ${{ secrets.N8N_API_KEY }}
    N8N_WORKFLOW_ID: ${{ secrets.N8N_WORKFLOW_ID }}
    DEBUG: "true"
  run: |
    npm run deploy:workflow

- name: Release
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    DEBUG: "semantic-release:*"
  run: npx semantic-release
```

## Security Considerations

- Never commit tokens or API keys to the repository
- Use repository secrets for all sensitive data
- Regularly rotate your npm tokens and n8n API keys
- Limit token and API key permissions to only what's necessary

## Related Files

- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `release.config.js` - Semantic-release configuration
- `package.json` - Project metadata and scripts
- `scripts/deploy-workflow.js` - Deployment script
- `workflows/` - Directory containing workflow JSON files
