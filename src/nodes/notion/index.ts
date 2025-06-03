import WorkflowCaller from "./WorkflowCaller";
import CategoryParser from "./CategoryParser";
import TitleGenerator from "./TitleGenerator";
import MarkdownToNotionConverter from "./MarkdownToNotionConverter";
import NotionPageCreator from "./NotionPageCreator";
import ResponseFormatter from "./ResponseFormatter";
import NotionDatabaseSchema from "./NotionDatabaseSchema";
import UserPromptComposer from "./UserPromptComposer";
import CategorySelectionHandler from "./CategorySelectionHandler";
import DatabaseDiscovery from "./DatabaseDiscovery";
import EnhancedNotionPageCreator from "./EnhancedNotionPageCreator";

const NotionNodes = {
  "workflow-caller": new WorkflowCaller(),
  "category-parser": new CategoryParser(),
  "title-generator": new TitleGenerator(),
  "markdown-to-notion-converter": new MarkdownToNotionConverter(),
  "notion-page-creator": new NotionPageCreator(),
  "response-formatter": new ResponseFormatter(),
  "notion-database-schema": new NotionDatabaseSchema(),
  "user-prompt-composer": new UserPromptComposer(),
  "category-selection-handler": new CategorySelectionHandler(),
  "database-discovery": new DatabaseDiscovery(),
  "enhanced-notion-page-creator": new EnhancedNotionPageCreator(),
};

export default NotionNodes; 