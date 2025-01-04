# Automated Code Reviews using Sonnet 3.5

This GitHub Action leverages **Anthropic Sonnet 3.5** to perform automated code reviews, helping maintain high-quality codebases by providing insightful feedback directly within your Pull Requests. This Action can be configured to run on every PR or trigger based on specific labels.

---

## 🚀 Features

1. **Automated Code Review**: Reviews code changes in PRs, highlighting potential improvements and issues.
2. **Customizable Triggers**: Run reviews on every PR or when specific labels are applied.
3. **File Exclusion**: Optionally exclude files (e.g., configuration files, documentation) using wildcard expressions.
4. **Seamless Integration**: Works effortlessly with GitHub workflows and supports the latest Anthropic API.

---

## 🔧 Prerequisites

1. **Anthropic API Key**:  
   Sign up at [Anthropic](https://www.anthropic.com) and obtain an API Key.
2. **GitHub Secrets**:  
   Add the API Key as a secret in your repository:
   - Go to **Settings > Secrets and variables > Actions**.
   - Click **New repository secret** and name it `ANTHROPIC_API_KEY`.

---

## ⚙️ Usage

Here’s how you can set up the Action in your repository:

### 1. Code Review on Every Pull Request

Create a workflow file (e.g., `.github/workflows/code-review.yml`) with the following content:

```yaml
name: 'Code Review'

on: 
  pull_request: # Trigger on pull requests

jobs:
  code-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: arpitgandhi9/creview@v0.3
        env:
          NODE_OPTIONS: '--experimental-fetch'
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          exclude_files: '*.json, *.md, *.yml' # Optional: Exclude files from the review
```

---

### 2. Trigger Code Review on Labeled Pull Requests

To trigger the review only when a specific label (e.g., `AUTO`) is added to a PR, use the following workflow configuration:

```yaml
name: 'Code Review on Labeled PRs'

on: 
  pull_request:
    types: [labeled] # Trigger when a label is added

jobs:
  code-review:
    if: ${{ contains(github.event.label.name, 'AUTO') }}
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: arpitgandhi9/creview@v0.3
        env:
          NODE_OPTIONS: '--experimental-fetch'
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          exclude_files: '*.json, *.md, *.yml' # Optional: Exclude files from the review
```

---

## ⚙️ Configuration Options

### `exclude_files`  
Exclude specific files from being reviewed using a wildcard pattern.  
Example:  
- `*.md` excludes Markdown files.  
- `config/*.json` excludes JSON files in the `config` directory.  

### GitHub Secrets:
- `GITHUB_TOKEN`: Default token provided by GitHub for accessing the repository.
- `ANTHROPIC_API_KEY`: Your Anthropic API Key.

---

## 💡 Tips

- **Fine-tune the Review Scope**: Adjust the `exclude_files` pattern to prevent unnecessary reviews on non-critical files.
- **Optimize Workflow**: Use label-based triggers to control when reviews occur, saving computational resources.

---

## 📘 Learn More

- **Anthropic Sonnet API Documentation**: [Visit Anthropic](https://www.anthropic.com)
- **GitHub Actions Documentation**: [Learn more](https://docs.github.com/en/actions)

---

Elevate your code quality with automated, intelligent reviews using Sonnet 3.5! 🚀