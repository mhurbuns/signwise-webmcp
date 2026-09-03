import type { SignWiseApp } from "../application/signWiseApp";
import type { WebMcpModelContext } from "./browserTypes";
import { createDesiredToolDefinitions, ownedToolNames } from "./toolDefinitions";

export interface RegistrationResult {
  status: "ready" | "unavailable" | "failed";
  registeredToolNames: string[];
  dispose: () => void;
  error?: unknown;
}

const owned = new Set<string>(ownedToolNames);

function getModelContext(): WebMcpModelContext | undefined {
  if (typeof document === "undefined") return undefined;
  const context = document.modelContext;
  return context && typeof context.registerTool === "function" && typeof context.getTools === "function" ? context : undefined;
}

const messageFor = (error: unknown) => error instanceof Error ? error.message.slice(0, 200) : "WebMCP registration failed.";

export async function registerSignWiseTools(app: SignWiseApp): Promise<RegistrationResult> {
  const context = getModelContext();
  if (!context) {
    app.setWebMcpIntegration({ status: "unavailable", discoveredToolNames: [], message: "This browser does not expose document.modelContext." });
    return { status: "unavailable", registeredToolNames: [], dispose: () => undefined };
  }

  const controllers = new Map<string, AbortController>();
  let disposed = false;
  let requestedRevision = 0;
  let signature = "";
  let lastError: unknown;
  let queue = Promise.resolve();

  async function reconcile(revision: number) {
    if (disposed || revision !== requestedRevision) return;
    const definitions = createDesiredToolDefinitions(app);
    const desired = new Map(definitions.map((tool) => [tool.name, tool]));
    for (const [name, controller] of controllers) {
      if (!desired.has(name)) { controller.abort(); controllers.delete(name); }
    }
    try {
      for (const [name, tool] of desired) {
        if (controllers.has(name)) continue;
        const controller = new AbortController();
        await context!.registerTool(tool, { signal: controller.signal });
        if (disposed) { controller.abort(); return; }
        controllers.set(name, controller);
      }
      const discovered = await context!.getTools();
      if (disposed || revision !== requestedRevision) return;
      const actual = discovered.map(({ name }) => name).filter((name) => owned.has(name)).sort();
      const expected = [...desired.keys()].sort();
      const missing = expected.filter((name) => !actual.includes(name));
      const unexpected = actual.filter((name) => !expected.includes(name));
      if (missing.length || unexpected.length) throw new Error(`WebMCP discovery mismatch: ${[missing.length ? `missing ${missing.join(", ")}` : "", unexpected.length ? `unexpected ${unexpected.join(", ")}` : ""].filter(Boolean).join("; ")}`);
      lastError = undefined;
      app.setWebMcpIntegration({ status: "ready", discoveredToolNames: actual });
    } catch (error) {
      lastError = error;
      if (!disposed && revision === requestedRevision) app.setWebMcpIntegration({ status: "failed", discoveredToolNames: [...controllers.keys()].sort(), message: messageFor(error) });
    }
  }

  function requestReconciliation() {
    const nextSignature = createDesiredToolDefinitions(app).map(({ name }) => name).sort().join("\0");
    if (nextSignature === signature) return queue;
    signature = nextSignature;
    const revision = ++requestedRevision;
    queue = queue.then(() => reconcile(revision));
    return queue;
  }

  const unsubscribe = app.subscribe(() => { void requestReconciliation(); });
  await requestReconciliation();
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    unsubscribe();
    for (const controller of controllers.values()) controller.abort();
    controllers.clear();
  };
  const state = app.getSnapshot().webMcp;
  return { status: state.status === "checking" ? "failed" : state.status, registeredToolNames: [...state.discoveredToolNames], dispose, ...(lastError === undefined ? {} : { error: lastError }) };
}
