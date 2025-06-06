import ApiCall from "@nanoservice-ts/api-call";
import IfElse from "@nanoservice-ts/if-else";
import type { NodeBase } from "@nanoservice-ts/shared";
import AnalyticsNodes from "./nodes/analytics";
import NotionNodes from "./nodes/notion";
import ExampleNodes from "./nodes/examples";

const nodes: {
	[key: string]: NodeBase;
} = {
	"@nanoservice-ts/api-call": new ApiCall(),
	"@nanoservice-ts/if-else": new IfElse(),
	...ExampleNodes,
	...AnalyticsNodes,
	...NotionNodes,
};

export default nodes;
