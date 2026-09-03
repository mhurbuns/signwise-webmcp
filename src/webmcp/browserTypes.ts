export interface WebMcpTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute(input: Record<string, unknown>, options: { signal: AbortSignal }): Promise<unknown>;
}

export interface WebMcpModelContext {
  registerTool(tool: WebMcpTool, options?: { signal?: AbortSignal }): Promise<void> | void;
  getTools(): Promise<Array<Omit<WebMcpTool, "execute">>>;
  executeTool?(tool: Omit<WebMcpTool, "execute">, input: string, options?: { signal?: AbortSignal }): Promise<string>;
}

declare global {
  interface Document { modelContext?: WebMcpModelContext }
}
