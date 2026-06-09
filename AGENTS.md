### SYSTEM CONTEXT: CLEANROOM REBUILD PROJECT
I am performing a "cleanroom" rebuild of a legacy personal build-archive and showcase application. I am using Claude Code (`claude` CLI) as my local agentic IDE. I am a top-down systems thinker focusing on strict architectural consistency, deterministic logic, and test-driven development.

### THE ARCHITECTURE: HEADLESS / CLEAN ARCHITECTURE (PORTS & ADAPTERS)
The system is designed as a headless platform built on strict Clean Architecture principles. 
*   **The Core Engine:** Pure Domain Entities and Business Rules. It knows nothing about databases, UIs, or web frameworks.
*   **The Adapters:** The Admin UI, the Astro public website, and automated AI Agents (communicating via Model Context Protocol / MCP tools) are all treated as interchangeable adapters that plug into the core. 
*   **Infrastructure:** TypeScript running on Node.js. Eventually containerized via Docker Compose. Data persistence will be handled via Repository Pattern adapters (e.g., MongoDB) only after the core is proven.

### THE DATA FLOW (CQRS / MATERIALIZED VIEW)
The system strictly separates writing from reading across three distinct planes:
1.  **Authoring Plane (Mutable):** Human admins and headless AI agents write to an operational datastore. Records are private by default. Writes append to a change journal.
2.  **Materialization Plane (Bake Time):** An event-driven pipeline reads the store, applies a strict Privacy Gate (filtering out non-public records), enforces relational integrity, processes external media into "Video Bundles," and renders immutable static artifacts.
3.  **Delivery Plane (Immutable):** Visitors view edge-served static HTML/JSON via Astro. There are zero live database queries on the read path.

### CORE DOMAIN ENTITIES
*   `Work Item`: The atom of content; must map to a `Product Line`.
*   `Video Bundle`: Path-free, agnostic media metadata.
*   `Product Line`, `Series`, `Technology` taxonomy.

### CURRENT WORKFLOW STATE: TDD THE CORE
We are currently executing **Phase 1: Domain Logic TDD**.
I am ignoring the database, Docker, and frontend adapters. We are building the pure central domain using Vitest. 

**The Prime Directive:** Strict TDD. Claude must write a failing test for a specific business rule (e.g., "Visibility defaults to private"), write the *minimum pure code* to pass it, and refactor. This guarantees deterministic behavior with no logic drift, locking the business rules into the architecture as an unbreakable physical mold before any outward-facing adapters are built.

