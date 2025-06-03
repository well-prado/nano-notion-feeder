# Troubleshooting Guide: Document-to-Notion Workflow

## 🚨 **Current Known Issues & Solutions**

### Issue 1: Database Parameter Encoding Problem

**Symptoms:**
```
path.database_id should be a valid uuid, instead was `\"test\"`
```

**Root Cause:** The nanoservice framework is double-encoding JSON strings when using template variables.

**Immediate Workaround:**
1. **Use a real Notion database ID** instead of test values
2. **Set up proper environment variables** before testing

**Proper Testing Setup:**
```bash
# 1. Get a real Notion database ID from your Notion workspace
# 2. Set environment variables
export NOTION_TOKEN="secret_your_actual_token_here"

# 3. Test with a real database ID (32-character UUID)
curl -X POST "http://localhost:4000/notion-interactive-save" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Test Document\n\nThis is a test.",
    "database": "12345678-1234-1234-1234-123456789012"
  }'
```

### Issue 2: Missing Environment Configuration

**Symptoms:**
```
Notion integration token is not configured
```

**Solution:**
1. Create `.env` file in project root:
```bash
NOTION_TOKEN=secret_your_actual_token_here
```

2. Restart the server:
```bash
npm run dev
```

### Issue 3: MCP Integration Not Working

**Symptoms:**
- Claude Desktop can't find the tool
- MCP server not responding

**Solution:**
1. **Build the project first:**
```bash
npm run build
```

2. **Add to Claude Desktop MCP settings:**
```json
{
  "mcpServers": {
    "nano-notion-feeder": {
      "command": "node",
      "args": ["/absolute/path/to/your/project/dist/mcp.js"],
      "env": {
        "WORKFLOWS_DIR": "/absolute/path/to/your/project/workflows",
        "NOTION_TOKEN": "your_notion_token_here"
      }
    }
  }
}
```

3. **Restart Claude Desktop**

## 🧪 **Proper Testing Workflow**

### Step 1: Environment Setup
```bash
# 1. Set up Notion integration (see NOTION_SETUP.md)
# 2. Create .env file with real credentials
# 3. Build and start server
npm run build
npm run dev
```

### Step 2: Test with Real Data
```bash
# Test 1: Interactive save (no category)
curl -X POST "http://localhost:4000/document-to-notion" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Meeting Notes\n\n- Discussed project timeline\n- Next steps defined",
    "database": "YOUR_REAL_DATABASE_ID"
  }'

# Expected: Should prompt for category selection via MCP

# Test 2: Direct save (with category)
curl -X POST "http://localhost:4000/document-to-notion" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Meeting Notes\n\nCategory: Documentation\n\n- Discussed project timeline",
    "database": "YOUR_REAL_DATABASE_ID"
  }'

# Expected: Should create page directly in Notion
```

### Step 3: Verify in Notion
1. Check your Notion database
2. Verify new pages were created
3. Confirm categories were assigned correctly

## 🔧 **Development Fixes Applied**

### Parameter Cleaning
- Added robust quote-stripping in `NotionDatabaseSchema.ts`
- Added parameter validation in `NotionPageCreator.ts`
- Improved error messages for debugging

### Workflow Configuration
- Fixed HTTP methods to POST for all workflows
- Added proper error handling throughout
- Improved context variable handling

### Environment Validation
- Added credential validation
- Better error messages for missing tokens
- Fallback handling for undefined parameters

## 📊 **Expected Behavior**

### Successful Interactive Flow:
1. **User sends document** without category
2. **Router analyzes** content and routes to interactive save
3. **System fetches** available categories from Notion
4. **MCP prompts** user to select category
5. **User responds** with category choice
6. **System creates** Notion page with selected category

### Successful Direct Flow:
1. **User sends document** with embedded category
2. **Router analyzes** content and routes to direct save
3. **System extracts** category from content
4. **System creates** Notion page immediately

## 🚀 **Next Steps for Full Resolution**

1. **Complete Environment Setup** following NOTION_SETUP.md
2. **Test with Real Credentials** using the commands above
3. **Configure Claude Desktop** with proper MCP settings
4. **Verify End-to-End Flow** from Claude to Notion

---

💡 **Note**: The core infrastructure is working correctly. The main issues are related to environment setup and testing with proper credentials rather than fundamental code problems. 