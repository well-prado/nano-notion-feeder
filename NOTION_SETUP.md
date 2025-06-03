# Notion Integration Setup Guide

This guide helps you set up the Document-to-Notion Knowledge Base Nanoservice Workflow.

## 📋 **Prerequisites**

1. ✅ **Running Nanoservice** (localhost:4000)
2. 🔧 **Notion Integration Token**
3. 🗃️ **Target Notion Database**

## 🚀 **Quick Setup**

### Step 1: Get Notion Integration Token

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Name it: `Knowledge Base Feeder`
4. Select your workspace
5. Copy the **Internal Integration Token**

### Step 2: Prepare Your Notion Database

1. Create a new database in Notion
2. Add these properties:
   - **Title** (Title) - Already exists
   - **Category** (Select) - Add options like: `Meeting Notes`, `Documentation`, `Ideas`, etc.
3. Copy the database ID from the URL:
   ```
   https://notion.so/workspace/DATABASE_ID?v=...
                              ^^^^^^^^^^
   ```

### Step 3: Share Database with Integration

1. In your Notion database, click **"Share"**
2. Click **"Invite"** 
3. Find your integration: `Knowledge Base Feeder`
4. Click **"Invite"**

### Step 4: Configure Environment

Create a `.env` file in your project root:

```bash
# Required
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional (for testing)
NOTION_DEFAULT_DATABASE_ID=your-database-id-here
```

## 🧪 **Testing Your Setup**

### Test 1: Check MCP Server Status
```bash
curl http://localhost:4000/auto-mcp-server/tools
```
**Expected**: Should list tools including `document-to-notion`

### Test 2: Test Database Schema Fetch
```bash
curl -X POST http://localhost:4000/notion-interactive-save \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Test Document\n\nThis is a test.",
    "database": "YOUR_DATABASE_ID_HERE"
  }'
```
**Expected**: Should return category selection prompt

### Test 3: Test Direct Save (with category)
```bash
curl -X POST http://localhost:4000/notion-direct-save \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Test Document\n\nCategory: Meeting Notes\n\nThis is a test document.",
    "database": "YOUR_DATABASE_ID_HERE"
  }'
```
**Expected**: Should create a new page in Notion

### Test 4: Test Main Router
```bash
curl -X POST http://localhost:4000/document-to-notion \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Test Document\n\nThis is a test document.",
    "database": "YOUR_DATABASE_ID_HERE"
  }'
```
**Expected**: Should route to interactive save and prompt for category

## 🐛 **Troubleshooting**

### Common Error: "Database ID is required and must be a valid UUID"
- **Cause**: Missing or invalid database parameter
- **Fix**: Ensure you're passing a valid Notion database ID

### Common Error: "Notion integration token is not configured"
- **Cause**: Missing NOTION_TOKEN environment variable
- **Fix**: Add `NOTION_TOKEN=your_token` to `.env` file

### Common Error: "object_not_found"
- **Cause**: Integration doesn't have access to the database
- **Fix**: Share the database with your integration (Step 3 above)

### Common Error: "validation_error: path.database_id should be a valid uuid"
- **Cause**: Database ID format is incorrect
- **Fix**: Use the database ID from the Notion URL (32 characters, no dashes in middle)

## 📡 **Claude Desktop Integration**

Once working, add to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "nano-notion-feeder": {
      "command": "node",
      "args": ["/path/to/your/project/dist/mcp.js"],
      "env": {
        "WORKFLOWS_DIR": "/path/to/your/project/workflows",
        "NOTION_TOKEN": "your_notion_token_here"
      }
    }
  }
}
```

## 🎯 **Usage Examples**

### Direct Save (with embedded category)
```
Content: "# Meeting Notes\n\nCategory: Meeting Notes\n\n- Discussed project timeline\n- Next steps defined"
```

### Interactive Save (prompts for category)
```
Content: "# Project Ideas\n\n- Feature A\n- Feature B\n- Feature C"
```

## 📊 **Expected Workflow Behavior**

1. **Router Analysis**: Checks if content has embedded category
2. **Direct Path**: If category found → Creates page immediately  
3. **Interactive Path**: If no category → Prompts user via MCP
4. **Category Selection**: User chooses from available database options
5. **Page Creation**: Saves formatted content to Notion with metadata

---

💡 **Need Help?** Check the server logs at `logs.txt` or run with debug mode enabled. 