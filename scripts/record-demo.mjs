import { spawn } from "node:child_process";
import { mkdir, readdir, rename, rm } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = "http://127.0.0.1:4174";
const videoDir = "submission-video/.capture";
const output = "submission-video/signwise-automated-app-demo.webm";
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

await rm(videoDir, { recursive: true, force: true });
await mkdir(videoDir, { recursive: true });

const server = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", "4174"], { stdio: "ignore" });

try {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(baseURL)).ok) break; } catch { /* server is starting */ }
    if (attempt === 49) throw new Error("Vite demo server did not start.");
    await pause(200);
  }

  const browser = await chromium.launch({ channel: "chrome" });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const registered = new Map();
    const modelContext = {
      async registerTool(tool, options) {
        registered.set(tool.name, tool);
        options?.signal?.addEventListener("abort", () => registered.delete(tool.name), { once: true });
      },
      async getTools() {
        return [...registered.values()].map((tool) => ({ name: tool.name, title: tool.title, description: tool.description, inputSchema: tool.inputSchema, annotations: tool.annotations }));
      },
      async executeTool(tool, input) {
        return JSON.stringify(await registered.get(tool.name).execute(JSON.parse(input), { signal: new AbortController().signal }));
      },
    };
    Object.defineProperty(document, "modelContext", { configurable: true, value: modelContext });
  });
  await page.goto(baseURL);
  await pause(1800);
  await page.getByRole("button", { name: /Open review workspace/ }).click();
  await pause(1200);

  const execute = async (name, input = {}) => page.evaluate(async ({ name, input }) => {
    const context = document.modelContext;
    const tool = (await context.getTools()).find((candidate) => candidate.name === name);
    return JSON.parse(await context.executeTool(tool, JSON.stringify(input)));
  }, { name, input });

  await execute("get_review_workspace");
  await pause(400);
  await execute("get_agreement");
  await execute("list_clauses");
  for (const clauseId of ["renewal", "indemnity", "liability"]) {
    await execute("read_clause", { clauseId });
    await pause(450);
  }
  const inputs = [
    { clauseId: "renewal", severity: "high", title: "Two-year automatic renewal", explanation: "Missing the 120-day notice window triggers another 24-month term.", recommendation: "Negotiate a shorter renewal term and reminder window." },
    { clauseId: "indemnity", severity: "critical", title: "One-sided indemnity", explanation: "Meridian may cover claims even when Northstar contributed to the loss.", recommendation: "Request mutual, fault-based indemnity language." },
    { clauseId: "liability", severity: "high", title: "Thirty-day liability cap", explanation: "The supplier cap may be far below the impact of a serious service failure.", recommendation: "Seek a cap tied to twelve months of fees with appropriate carve-outs." },
  ];
  const findings = [];
  for (const input of inputs) {
    const result = await execute("flag_clause", input);
    findings.push(result.result.finding.id);
    await pause(950);
  }
  const proposed = await execute("propose_review", { summary: "The agreement combines long automatic renewal, one-sided indemnity, and a very low supplier liability cap.", recommendation: "Request changes to clauses 4, 8, and 10 before signing.", findingIds: findings });
  await pause(1800);
  await page.getByRole("button", { name: "Approve review" }).click();
  await pause(1500);
  await execute("record_approved_review", { reviewId: proposed.result.continuation.proposalReference });
  await pause(2200);
  await page.getByRole("button", { name: /Continue to signature/ }).click();
  await pause(1800);
  await context.close();
  await browser.close();
  const [captured] = (await readdir(videoDir)).filter((name) => name.endsWith(".webm"));
  if (!captured) throw new Error("Playwright did not produce a video.");
  await rm(output, { force: true });
  await rename(`${videoDir}/${captured}`, output);
  await rm(videoDir, { recursive: true, force: true });
  process.stdout.write(`${output}\n`);
} finally {
  server.kill("SIGTERM");
}
