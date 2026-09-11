# Data Lakehouse Catalog Reality Check


Subscribe

Sign in

Data Lakehouse Catalog Reality Check
Databricks and Snowflake are talking a big game. So far, they've given us empty Github repositories
and rewrites.
CHRIS
JUN 27, 2024

12

2

Share

I began my series on data lakehouse catalogs just last week and the news keeps rolling in. This week, Fivetran announced
their managed data lake service, and Onehouse announced $35 million in series B funding.
In this post, I want to take a look at Unity and Polaris, the open source catalogs that Databricks and Snowflake recently
announced. Both vendors launched their catalogs to great fanfare. Unfortunately, the marketing doesn’t yet seem to live
up to reality.
Before continuing, readers should know that I owned Tabular shares. I don’t have any particular visibility into Databricks or
Tabular’s product strategy, and I’ve tried to be as fair as possible in this post.
Snowflake has produced a great product landing page and blog post. I naively assumed that the project was, in fact,
released—they link to a Github repo. A friend recently asked me, “Yes, but have you looked at the code?” This is the code.

On further inspection, Snowflake’s blog post does mention that developers should watch the Github repository to be
notified when the code is released. I missed this. But I expected a bit more here, especially given the amount of marketing
copy they’ve invested in.
Very quickly afterwards, Databricks announced Unity. Again, I was quite excited.

https://materializedview.io/p/data-lakehouse-catalog-reality-check

1/4

Data Lakehouse Catalog Reality Check

Discover more from Materialized View
Software infrastructure hot takes, projects, papers,
developer interviews, and deep dives. Brought to
you by Chris Riccomini.
Over 6,000 subscribers

My excitement has waned. As it turns out, Unity is not Unity. Databricks open sourced an API-compatible rewrite of their
product. And it sounds like it’s missing quite a bit. Sem Sinchenko breaks
down
features in Unitycatalog: the first look:
Enter
yourthe
email...
At the time of this writing, Unitycatalog looks more like a proof of concept or MVP than
a production-ready solution.
Subscribe
There are no audit capabilities, no external RDBMS persistent storage support. All ML/AI governance features are
By subscribing,
youpartitioning.
agree Substack's Terms of Use, and
currently missing. Big questions were raised about the lack of support
for hive-style

acknowledge its Information Collection Notice and Privacy
Policy.

Shortly after all of this, I came across unity-rs. Yes, we’ve now got another Unity rewrite, this time in Rust. The project
explains why it needs to exist. I don’t have a strong position on their points, but their server code caught my eye.
Already have an account? Sign in

Deja vu. Out of all of these announcements, all this marketing, and all this noise, we’ve gotten one partial re-write, one
empty Github project, and one hello world Rust file.
All of this bothers me a lot less than it used to. I believe unity-rs will get written, that Polaris will be released, and that
Databricks will invest in Unity. In Databricks’s defense, it’s often hard to extricate internal projects. A rewrite is often the
right move.
But it’s pretty strange to watch all of this play out. It appears the vendors have gotten ahead of themselves. I’m not even
sure they all understand why they’re open sourcing these projects. I’d love to see someone write down their data lakehouse
strategy, or at least do a better job of communicating what the end state of all this is. Right now it looks like flailing.
Other posts in this series are available here:

https://materializedview.io/p/data-lakehouse-catalog-reality-check

2/4

Data Lakehouse Catalog Reality Check

Begun, The Catalog Wars Have
CHRIS RICCOMINI · JUNE 20, 2024

Read full story

Make Lakehouse Catalogs Boring Again
CHRIS RICCOMINI · JULY 3, 2024

Read full story

Type your email...

Subscribe

Share

Book
Support this newsletter by purchasing The Missing README: A Guide for the New Software Engineer for yourself or
gifting it to someone.

Buy Now

Disclaimer
I occasionally invest in infrastructure startups. Companies that I’ve invested in are marked with a in this newsletter. See
my LinkedIn profile for a complete list.
12 Likes ∙ 2 Restacks

12

2

Share

Previous

Next

S3 Is Showing Its Age
I'm squarely in the trough of disillusionment with S3.
MAY 22, 2024 • CHRIS

35

https://materializedview.io/p/data-lakehouse-catalog-reality-check

6

3/4

Data Lakehouse Catalog Reality Check

Kafka: The End of the Beginning
A decade of focus on adoption has paid off. Now it's time to innovate.
MAY 30, 2025 • CHRIS

34

4

It's Time to Merge Analytics and Data Engineering (Again)
Data pipelines are commoditized and analytics engineers don't provide enough value.
NOV 18, 2024 • CHRIS

45

3

See all

Ready for more?
Type your email...

Subscribe

© 2026 Chris Riccomini · Privacy ∙ Terms ∙ Collection notice
Start your Substack

Get the app

Substack is the home for great culture

https://materializedview.io/p/data-lakehouse-catalog-reality-check

4/4
