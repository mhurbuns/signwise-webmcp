import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (location.search.includes("no-webmcp")) return;
    const registered = new Map<string, { name: string; title?: string; description: string; inputSchema: Record<string, unknown>; annotations?: Record<string, boolean>; execute(input: Record<string, unknown>, options: { signal: AbortSignal }): Promise<unknown> }>();
    const trace: string[] = [];
    const modelContext = {
      async registerTool(tool: (typeof registered extends Map<string, infer T> ? T : never), options?: { signal?: AbortSignal }) {
        if (registered.has(tool.name)) throw new DOMException("Duplicate tool", "InvalidStateError");
        registered.set(tool.name, tool);
        options?.signal?.addEventListener("abort", () => registered.delete(tool.name), { once: true });
      },
      async getTools() { return [...registered.values()].sort((a, b) => a.name.localeCompare(b.name)).map((tool) => ({ name: tool.name, title: tool.title, description: tool.description, inputSchema: tool.inputSchema, annotations: tool.annotations })); },
      async executeTool(tool: { name: string }, input: string) {
        const implementation = registered.get(tool.name);
        if (!implementation) throw new Error(`Tool not found: ${tool.name}`);
        trace.push(tool.name);
        return JSON.stringify(await implementation.execute(JSON.parse(input), { signal: new AbortController().signal }));
      },
    };
    Object.defineProperty(document, "modelContext", { configurable: true, value: modelContext });
    Object.defineProperty(window, "__webMcpTrace", { configurable: true, value: trace });
  });
});

async function toolNames(page: import("@playwright/test").Page) {
  return page.evaluate(async () => (await document.modelContext!.getTools()).map(({ name }) => name));
}

async function execute(page: import("@playwright/test").Page, name: string, input: Record<string, unknown> = {}) {
  return page.evaluate(async ({ name, input }) => {
    const context = document.modelContext!;
    const tool = (await context.getTools()).find((candidate) => candidate.name === name);
    if (!tool || !context.executeTool) throw new Error(`Tool not found: ${name}`);
    return JSON.parse(await context.executeTool(tool, JSON.stringify(input)));
  }, { name, input });
}

test("agent reviews the live agreement through an exact human approval gate", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".integration-status")).toContainText("4 tools");
  await expect(page.locator(".paper")).toHaveCount(12);
  await expect(page.locator('[data-page="1"]')).toContainText("Page 1 of 12");
  await expect(page.locator('[data-page="12"]')).toContainText("Page 12 of 12");
  expect(await toolNames(page)).toEqual(["get_agreement", "get_review_workspace", "list_clauses", "read_clause"]);

  await page.getByRole("button", { name: /Open review workspace/ }).click();
  await expect(page.locator(".integration-status")).toContainText("6 tools");
  await execute(page, "get_review_workspace");
  await execute(page, "get_agreement");
  await execute(page, "list_clauses");
  await execute(page, "read_clause", { clauseId: "renewal" });
  await execute(page, "read_clause", { clauseId: "indemnity" });
  await execute(page, "read_clause", { clauseId: "liability" });
  const flagged = await execute(page, "flag_clause", { clauseId: "indemnity", severity: "critical", title: "One-sided indemnity", explanation: "Meridian may cover claims even when Northstar contributed to the loss.", recommendation: "Request mutual, fault-based indemnity language before signing." });
  await expect(page.getByText("One-sided indemnity").first()).toBeVisible();
  const proposed = await execute(page, "propose_review", { summary: "The agreement shifts unusually broad third-party claim risk to Meridian Labs.", recommendation: "Request changes to clause 8 before signing.", findingIds: [flagged.result.finding.id] });
  await expect(page.getByRole("heading", { name: "Review summary" })).toBeVisible();
  await expect(page.locator(".integration-status")).toContainText("6 tools");

  await page.getByRole("textbox", { name: "Review summary" }).fill("The human-edited review confirms clause 8 needs negotiation.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByRole("button", { name: "Approve review" }).click();
  await expect(page.getByText(/Tell the agent “Approved”/)).toBeVisible();
  await expect(page.locator(".integration-status")).toContainText("7 tools");
  expect(await toolNames(page)).toContain("record_approved_review");

  await execute(page, "record_approved_review", { reviewId: proposed.result.continuation.proposalReference });
  await expect(page.getByRole("heading", { name: "Ready for your decision" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Continue to signature/ })).toBeEnabled();
  await expect(page.locator(".integration-status")).toContainText("4 tools");
  expect((await toolNames(page)).join(" ")).not.toMatch(/record|sign|acknowledge/);
  const trace = await page.evaluate(() => (window as Window & { __webMcpTrace: string[] }).__webMcpTrace);
  expect(trace).toEqual(["get_review_workspace", "get_agreement", "list_clauses", "read_clause", "read_clause", "read_clause", "flag_clause", "propose_review", "record_approved_review"]);
  await page.screenshot({ path: "test-results/signwise-complete.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("normal agreement UI remains usable without WebMCP on mobile", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/?no-webmcp=1");
  await expect(page.locator(".integration-status")).toContainText("0 tools");
  await page.getByRole("button", { name: /Open review workspace/ }).click();
  await expect(page.getByRole("heading", { name: "Risk review" })).toBeVisible();
  await page.getByRole("button", { name: "Agreement" }).click();
  await expect(page.getByText("Signature remains human-only")).toBeVisible();
  expect(errors).toEqual([]);
});
