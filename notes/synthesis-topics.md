# Synthesis Topics

A single article offers a perspective; an architectural stance requires cross-source synthesis.

This document tracks synthesis topics that require comparing, contrasting, and reconciling insights across multiple articles, books, and real-world system implementations.

---

## Navigation & Workflow Links

- [Current Challenges & Questions](./current-challenges.md) — Active operational and architectural questions
- [Monthly Knowledge Review Template](../templates/monthly-knowledge-review.md) — Routine for advancing synthesis topics
- [Original Artifacts Directory](../artifacts/README.md) — Reusable outputs resulting from synthesis
- [Reading List Root](../README.md) — Repository overview and workflow documentation

---

## Synthesis Lifecycle & Workflow

Each topic advances through defined stages:

1. **`candidate`** — Topic identified; initial sources and questions mapped out.
2. **`researching`** — Actively reading and reviewing source articles; extracting agreements and disagreements.
3. **`drafting`** — Writing cross-article comparison notes; formulating architectural stances.
4. **`reviewed`** — Tested against peer feedback, ADRs, or real-world implementation constraints.
5. **`published or applied`** — Converted into a practical artifact in [`artifacts/`](../artifacts/README.md) (e.g. decision framework, checklist, architecture memo) or applied to production projects.

---

## Topics

### 1. What good platform engineering actually means

- **Central question:** What distinguishes an effective internal developer platform from an inflexible bureaucratic silo?
- **Why the topic matters:** Organizations spend millions building platform teams that frequently become ticket queues or impose unwanted tooling, alienating stream-aligned teams.
- **Relevant current challenges:** [Challenge 5](./current-challenges.md#5-what-should-a-platform-team-provide-and-what-should-product-teams-own), [Challenge 8](./current-challenges.md#8-how-can-cloud-and-data-platforms-provide-paved-roads-without-creating-rigid-constraints)
- **Candidate sources:**
  - `cloud-native-platforms-build` ([Cloud Native Platforms: Build](../articles.yaml))
  - `cloud-native-platforms-run` ([Cloud Native Platforms: Run](../articles.yaml))
  - `cloud-native-platforms-evolve` ([Cloud Native Platforms: Evolve](../articles.yaml))
  - `the-architect-elevator` ([The Architect Elevator](../articles.yaml))
- **Areas of agreement:** Platforms must treat developers as customers, deliver paved roads rather than mandates, and optimize for reducing cognitive load and lead time.
- **Areas of disagreement:** *[Placeholder: Degree to which usage should be strictly mandated vs. optional; ownership boundaries of day-2 operations]*
- **My current position:** *[Placeholder: Analysis in progress]*
- **Practical recommendations:** *[Placeholder: Pending research]*
- **Open questions:** How do we measure whether an internal platform reduces cognitive load or merely abstracts necessary operational reality?
- **Potential artifact:** Internal Platform Charter & Paved Road Assessment Checklist ([`artifacts/`](../artifacts/README.md))
- **Status:** researching

---

### 2. Centralized versus federated data governance

- **Central question:** How can an enterprise reconcile uniform regulatory/compliance obligations with decentralized domain agility?
- **Why the topic matters:** Purely centralized governance chokes velocity; purely federated governance results in incompatible silos, compliance breaches, and catalog fragmentation.
- **Relevant current challenges:** [Challenge 3](./current-challenges.md#3-which-architectural-decisions-should-remain-centralized), [Challenge 4](./current-challenges.md#4-how-can-data-governance-remain-self-service-without-becoming-uncontrolled)
- **Candidate sources:**
  - `design-unity-catalog-architecture` ([Design Unity Catalog Architecture](../articles.yaml))
  - `unity-catalog-open-universal-governance` ([Unity Catalog: Open and Universal Governance...](../articles.yaml))
  - `best-practices-for-abac-policies` ([Best Practices for ABAC Policies](../articles.yaml))
  - `data-mesh` ([Data Mesh](../articles.yaml))
  - `begun-the-catalog-wars-have` ([Begun, the Catalog Wars Have](../articles.yaml))
- **Areas of agreement:** Global policy definitions (identity, compliance classification, audit logging) must be uniform across the organization.
- **Areas of disagreement:** Where domain ownership begins: should schema validation and access grants be governed by domain owners or centralized data governance teams?
- **My current position:** *[Placeholder: Analysis in progress]*
- **Practical recommendations:** *[Placeholder: Pending research]*
- **Open questions:** What technical mechanisms allow federated teams to define policies without violating enterprise compliance baselines?
- **Potential artifact:** Federated vs Centralized Governance Decision Matrix ([`artifacts/`](../artifacts/README.md))
- **Status:** candidate

---

### 3. The limits of data mesh

- **Central question:** Where does the domain-driven data mesh model break down in mid-sized or legacy enterprise environments?
- **Why the topic matters:** Data mesh is frequently adopted as an organizational silver bullet without the required organizational maturity, skilled domain data engineers, or self-serve platform foundations.
- **Relevant current challenges:** [Challenge 2](./current-challenges.md#2-how-do-we-measure-whether-a-data-product-is-valuable), [Challenge 9](./current-challenges.md#9-how-should-we-evaluate-architectural-complexity-against-expected-business-value)
- **Candidate sources:**
  - `data-mesh` ([Data Mesh](../articles.yaml))
  - `big-data-is-dead` ([Big Data is Dead](../articles.yaml))
  - `composable-data-management-system-manifesto` ([The Composable Data Management System Manifesto](../articles.yaml))
- **Areas of agreement:** Monolithic centralized data teams fail when scale and domain diversity exceed central cognitive capacity.
- **Areas of disagreement:** Whether domain teams possess the appetite, skills, and funding to run autonomous data product lifecycles.
- **My current position:** *[Placeholder: Analysis in progress]*
- **Practical recommendations:** *[Placeholder: Pending research]*
- **Open questions:** What organizational prerequisites must exist before decentralizing data ownership into product teams?
- **Potential artifact:** Data Mesh Readiness Evaluation Rubric ([`artifacts/`](../artifacts/README.md))
- **Status:** candidate

---

### 4. When microservices improve scalability and when they create complexity

- **Central question:** At what threshold does service decomposition pay for its distributed coordination and operational overhead?
- **Why the topic matters:** Premature microservices replace in-process simplicity with network failures, eventual consistency bugs, distributed transaction nightmares, and observability debt.
- **Relevant current challenges:** [Challenge 9](./current-challenges.md#9-how-should-we-evaluate-architectural-complexity-against-expected-business-value)
- **Candidate sources:**
  - `out-of-the-tar-pit` ([Out of the Tar Pit](../articles.yaml))
  - `the-log` ([The Log...](../articles.yaml))
  - `making-retries-safe-with-idempotent-apis` ([Making Retries Safe with Idempotent APIs](../articles.yaml))
  - `parallel-change` ([Parallel Change](../articles.yaml))
- **Areas of agreement:** Distributed systems trade operational simplicity for independent deployability and organizational scaling.
- **Areas of disagreement:** *[Placeholder: Monolith vs microservice boundaries; event-driven choreography vs orchestration]*
- **My current position:** *[Placeholder: Analysis in progress]*
- **Practical recommendations:** *[Placeholder: Pending research]*
- **Open questions:** Which architectural signals indicate that a modular monolith has genuinely exhausted its scaling ceiling?
- **Potential artifact:** Service Decomposition Trade-off Assessment Framework ([`artifacts/`](../artifacts/README.md))
- **Status:** candidate

---

### 5. What architects should standardize and what teams should choose

- **Central question:** How do architects balance enterprise standardization with team autonomy without stalling delivery?
- **Why the topic matters:** Standardizing too much stifles innovation and creates bureaucracy. Standardizing too little creates an unmaintainable zoo of languages, tools, and deployment models.
- **Relevant current challenges:** [Challenge 3](./current-challenges.md#3-which-architectural-decisions-should-remain-centralized), [Challenge 5](./current-challenges.md#5-what-should-a-platform-team-provide-and-what-should-product-teams-own)
- **Candidate sources:**
  - `the-architect-elevator` ([The Architect Elevator](../articles.yaml))
  - `cloud-native-platforms-build` ([Cloud Native Platforms: Build](../articles.yaml))
- **Areas of agreement:** Architects should standardize on protocols, contracts, and interoperability standards rather than implementation frameworks or coding styles.
- **Areas of disagreement:** *[Placeholder: Standardizing cloud providers vs multi-cloud flexibility; programming language curation]*
- **My current position:** *[Placeholder: Analysis in progress]*
- **Practical recommendations:** *[Placeholder: Pending research]*
- **Open questions:** How do we establish automated compliance checks that verify adherence to core standards without manual gatekeeping?
- **Potential artifact:** Architecture Standardization vs Autonomy Guide ([`artifacts/`](../artifacts/README.md))
- **Status:** candidate

---

### 6. FinOps as an architectural capability

- **Central question:** How can cloud financial management be woven directly into architectural design rather than treated as post-facto billing reconciliation?
- **Why the topic matters:** Cloud bills scale silently and exponentially when architectures assume infinite resources, poorly configured auto-scaling, or unbounded analytical queries.
- **Relevant current challenges:** [Challenge 10](./current-challenges.md#10-how-should-finops-influence-architecture-decisions)
- **Candidate sources:**
  - `cloud-native-platforms-build` ([Cloud Native Platforms: Build](../articles.yaml))
  - `big-data-is-dead` ([Big Data is Dead](../articles.yaml))
  - `observability-in-databricks` ([Observability in Databricks...](../articles.yaml))
- **Areas of agreement:** Cost is an architectural non-functional requirement alongside latency, availability, and security.
- **Areas of disagreement:** *[Placeholder: Chargeback vs showback; developer-level cost alerting thresholds]*
- **My current position:** *[Placeholder: Analysis in progress]*
- **Practical recommendations:** *[Placeholder: Pending research]*
- **Open questions:** What architectural metrics provide early-warning signals for unit economics degradation before monthly invoices arrive?
- **Potential artifact:** Architectural FinOps Checklist for Workload Design ([`artifacts/`](../artifacts/README.md))
- **Status:** candidate

---

### 7. Governance for enterprise RAG systems

- **Central question:** How should enterprise RAG systems enforce access control, information boundary isolation, and citation accuracy at scale?
- **Why the topic matters:** RAG pipelines risk exposing sensitive documents across tenant boundaries if search indexing ignores source authorization rules or if chunking drops security metadata.
- **Relevant current challenges:** [Challenge 1](./current-challenges.md#1-how-should-we-govern-llm-applications), [Challenge 7](./current-challenges.md#7-how-should-organizations-govern-ai-agents)
- **Candidate sources:**
  - `making-data-ready-for-agentic-ai` ([Making Your Data Ready for Agentic AI](../articles.yaml))
  - `governing-ai-agents-unity-catalog` ([Governing AI Agents at Scale with Unity Catalog](../articles.yaml))
  - `best-practices-for-abac-policies` ([Best Practices for ABAC Policies](../articles.yaml))
  - `ai-governance-data-governance-gone-wild` ([AI Governance: Data Governance Gone Wild](../articles.yaml))
- **Areas of agreement:** Search retrieval must respect user permissions at query time; retrieved chunks must preserve security tags and source citations.
- **Areas of disagreement:** *[Placeholder: Early filtering at vector index vs late filtering in prompt context; handling mixed-permission document synthesis]*
- **My current position:** *[Placeholder: Analysis in progress]*
- **Practical recommendations:** *[Placeholder: Pending research]*
- **Open questions:** How do we audit and reproduce non-deterministic RAG responses when defending compliance audits?
- **Potential artifact:** Enterprise RAG Governance & Security Architecture Checklist ([`artifacts/`](../artifacts/README.md))
- **Status:** candidate

---

### 8. Governance for LLM applications and AI agents

- **Central question:** What architectural controls are required when moving from static conversational LLMs to autonomous tool-using agents?
- **Why the topic matters:** Agents with access to private data, untrusted inputs, and external communication channels (the "Lethal Trifecta") pose novel threat vectors that traditional API security does not mitigate.
- **Relevant current challenges:** [Challenge 1](./current-challenges.md#1-how-should-we-govern-llm-applications), [Challenge 7](./current-challenges.md#7-how-should-organizations-govern-ai-agents)
- **Candidate sources:**
  - `lethal-trifecta-ai-agents` ([The Lethal Trifecta for AI Agents](../articles.yaml))
  - `design-patterns-securing-llm-agents` ([Design Patterns for Securing LLM Agents...](../articles.yaml))
  - `camel-prompt-injection-mitigation` ([CaMeL Offers a Promising New Direction...](../articles.yaml))
  - `making-data-ready-for-agentic-ai` ([Making Your Data Ready for Agentic AI](../articles.yaml))
  - `governing-ai-agents-unity-catalog` ([Governing AI Agents at Scale with Unity Catalog](../articles.yaml))
- **Areas of agreement:** Never combine read access to private data with write access to external networks without strict human verification or air-gapped dual-agent isolation.
- **Areas of disagreement:** *[Placeholder: Viability of prompt filtering vs structural runtime isolation]*
- **My current position:** An agent is misgoverned if it combines at least two of the lethal trifecta dimensions (private data read, external write, untrusted input) without architectural isolation.
- **Practical recommendations:** Enforce capability segregation, short-lived just-in-time tokens, and explicit outbound egress limits.
- **Open questions:** How can we automate behavioral anomaly detection for long-running agentic workflows?
- **Potential artifact:** Agentic AI Threat Modeling & Guardrails Template ([`artifacts/`](../artifacts/README.md))
- **Status:** researching

---

### 9. Self-service governance versus centralized control

- **Central question:** How can modern platforms offer frictionless self-service data access while ensuring continuous compliance?
- **Why the topic matters:** Traditional governance creates friction through manual request forms; unmanaged self-service creates risk.
- **Relevant current challenges:** [Challenge 4](./current-challenges.md#4-how-can-data-governance-remain-self-service-without-becoming-uncontrolled)
- **Candidate sources:**
  - `best-practices-for-abac-policies` ([Best Practices for ABAC Policies](../articles.yaml))
  - `design-unity-catalog-architecture` ([Design Unity Catalog Architecture](../articles.yaml))
  - `data-mesh` ([Data Mesh](../articles.yaml))
- **Areas of agreement:** Shift governance from gatekeeping to automated policy enforcement embedded directly in the data platform.
- **Areas of disagreement:** *[Placeholder: Central approval workflows vs post-access anomaly auditing]*
- **My current position:** *[Placeholder: Analysis in progress]*
- **Practical recommendations:** *[Placeholder: Pending research]*
- **Open questions:** What automated metrics tell us that self-service governance is maintaining compliance without adding friction?
- **Potential artifact:** Self-Service Governance Policy Framework ([`artifacts/`](../artifacts/README.md))
- **Status:** candidate

---

### 10. Interoperability and open standards in modern data platforms

- **Central question:** How do open table formats and composable data engines prevent vendor lock-in and enable cross-engine analytics?
- **Why the topic matters:** Committing proprietary storage formats or vendor-specific catalogs locks enterprises into vendor pricing and limits analytical agility.
- **Relevant current challenges:** [Challenge 3](./current-challenges.md#3-which-architectural-decisions-should-remain-centralized)
- **Candidate sources:**
  - `road-to-composable-data-systems` ([The Road to Composable Data Systems](../articles.yaml))
  - `composable-data-management-system-manifesto` ([The Composable Data Management System Manifesto](../articles.yaml))
  - `beyond-indexes-open-table-formats` ([Beyond Indexes: How Open Table Formats Optimize Query Performance](../articles.yaml))
  - `apache-iceberg-definitive-guide` ([Apache Iceberg: The Definitive Guide](../articles.yaml))
  - `begun-the-catalog-wars-have` ([Begun, the Catalog Wars Have](../articles.yaml))
  - `data-lakehouse-catalog-reality-check` ([Data Lakehouse Catalog Reality Check](../articles.yaml))
- **Areas of agreement:** Decoupling storage (Parquet/Arrow), metadata (Iceberg/Delta), and execution engines (Spark, DuckDB, Trino) creates resilience and flexibility.
- **Areas of disagreement:** Catalog lock-in: whether open REST catalog APIs are sufficient to prevent lock-in when vendors offer proprietary optimization layers.
- **My current position:** *[Placeholder: Analysis in progress]*
- **Practical recommendations:** *[Placeholder: Pending research]*
- **Open questions:** Does the performance overhead of modular, composable engines offset the operational freedom from single-vendor platforms?
- **Potential artifact:** Open Data Architecture Evaluation Matrix ([`artifacts/`](../artifacts/README.md))
- **Status:** researching

---

### 11. When architectural flexibility becomes unnecessary complexity

- **Central question:** When does building for future extensibility degrade current delivery and introduce architectural debt?
- **Why the topic matters:** Engineers frequently build generic abstractions, dynamic plugin architectures, or distributed components for speculative requirements that never materialize.
- **Relevant current challenges:** [Challenge 9](./current-challenges.md#9-how-should-we-evaluate-architectural-complexity-against-expected-business-value)
- **Candidate sources:**
  - `out-of-the-tar-pit` ([Out of the Tar Pit](../articles.yaml))
  - `cloud-native-platforms-build` ([Cloud Native Platforms: Build](../articles.yaml))
  - `big-data-is-dead` ([Big Data is Dead](../articles.yaml))
- **Areas of agreement:** Accidental complexity arises from managing state and trying to anticipate future requirements that are not yet understood.
- **Areas of disagreement:** *[Placeholder: Where to draw the line between prudent decoupling and premature generalization]*
- **My current position:** *[Placeholder: Analysis in progress]*
- **Practical recommendations:** Favor simple, replaceable components over complex extensible frameworks until concrete variation requirements emerge.
- **Open questions:** What objective heuristics can distinguish genuine modularity from speculative over-engineering in code reviews?
- **Potential artifact:** Accidental Complexity vs Essential Flexibility Checklist ([`artifacts/`](../artifacts/README.md))
- **Status:** candidate

---

### 12. What makes a data product genuinely valuable

- **Central question:** What characteristics distinguish a durable, high-value data product from a simple table dump or transient pipeline?
- **Why the topic matters:** Labeling existing database tables as "data products" without contracts, SLOs, or consumer ownership reproduces legacy data warehouse dysfunctions under new branding.
- **Relevant current challenges:** [Challenge 2](./current-challenges.md#2-how-do-we-measure-whether-a-data-product-is-valuable)
- **Candidate sources:**
  - `data-mesh` ([Data Mesh](../articles.yaml))
  - `cloud-native-platforms-build` ([Cloud Native Platforms: Build](../articles.yaml))
  - `making-data-ready-for-agentic-ai` ([Making Your Data Ready for Agentic AI](../articles.yaml))
- **Areas of agreement:** A data product requires a defined owner, documented schema contract, known consumers, reliability SLOs, and quality verification.
- **Areas of disagreement:** *[Placeholder: Whether analytical datasets must always be packaged with compute interfaces vs raw storage access]*
- **My current position:** *[Placeholder: Analysis in progress]*
- **Practical recommendations:** *[Placeholder: Pending research]*
- **Open questions:** How do we establish operational SLAs on data freshness and accuracy that balance engineering feasibility with business utility?
- **Potential artifact:** Data Product Quality & Value Scorecard ([`artifacts/`](../artifacts/README.md))
- **Status:** candidate
