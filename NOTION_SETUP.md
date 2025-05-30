# Notion Integration Setup Guide

This guide will help you set up the Document-to-Notion Knowledge Base workflow with your Notion workspace.

## Prerequisites

- A Notion account with workspace access
- A Notion database with a "Category" property (select or multi-select type)
- Node.js and npm installed

## Step 1: Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Fill in the integration details:
   - **Name**: `Nano Notion Feeder` (or your preferred name)
   - **Logo**: Optional
   - **Associated workspace**: Select your workspace
4. Click "Submit"
5. Copy the **Internal Integration Token** (starts with `secret_`)

## Step 2: Set Up Your Notion Database

### Create a Database (if you don't have one)

1. In Notion, create a new page
2. Add a database (Table, Board, or any view)
3. Name it something like "Knowledge Base" or "Documents"

### Configure Database Properties

Your database needs at least these properties:
- **Title** (automatically created)
- **Category** (select or multi-select type)

To add the Category property:
1. Click the "+" button in your database header
2. Choose "Select" or "Multi-select"
3. Name it "Category"
4. Add some initial options like:
   - Research
   - Notes
   - Documentation
   - Ideas
   - Projects

### Share Database with Integration

1. Open your database in Notion
2. Click the "Share" button (top right)
3. Click "Invite" and search for your integration name
4. Select your integration and click "Invite"

## Step 3: Get Your Database ID

1. Open your database in Notion
2. Copy the URL from your browser
3. The database ID is the long string between the last `/` and the `?`

Example URL:
```
https://www.notion.so/workspace/My-Database-abc123def456ghi789jkl012mno345pqr?v=...
```
Database ID: `abc123def456ghi789jkl012mno345pqr`

## Step 4: Configure Environment Variables

Create a `.env` file in your project root with:

```bash
# Nanoservice Configuration
PORT=4000
NODE_ENV=development
PROJECT_NAME=nano-notion-feeder
PROJECT_VERSION=1.0.0
NANOSERVICE_BASE_URL=http://localhost:4000

# Notion Integration Configuration
NOTION_TOKEN=secret_your_actual_token_here
NOTION_DEFAULT_DATABASE_ID=your_actual_database_id_here
NOTION_API_VERSION=2022-06-28
```

Replace:
- `secret_your_actual_token_here` with your integration token from Step 1
- `your_actual_database_id_here` with your database ID from Step 3

## Step 5: Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test with a simple document:
   ```bash
   curl -X POST http://localhost:4000/document-to-notion \
     -H "Content-Type: application/json" \
     -d '{
       "content": "# Test Document\n\nThis is a test document for our Notion integration.\n\n## Features\n- Markdown support\n- Category assignment\n- Automatic title generation",
       "database": ""
     }'
   ```

3. If no category is provided, you should see a prompt asking you to select a category.

4. Test with a category:
   ```bash
   curl -X POST http://localhost:4000/document-to-notion \
     -H "Content-Type: application/json" \
     -d '{
       "content": "Category: Research\n\n# Test Document\n\nThis document has an embedded category.",
       "database": ""
     }'
   ```

## Step 6: MCP Integration with Claude Desktop

### Install MCP Server

1. Add to your Claude Desktop configuration:
   ```json
   {
     "mcpServers": {
       "nano-notion-feeder": {
         "command": "node",
         "args": ["path/to/your/project/dist/mcp-entry.js"],
         "env": {
           "NOTION_TOKEN": "secret_your_actual_token_here",
           "NOTION_DEFAULT_DATABASE_ID": "your_actual_database_id_here"
         }
       }
     }
   }
   ```

2. Restart Claude Desktop

3. Test by asking Claude to save a document to Notion

## Troubleshooting

### Common Issues

**401 Unauthorized Error**
- Check that your `NOTION_TOKEN` is correct
- Ensure the integration has access to your database

**Database Not Found Error**
- Verify your `NOTION_DEFAULT_DATABASE_ID` is correct
- Make sure the integration is shared with your database

**Category Property Not Found**
- Ensure your database has a "Category" property
- The property should be of type "Select" or "Multi-select"

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

Check the logs in the `logs/` directory for detailed error information.

## Workflow Features

### Automatic Category Detection
- Documents with `Category: Name` at the top are automatically categorized
- Documents without categories trigger an interactive prompt

### Markdown Support
- Headings (H1, H2, H3)
- Paragraphs and text formatting
- Code blocks with syntax highlighting
- Blockquotes
- Bulleted and numbered lists

### Title Generation
- Uses H1 heading if present
- Falls back to first line of content
- Generates timestamp-based title as last resort

### Error Handling
- Comprehensive error messages
- Graceful fallbacks for missing data
- User-friendly success confirmations

## API Endpoints

- `POST /document-to-notion` - Main workflow entry point
- `POST /notion-direct-save` - Direct save with category
- `POST /notion-interactive-save` - Interactive category selection
- `GET /health-check` - Server health status

## Support

For issues or questions:
1. Check the logs in `logs/mcp-entry.log`
2. Verify your Notion integration permissions
3. Test with simple documents first
4. Ensure all environment variables are set correctly 