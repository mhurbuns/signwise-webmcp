# Architecture

SignWise is a client-only React + TypeScript application with immutable fixture data and one observable application store.

```text
Browser
├── React UI
│   ├── agreement paper and highlighted clauses
│   ├── risk/review rail and agent activity
│   └── human approval and signature controls
├── SignWiseApp
│   ├── agreement queries
│   ├── validated findings and review lifecycle
│   ├── exact-revision approval gate
│   └── observable immutable snapshots
├── WebMCP adapter
│   ├── contextual tool definitions
│   ├── activity instrumentation
│   └── abort-driven registration and discovery verification
└── local fixture agreement
```

`SignWiseApp` owns all business rules. React subscribes through `useSyncExternalStore`; WebMCP callbacks call the same methods. Successful mutations replace the snapshot and synchronously notify subscribers before returning.

The tool adapter calculates a desired tool set from live state. It serializes reconciliation, removes obsolete registrations with `AbortController`, adds missing tools, then compares `document.modelContext.getTools()` with the expected owned names. The UI displays the verified count.

## Review state machine

```text
no proposal → pending → approved → recorded
                  ↑          |
                  └── edit ──┘
pending/approved → dismissed
```

Only `approved` with `approvedRevision === revision` exposes completion. Recording creates one demonstration audit record, switches to the certificate view, and removes contextual mutations. The human-only signature button is normal UI and has no WebMCP tool.
