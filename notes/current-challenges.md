# Current Challenges & Questions

The foundational unit of knowledge in this reading system is not merely an article. The essential unit is the **active professional question or architectural challenge** that multiple sources, production experiences, and trade-off analyses help investigate.

Articles are inputs and evidence; challenges are where architectural problems are framed, tested, and resolved into practices.

---

## Navigation & Workflow Links

- [Synthesis Topics](./synthesis-topics.md) — Cross-article thematic synthesis and comparisons
- [Monthly Knowledge Review Template](../templates/monthly-knowledge-review.md) — Routine for reviewing progress and updating challenges
- [Original Artifacts Directory](../artifacts/README.md) — Reusable outputs (checklists, frameworks, principles)
- [Reading List Root](../README.md) — Repository overview and workflow documentation

---

## Challenge Lifecycle & Management Guide

### Adding a Challenge
- Formulate the challenge as an open, actionable question.
- Articulate **why it matters** to current projects, teams, or system reliability.
- State a **current hypothesis** (even an incomplete one) to test against reading and production data.
- Link relevant articles from [`articles.yaml`](../articles.yaml) using their stable IDs.

### Reviewing a Challenge
- Review active challenges during the monthly reflection cycle (see [Monthly Review Template](../templates/monthly-knowledge-review.md)).
- Update evidence as new articles are read or reviewed using [`templates/article-review.md`](../templates/article-review.md).
- Note emergent conflicting perspectives and edge cases.

### Closing or Archiving a Challenge
- A challenge moves to **Resolved** when a concrete architecture principle, ADR, checklist, or decision framework is produced in [`artifacts/`](../artifacts/README.md) and applied in practice.
- A challenge moves to **Archived / Paused** if context changes or if it is no longer an active priority.

---

## Active Challenges

### 1. How should we govern LLM applications?

- **Question:** How should we govern LLM applications?
- **Why it matters:** Generative AI applications introduce non-deterministic outputs, prompt injection vulnerabilities, data exfiltration vectors, and unclear boundaries between code and untrusted user input.
- **Current hypothesis:** Governance cannot rely solely on model-level safety alignments or system prompts; it requires defense-in-depth architectural boundaries (isolation of untrusted inputs, strict API privilege scoping, and egress controls).
- **Relevant articles or evidence:**
  - `camel-prompt-injection-mitigation` ([CaMeL Offers a Promising New Direction...](../articles.yaml))
  - `design-patterns-securing-llm-agents` ([Design Patterns for Securing LLM Agents...](../articles.yaml))
  - `lethal-trifecta-ai-agents` ([The Lethal Trifecta for AI Agents](../articles.yaml))
  - `ai-governance-data-governance-gone-wild` ([AI Governance: Data Governance Gone Wild](../articles.yaml))
- **Conflicting perspectives:** Developer agility favoring rapid direct API calls vs. centralized security gatekeeping demanding proxy interception, egress auditing, and pre-deployment red teaming.
- **Possible experiment or action:** *[Placeholder: Define an architectural checklist for inspecting untrusted prompt paths and tool access rights before deploying an LLM feature]*
- **Status:** Active / Investigating
- **Last reviewed:** 2026-09-09

---

### 2. How do we measure whether a data product is valuable?

- **Question:** How do we measure whether a data product is valuable?
- **Why it matters:** Building data products without objective value criteria leads to sprawling pipelines, stale analytical assets, and unbounded cloud compute/storage costs without demonstrable business impact.
- **Current hypothesis:** Value must be evaluated on consumption, operational enablement, and decision acceleration rather than volume, complexity, or sheer existence in a data catalog.
- **Relevant articles or evidence:**
  - `data-mesh` ([Data Mesh](../articles.yaml))
  - `big-data-is-dead` ([Big Data is Dead](../articles.yaml))
  - `cloud-native-platforms-build` ([Cloud Native Platforms: Build](../articles.yaml))
- **Conflicting perspectives:** Volume-centric metrics (queries executed, terabytes stored) vs. outcome-centric metrics (active decision consumers, operational SLA compliance, cost per insight).
- **Possible experiment or action:** *[Placeholder: Establish a lightweight scoring framework for assessing usage frequency, consumer feedback, and monthly compute cost per data product]*
- **Status:** Active / Candidate
- **Last reviewed:** 2026-09-09

---

### 3. Which architectural decisions should remain centralized?

- **Question:** Which architectural decisions should remain centralized?
- **Why it matters:** Full decentralization produces tooling fragmentation, incompatible data formats, and security blind spots. Over-centralization causes delivery bottlenecks and disenfranchises engineering teams.
- **Current hypothesis:** Centralize cross-cutting standards, identity, data contracts, interoperability standards, and core security guardrails; decentralize domain modeling, internal component design, and implementation velocity.
- **Relevant articles or evidence:**
  - `the-architect-elevator` ([The Architect Elevator](../articles.yaml))
  - `cloud-native-platforms-build` ([Cloud Native Platforms: Build](../articles.yaml))
  - `design-unity-catalog-architecture` ([Design Unity Catalog Architecture](../articles.yaml))
- **Conflicting perspectives:** Central enterprise architecture seeking standard tooling suites vs. autonomous product teams demanding stack freedom.
- **Possible experiment or action:** *[Placeholder: Draft an architecture decision matrix defining which tiers require enterprise review vs. local team autonomy]*
- **Status:** Active
- **Last reviewed:** 2026-09-09

---

### 4. How can data governance remain self-service without becoming uncontrolled?

- **Question:** How can data governance remain self-service without becoming uncontrolled?
- **Why it matters:** Governance enforced through ticket queues slows delivery to a halt. Zero-governance self-service creates data swamps, compliance violations, and security leaks.
- **Current hypothesis:** Self-service governance works when policies are declared as code (attribute-based access control, automated tagging, data contracts) and enforced transparently by the platform layer.
- **Relevant articles or evidence:**
  - `best-practices-for-abac-policies` ([Best Practices for ABAC Policies](../articles.yaml))
  - `design-unity-catalog-architecture` ([Design Unity Catalog Architecture](../articles.yaml))
  - `databricks-lakeguard-sigmod-2025` ([Databricks Lakeguard...](../articles.yaml))
  - `making-data-ready-for-agentic-ai` ([Making Your Data Ready for Agentic AI](../articles.yaml))
- **Conflicting perspectives:** Granular role-based permissions managed manually per team vs. unified policy engines evaluated at query runtime.
- **Possible experiment or action:** *[Placeholder: Pilot attribute-based access control (ABAC) rules automated through repository PRs]*
- **Status:** Active
- **Last reviewed:** 2026-09-09

---

### 5. What should a platform team provide, and what should product teams own?

- **Question:** What should a platform team provide, and what should product teams own?
- **Why it matters:** Unclear boundaries create duplicate platform efforts, cognitive overload for application developers, and animosity between platform and stream-aligned teams.
- **Current hypothesis:** Platform teams must provide consumable internal products ("paved roads") with clear APIs, documentation, and operational guarantees, while product teams own domain logic, data models, and day-to-day services.
- **Relevant articles or evidence:**
  - `cloud-native-platforms-build` ([Cloud Native Platforms: Build](../articles.yaml))
  - `cloud-native-platforms-run` ([Cloud Native Platforms: Run](../articles.yaml))
  - `the-architect-elevator` ([The Architect Elevator](../articles.yaml))
- **Conflicting perspectives:** Platform as an infrastructure service provider (ticketing) vs. platform as a product with voluntary adoption vs. mandatory standardization.
- **Possible experiment or action:** *[Placeholder: Formulate a platform team charter and responsibility matrix (Team Topologies style)]*
- **Status:** Active
- **Last reviewed:** 2026-09-09

---

### 6. When should a capability become a shared platform?

- **Question:** When should a capability become a shared platform?
- **Why it matters:** Premature extraction into a shared platform creates inflexible abstractions and unnecessary dependencies. Delayed extraction causes duplicated maintenance and divergent implementations.
- **Current hypothesis:** A capability should become a shared platform component only after at least 2-3 distinct teams have independently solved the problem and the common abstraction has stabilized.
- **Relevant articles or evidence:**
  - `cloud-native-platforms-build` ([Cloud Native Platforms: Build](../articles.yaml))
  - `cloud-native-platforms-evolve` ([Cloud Native Platforms: Evolve](../articles.yaml))
  - `parallel-change` ([Parallel Change](../articles.yaml))
- **Conflicting perspectives:** "Build once for the enterprise upfront" vs. "Let each team build and duplicate until pain is acute".
- **Possible experiment or action:** *[Placeholder: Define an extraction threshold checklist for graduating team-level tools into enterprise platform services]*
- **Status:** Candidate / Investigating
- **Last reviewed:** 2026-09-09

---

### 7. How should organizations govern AI agents?

- **Question:** How should organizations govern AI agents?
- **Why it matters:** Autonomous agents operate with tools, read private corporate data, and execute mutations. They lack human hesitation and treat questionable data as truth.
- **Current hypothesis:** Agent governance requires staged autonomy, just-in-time scoped credentials, audit logging of decision lineage, and structural separation of untrusted inputs from privileged execution.
- **Relevant articles or evidence:**
  - `making-data-ready-for-agentic-ai` ([Making Your Data Ready for Agentic AI](../articles.yaml))
  - `governing-ai-agents-unity-catalog` ([Governing AI Agents at Scale with Unity Catalog](../articles.yaml))
  - `lethal-trifecta-ai-agents` ([The Lethal Trifecta for AI Agents](../articles.yaml))
- **Conflicting perspectives:** Treating AI agents as standard API callers vs. treating them as autonomous actors requiring behavioral monitoring, circuit breakers, and human-in-the-loop gates.
- **Possible experiment or action:** *[Placeholder: Draft an agent deployment checklist covering read/write capability separation, credentials lifetime, and audit trails]*
- **Status:** Active / High Priority
- **Last reviewed:** 2026-09-09

---

### 8. How can cloud and data platforms provide paved roads without creating rigid constraints?

- **Question:** How can cloud and data platforms provide paved roads without creating rigid constraints?
- **Why it matters:** Platforms that enforce strict mandates cause shadow IT and frustration. Platforms with no guidance cause operational sprawl and high maintenance burden.
- **Current hypothesis:** Paved roads should represent the path of least resistance (easiest to adopt, secure by default, fully observable) with documented escape hatches for teams with specialized needs who agree to carry their own operational burden.
- **Relevant articles or evidence:**
  - `cloud-native-platforms-build` ([Cloud Native Platforms: Build](../articles.yaml))
  - `cloud-native-platforms-run` ([Cloud Native Platforms: Run](../articles.yaml))
  - `site-reliability-engineering` ([Site Reliability Engineering](../articles.yaml))
- **Conflicting perspectives:** Strict golden paths with enforced compliance vs. voluntary paved roads with freedom of choice.
- **Possible experiment or action:** *[Placeholder: Document the criteria under which an engineering team can diverge from standard platform templates]*
- **Status:** Active
- **Last reviewed:** 2026-09-09

---

### 9. How should we evaluate architectural complexity against expected business value?

- **Question:** How should we evaluate architectural complexity against expected business value?
- **Why it matters:** Accidental complexity compounds over time, slowing future changes and increasing operational failure modes.
- **Current hypothesis:** Architectural complexity is only justified when it eliminates essential business complexity or directly enables quantifiable scalability/reliability requirements.
- **Relevant articles or evidence:**
  - `out-of-the-tar-pit` ([Out of the Tar Pit](../articles.yaml))
  - `big-data-is-dead` ([Big Data is Dead](../articles.yaml))
  - `cloud-native-platforms-build` ([Cloud Native Platforms: Build](../articles.yaml))
- **Conflicting perspectives:** Future-proofing architectures for theoretical 10x-100x scale vs. choosing the simplest solution that satisfies current and near-term constraints.
- **Possible experiment or action:** *[Placeholder: Design a lightweight architectural complexity checklist for design reviews to question accidental state and distributed coordination]*
- **Status:** Active
- **Last reviewed:** 2026-09-09

---

### 10. How should FinOps influence architecture decisions?

- **Question:** How should FinOps influence architecture decisions?
- **Why it matters:** Cloud costs are a direct reflection of architectural choices. Treating cost optimization as an afterthought or pure finance exercise fails to address the root architecture drivers.
- **Current hypothesis:** Cost efficiency must be designed into architectural primitives (e.g. data lifecycle policies, compute auto-scaling, serverless vs. provisioned boundaries, query optimization) with unit-cost metrics exposed directly to engineering teams.
- **Relevant articles or evidence:**
  - `cloud-native-platforms-build` ([Cloud Native Platforms: Build](../articles.yaml))
  - `observability-in-databricks` ([Observability in Databricks...](../articles.yaml))
  - `big-data-is-dead` ([Big Data is Dead](../articles.yaml))
- **Conflicting perspectives:** Reactive end-of-month cost cutting vs. proactive architecture cost modeling integrated into CI/CD and capacity planning.
- **Possible experiment or action:** *[Placeholder: Establish an architecture review section calculating projected cost per unit/transaction for new workloads]*
- **Status:** Candidate
- **Last reviewed:** 2026-09-09
