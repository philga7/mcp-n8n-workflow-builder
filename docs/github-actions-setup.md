# GitHub Actions Setup for Semantic Versioning

This document explains how to configure GitHub Actions for automated semantic versioning and release management using semantic-release.

## Required GitHub Secrets

To enable semantic versioning and automated releases, you need to configure the following secrets in your GitHub repository:

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

### 3. How to Get NPM Token (Optional)

If you plan to publish to npm:

1. Log into your npm account
2. Go to **Access Tokens**
3. Click **Generate New Token**
4. Select **Automation** token type
5. Copy the generated token

## Semantic Versioning Process

The GitHub Actions workflow will:

1. **Trigger**: Run on every push to the `main` branch
2. **Analyze**: Parse commit messages to determine version bump
3. **Release**: Generate new version and changelog using semantic-release
4. **Tag**: Create GitHub release with version tag

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

The semantic-release configuration expects the following structure:

```
project/
├── .github/workflows/deploy.yml  # GitHub Actions workflow
├── release.config.js             # Semantic-release configuration
├── package.json                  # Project metadata
└── CHANGELOG.md                  # Generated changelog
```

## Testing the Release Process

To test the semantic-release process locally:

```bash
# Test semantic-release configuration
npm run release:dry-run

# Check version without creating release
npm run version:check
```

## Troubleshooting

### Common Issues

1. **No Release Created**: Check that commits follow conventional format
2. **Version Conflicts**: Verify no existing tags for the version
3. **Authentication Errors**: Ensure GitHub token has proper permissions

### Debug Mode

To enable debug logging, add this to your workflow:

```yaml
- name: Release
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    DEBUG: "semantic-release:*"
  run: npx semantic-release
```

## Security Considerations

- Never commit tokens to the repository
- Use repository secrets for all sensitive data
- Regularly rotate your npm tokens
- Limit token permissions to only what's necessary

## Related Files

- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `release.config.js` - Semantic-release configuration
- `package.json` - Project metadata and scripts
