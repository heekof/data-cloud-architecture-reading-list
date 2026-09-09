# Practical Architectural Artifacts

This directory houses **original, reusable engineering and architectural artifacts** created by distilling, synthesizing, and applying the reading list.

The goal of reading architecture literature is not passive accumulation of summaries; it is translating ideas into concrete operational leverage.

---

## Navigation & Workflow Links

- [Reading List Overview](../README.md) — Main repository documentation
- [Current Challenges](../notes/current-challenges.md) — Active architectural problems driving artifact creation
- [Synthesis Topics](../notes/synthesis-topics.md) — Cross-source thematic syntheses
- [Article Review Template](../templates/article-review.md) — Guide for reviewing individual sources
- [Monthly Review Template](../templates/monthly-knowledge-review.md) — Monthly cadence for committing to new artifacts

---

## Knowledge Hierarchy & Distinctions

To keep the repository clean and maintainable, understand the distinction between layers:

| Layer | Location | Purpose | Unit of Content |
|---|---|---|---|
| **Source Article** | `pdfs/` & `articles.yaml` | External evidence and foundational knowledge | Original publication / PDF |
| **Article Review** | `articles/<category>.md` | Critical evaluation of a single source | Summary, principles, and behavioral change |
| **Synthesis Note** | `notes/synthesis-topics.md` | Cross-source comparison and debate | Reconciling trade-offs across multiple works |
| **Practical Artifact** | `artifacts/` | Original, applicable tools for teams | Checklists, matrices, principles, ADRs |

---

## Types of Artifacts

Artifacts stored here should be actionable tools that architects and engineering teams can reuse in day-to-day work:

- **Architecture Principles:** Opinionated, memorable rules for system design (e.g. state management, blast-radius boundaries).
- **Checklists:** Pre-flight and review checklists (e.g. data contract validation, agent security boundaries, production readiness).
- **Decision Frameworks:** Structured evaluation criteria for choosing patterns (e.g. event streaming vs synchronous REST, lakehouse vs warehouse).
- **ADR Guidance:** Reusable Architectural Decision Record templates tailored to enterprise contexts.
- **Architecture Recommendations:** Position papers and guidance memos on specific capabilities.
- **Comparison Matrices:** Objective feature-and-constraint comparisons (e.g. open table formats, catalog implementations).
- **Maturity Assessments:** Evaluation rubrics to measure team or platform progression.
- **Experiment Reports:** Documented results from applying a pattern or proof of concept in real environments.
- **Internal Architecture Memos:** Concise executive or engineering memos explaining structural shifts.

---

## Standard Lightweight Artifact Format

When creating a new artifact in this directory (e.g. `artifacts/agent-security-checklist.md`), use this template:

```markdown
# [Artifact Title]

- **Type:** [Checklist | Decision Framework | Principle | ADR Guide | Matrix]
- **Status:** [Draft | In Review | Applied]
- **Last Reviewed:** YYYY-MM-DD
- **Related Current Challenge:** [Link to challenge in ../notes/current-challenges.md]
- **Related Synthesis Topic:** [Link to topic in ../notes/synthesis-topics.md]

---

## 1. Problem
<!-- What precise operational, architectural, or organizational failure does this solve? -->

## 2. Intended Audience
<!-- Software engineers, platform teams, enterprise architects, data owners, engineering leads -->

## 3. Context & Applicability
<!-- When to use this artifact, and when it is explicitly NOT applicable -->

## 4. Recommendation or Tool
<!-- The actual checklist, matrix, guideline, or principle in full detail -->

## 5. Supporting Principles
<!-- The foundational architectural axioms underpinning this recommendation -->

## 6. Supporting Sources
<!-- Stable article IDs from articles.yaml (e.g. `cloud-native-platforms-build`, `lethal-trifecta-ai-agents`) -->

## 7. Trade-offs and Limitations
<!-- What does this cost? Where does it fail? What flexibility is sacrificed? -->

## 8. How to Apply It
<!-- Concrete, step-by-step instructions for putting this artifact into practice -->
```

---

## Operating Rule

> **"For every five worthwhile articles read, create at least one original artifact."**

Artifacts are added as active challenges and synthesis topics mature through evidence and real-world application.
