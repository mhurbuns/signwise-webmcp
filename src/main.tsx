import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { SignWiseApp } from "./application/signWiseApp";
import { fixtureAgreement } from "./data/fixtureAgreement";
import { registerSignWiseTools } from "./webmcp/registerTools";

const app = new SignWiseApp(fixtureAgreement);

createRoot(document.getElementById("root")!).render(
  <StrictMode><App app={app} agreement={fixtureAgreement} /></StrictMode>,
);

void registerSignWiseTools(app);
