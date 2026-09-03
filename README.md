# SignWise WebMCP

SignWise is an independent, fixture-based e-signature review prototype for the OpenAI WebMCP Challenge. An agent can inspect the agreement open in the live page, add evidence-backed clause findings, and prepare a review. A person controls the exact approval and every signing action.

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

## Demo

The canonical flow and prompts are in [docs/DEMO_RUNBOOK.md](docs/DEMO_RUNBOOK.md). The page exposes 4 stable tools, 6 review tools, 7 after human approval, and returns to 4 when the exact review is recorded. It intentionally exposes no signing, acceptance, consent, or acknowledgment tool.

## Deploy

The included `wrangler.jsonc` deploys the Vite `dist` directory as Cloudflare Workers static assets:

```bash
npm run build
npx wrangler deploy
```

No environment variables or backend are required.

## Scope and attribution

This project uses local fixture data and is not legal advice. It is an independent prototype inspired by common e-signature workflows and is not affiliated with or endorsed by Adobe. Adobe and Acrobat are trademarks of Adobe.

MIT licensed.
