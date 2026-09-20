# Worked example — attempt the challenge before reading

Illustrative decision authored by Codex. This is not your answer, an approved production design, or evidence of personal learning progress. The source extractions remain unreviewed.

# Ownership that survives a departure

Session: 23f2a767-2491-4163-8a5f-9b9944e001fc · Revision: 2 · 2026-09-20T10:01:52.038Z

Status: example_not_personal_progress. Learning progress is separate from extraction quality.

## Scenario

An engineer leaves and platform objects remain individually owned. Design an ownership model that preserves accountability without making the platform team approve every creation. State your assumptions, compare alternatives, describe failure modes and operational responsibilities.

## Initial answer (retained unchanged)

Illustrative answer authored by Codex, not the user: assign every object to the platform team so an engineer leaving cannot orphan it. Require approval for each creation.

## Evidence and coaching

### Assumptions

Does your proposal distinguish durable group ownership from named business accountability? Who maintains group membership? [S1]

### Alternatives

Compare domain delegation with individual ownership and central platform ownership. Which trade-offs justify your choice? [S2]

### Failure modes

Test an empty owner group, a departed engineer, failed provisioning and an over-privileged service identity. What detects each failure and who repairs it? [S3]

### Operations

Specify creation defaults, reconciliation, exception expiry, audit evidence and an escalation path. Which checks could become automated fitness functions? [S2]

This is a guided self-critique, not an automated assessment of the answer. The questions extend the readings; they are not claims that the sources prescribe every control.

### [S1] Design Unity Catalog Architecture

https://learn.microsoft.com/en-us/azure/databricks/lakehouse-architecture/deployment-guide/unity-catalog

articles/design-unity-catalog-architecture/article.md, lines 338–348; quality: not_reviewed

Source SHA-256: 896fa32742a9481e80e07f424e1655b69a7211b6a00482a34a4febc7ffc6b9f8
Markdown SHA-256: adf145ef1b39f80a0c52fbc487281cad6cbb6f6053b0bd94d64d90180b68b9c4

> In a centralized model, assign a single metastore admin or designated group.
> In a decentralized model, manage permissions through automated deployment
> pipelines rather than delegating to individual administrators.
> If you use a metastore admin, it is strongly recommended to assign the role to a designated
> group instead of a single user.
> 
> Isolation mechanisms
> To support enterprise-grade segregation for security or organizational reasons, Unity Catalog
> supports isolation on several levels:
> Admin isolation (delegation of management): Data should be managed by designated
> people or teams, based on the purpose or ownership of that data.

### [S2] Governing Data Products Using Fitness Functions

https://martinfowler.com/articles/fitness-functions-data-products.html

articles/governing-data-products-using-fitness-functions/article.md, lines 54–71; quality: not_reviewed

Source SHA-256: ce0905d5b4d8b1ae2b825cf86e5750c5c9d89da3538fe71bcf255c5aeb04d8a7
Markdown SHA-256: 91c476686454971ab89f3d6cfc8c5a7f1676b06e850fe92eeb4e7e400b9f3760

> The key idea behind data mesh is to improve data management in large organizations
> by decentralizing ownership of analytical data. Instead of a central team managing all
> analytical data, smaller autonomous domain-aligned teams own their respective data
> products. This setup allows for these teams to be responsive to evolving business
> needs and effectively apply their domain knowledge towards data driven decision
> making.
> Having smaller autonomous teams presents different sets of governance challenges
> compared to having a central team managing all of analytical data in a central data
> platform. Traditional ways of enforcing governance rules using data stewards work
> against the idea of autonomous teams and do not scale in a distributed setup. Hence
> with the data mesh approach, the emphasis is to use automation to enforce
> governance rules. In this article we'll examine how to use the concept of fitness
> functions to enforce governance rules on data products in a data mesh. 1
> This is particularly important to ensure that the data products meet a minimum
> governance standard which in turn is crucial for their interoperability and the network
> effects that data mesh promises.
> 
> Data product as an architectural quantum of the

### [S3] Design Unity Catalog Architecture

https://learn.microsoft.com/en-us/azure/databricks/lakehouse-architecture/deployment-guide/unity-catalog

articles/design-unity-catalog-architecture/article.md, lines 568–585; quality: not_reviewed

Source SHA-256: 896fa32742a9481e80e07f424e1655b69a7211b6a00482a34a4febc7ffc6b9f8
Markdown SHA-256: adf145ef1b39f80a0c52fbc487281cad6cbb6f6053b0bd94d64d90180b68b9c4

> Data curators: Manage all data assets (for example, ownership, create, modify, delete
> privileges).
> Data consumers: Read-only access to most data assets (select privileges).
> Data engineers: Read-write access to development and staging environments.
> Analysts: Read-only access to production analytics data.
> Permission delegation
> The metastore administrator establishes and enforces permission policies by assigning and
> delegating access rights to users or groups based on their responsibilities. For example:
> Data curators may be granted ownership or write privileges for managing datasets.
> Consumers receive read-level permissions through group membership.
> This structure ensures consistent governance, simplifies maintenance, and supports
> compliance with organizational data policies.
> Best practices for permission models
> Grant privileges to groups rather than individual users for easier management.
> Use least-privilege access (grant only the minimum permissions required).
> Document access control policies and review regularly with security teams.
> 
> https://learn.microsoft.com/en-us/azure/databricks/lakehouse-architecture/deployment-guide/unity-catalog

## My critique

The initial proposal removes dependency on one engineer but creates an approval queue and makes operational ownership ambiguous. S1 supports groups for metastore administration and automated delegation; it does not establish that every object should share one owner. S2 motivates domain accountability and automated governance instead of central stewards approving every action. S3 supports group-based grants and distinct curator/consumer responsibilities. The controls below are proposed design choices inferred from those readings, not verbatim source requirements. Assumptions: identity lifecycle automation exists, each domain has an accountable manager and backup, and relevant object APIs support ownership reassignment. Validate these assumptions and supported object types before rollout.

## Revised decision

Give each domain a durable, narrowly scoped owner group, with a named accountable manager and deputy recorded separately. Use domain-scoped deployment identities and provisioning templates to assign objects to the correct group at creation; keep grant administration distinct from ordinary consumption. The platform team owns policy templates, reconciliation and audited emergency recovery, while domains own membership and day-to-day decisions. Detect personal ownership, empty groups and stale accountable contacts daily; alert the domain first and escalate unresolved findings to the platform team. During migration, inventory all object types, test transfer behavior on a small domain, and compare access before and after each transfer. Use idempotent reassignment with an audit log; do not revoke the former owner until the new group and recovery path have been verified. Temporary exceptions need an owner, expiry and recorded reason. Alternatives: personal ownership is simple but fragile on departure; universal platform ownership is easy to enumerate but centralizes decisions and privileges; domain groups add lifecycle work but preserve autonomy. Failure drills cover an empty group, provisioning failure, an excessively privileged identity and delayed identity deprovisioning.

## Reconsider when

Proposed pilot gates, not established benchmark targets: reconsider after any transfer causes unexpected access loss, critical objects remain orphaned beyond one business day, or a domain cannot maintain a manager/deputy and recovery contact. Review incident history, queue latency and exception volume after 30 days. Revisit the grouping model if domain boundaries change, the identity system cannot maintain group lifecycle, or object-level ownership APIs cannot support safe reconciliation.
