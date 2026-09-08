# Cloud Architecture

A curated collection of articles about cloud architecture, platform design,
operational resilience, automation, cost, and production engineering.

---

## Cloud Native Platforms: Build

- **Publisher:** Microsoft Azure Architecture Blog
- **Status:** Read
- **Rating:** 10/10
- **Primary value:** Architectural principle and practical production lesson
- **Themes:** Azure, cloud-native platforms, reliability, observability, idempotency, automation, cost
- **Link:** [Read the article](https://techcommunity.microsoft.com/blog/azurearchitectureblog/cloud-native-platforms-build/4519605)

### Concise description

This article combines cloud-native architectural principles with their concrete
production consequences. It covers idempotency, observability, deployment
discipline, automation, cost management, recovery, and failure modes rather
than merely listing Azure services.

### Central idea

A cloud-native platform is not simply infrastructure that has been deployed.
It is a production system that must be continuously operated, evolved,
observed, secured, and recovered.

### Memorable insight

Cloud-native architecture is defined less by the services selected than by the
operational capabilities and engineering disciplines built around those
services.

### Architectural consequences

- Design provisioning and deployment operations to be repeatable and idempotent.
- Make observability part of the platform architecture rather than an add-on.
- Automate deployment, configuration, recovery, and policy enforcement.
- Treat cost as an architectural signal and operational constraint.
- Explicitly design for failure detection, degraded operation, and recovery.
- Evaluate the platform as a lifecycle rather than as a one-time deployment.

### Decision influenced

When designing an Azure or Azure Databricks platform, assess not only the
deployed resources but also how the platform will be upgraded, monitored,
recovered, governed, and operated over time.

### Why I recommend it

The article connects architectural principles to real production consequences.
Its value comes from treating a cloud-native platform as a living operational
system rather than a static collection of Azure resources.

### Limitations, bias, or counterargument

The article is published by Microsoft and naturally presents the subject
through an Azure-oriented perspective. Its broader principles remain portable,
but individual service recommendations should be evaluated against workload
requirements and alternative cloud or open-source approaches.

### Related articles

- Deployment Stamps Pattern
- Databricks Production Planning
- Architecture Best Practices for Azure Databricks
- Making Retries Safe with Idempotent APIs