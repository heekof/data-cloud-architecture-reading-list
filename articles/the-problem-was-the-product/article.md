# The problem was the product


benn.substack

The problem was the product

Subscribe

Sign in

How the modern data stack got lost.
FEB 16, 2024

39

37

1

Share

There is, it seems, a rough consensus forming about the Apple Vision Pro: The first version won’t change your life, but
future models might. Nearly every reviewer says that the headset that Apple launched a few weeks ago has too many
rough edges and technical inconveniences to revolutionize everyday living—the field of view is too narrow; small text is
hard to read; typing is frustrating; it’s an intensely solitary experience. However, despite its current limitations, the
device teases the much bolder thing that Apple really wants to build: True augmented reality, “where light passes directly
through unobtrusive glasses to your eyes, with digital information layered over the top of what you’re seeing.” They aren’t
trying to build an entertainment console; they’re building the next “accompaniment device,” meant to be as ubiquitous
and as revolutionary as the iPhone. 1

Notably, Apple hasn’t really said any of this. Tim Cook hasn’t trotted out a quarterly release schedule; there is no
corporate blog post talking about some master plan of putting a computer on every face in every home. Outside of a
couple sizzle reels, we’ve all been left to imagine what Vision Pro might become on our own. If the similarity of the
reviews are any indication, we’re all now anticipating the same future—not by being told what it will be, but by seeing it,
on two 4K TVs an inch from our eyes. 2

This, I think, is what makes a truly visionary product. Visionary products aren’t just things that seem to reach ahead in
time and pull something from the future into the present; they’re products that make that future obvious and inevitable
to people who couldn’t see it before. Visionary products aren’t the manifestation of someone’s dream; they’re products
that manifest the same dream in others. They don’t just teleport us to a new destination; they hang new stars in the sky,
navigating all of us, en masse and in sync, in the same direction.
Put differently, visionary products are Schelling points. 3 Schelling points are meeting points that people congregate
towards without any explicit instruction to do so. If you had to meet someone in Paris on Sunday and couldn’t make a
plan about when and where to do it, the Eiffel Tower at noon is a Schelling point. If two people had to say the same word

https://benn.substack.com/p/the-problem-was-the-product

1/8

The problem was the product

at the same time, and the only clue was “pepperoni,” “pizza” would be a Schelling point. And if you want to create a

benn.substack
revolutionary new way to embed technology into people's daily lives, the experiential potential of a product like the

Vision Pro is a Schelling point for an ecosystem of technologists trying to imagine what sort of computing paradigm
might be next, and how we might interact with it.
Apple imagined a future; they showed us that future through an incomplete but revelatory product experience; we now
understand that future, turning what was a vague and fuzzy and scattered vision of augmented reality into a singular
destination. And now, I suspect, thousands of developers are marching us towards that beacon.
Of course, the Vision Pro could still be a flop. That destination could be too ambitious, or not as compelling as people
think it might be. And Schelling points don't always work—some people could end up at the top of the Eiffel Tower,
some at the base, and some at Notre-Dame. 4

But it's hard to imagine the Vision Pro being revolutionary without a Schelling point. With no shared destination,

Discover more from benn.substack

engineers and partners and app builders will all chase different ideas. There won’t be an ecosystem of people standing on

A weekly Substack on data and technology, with some
occasional conversations about culture, sports, and
politics.

each other’s shoulders, working in rough harmony towards a common goal. There will instead be a community of
scattershot hobbyists and opportunistic founders, building in no particular direction at all.

This is one way to think about the convulsive collapse of the crypto market. Even after a decade of technological bluster,

Enter your email...

the crypto community never produced a coherent vision of what living in a blockchain-enabled future would actually look
like. There were a lot of vague promises about borderless financial markets, and smart contracts, and a decentralized

Subscribe

internet. But none of this felt tangible. The problems that the blockchain was supposed to solve were often abstract,
theoretical, and hard to locate in our daily lives. And so, no experientialBy
Schelling
points
everSubstack's
emerged.Terms
Instead,
subscribing,
you agree
of Use,most
and

acknowledge
its Information
Collection
Notice and
Privacy
companies worked for themselves, building their experience rather than
the experience.
Without
a shared
sense
of Policy.
direction, the ecosystem began to work against itself, fought itself, and pulled itself apart, until it splintered and
shattered and became a dying echo of what we were all promised it would be.

Already have an account? Sign in

Anyway, speaking of—the modern data stack.
Last week, Tristan Handy wrote an obituary for the term, saying that it’s outlived its usefulness: His argument, roughly
paraphrased, is this:
1. The birth: Almost ten years ago, a handful of companies started building SQL-forward, cloud-native reporting and
analytics tools. These products were often cheaper, more accessible, and easier to use than their legacy
predecessors.
2. The brand: The “modern data stack” became a convenient shorthand for describing these tools, and contrasting
them with other products that were from a different era, weren’t cloud-native, or focused on other data-based use
cases like machine learning and application observability. 5

3. The buzzword: As the modern data stack grew—partly because it was genuinely useful and partly because those
who were bankrolling it lost themselves to their animal spirits—the term started to lose its meaning. Legacy
products began to re-architect themselves around the modern data stack’s core tenets; investors began describing
any investment in data as an investment in the modern data stack; enterprise CIOs began shopping for modern data
stack vendors without any awareness of its underlying origins. The modern data stack no longer meant anything
specific; “it was just…a meme. A market trend.”
4. The blow out: A bunch of new startups, funded by historically cavalier venture capitalists, began chasing the same
trend. The data ecosystem filled out, with dozens of companies partnering together to build a collective, complete
solution for data and analytics teams.
5. The blow up: In 2022, the market turned. Funding rounds evaporated with rising interest rates, customers became
much more cost-conscious, and Silicon Valley began hyperventilating about AI 6 and not the modern data stack.

https://benn.substack.com/p/the-problem-was-the-product

2/8

The problem was the product

Data companies “put their heads down and focus on the fundamentals” and buyers “developed a strong preference

benn.substack
to buy integrated solutions rather than to buy many tools to construct a stack.”

6. The burial: And so, he concludes, we should bury the term, and rebrand this whole situation as the analytics stack.
“The cloud has won; all data companies are now cloud data companies. Let’s move on.”
Tristan is a more careful historian and more central character in the modern data stack’s story than I am, so I can’t
disagree with his narrative too much. But as a bigger cynic than him, I think he omits one very key element of this story:
The problem wasn’t the market around the products we were building; the problem was the product itself.
—
In the modern data stack’s early days, most vendors were trying to replicate what already existed, but in ways that were
bigger, faster, and cheaper. There was a fairly clear experiential Schelling point then—make data practitioners lives
better by recreating Oracle, MicroStrategy, Informatica, SAS, and a handful of other geriatric, proprietary, and expensive
data tools using the cloud, open-source languages, and consumer-grade user interfaces. Fivetran was Informatica and
SnapLogic, but automated and simple. “Snowflake saw an opportunity to modernize [the data warehouse] by reducing the
complexity and putting the whole thing in the cloud.” Mode’s early fundraising decks compared it to SAS, but powered
by SQL and Python.
It’s what happened next when things went wrong. Tristan describes the explosive phase that followed—the blow out, in
the narrative above—as a largely positive period of dynamic innovation and fruitful coordination:
The end-to-end problem was far too big for any one startup to solve, and so swim lanes were established and
partnership ruled the day.
There was a lot of valuable co-marketing, partnership deals, co-sponsored events, and co-selling. This had real value
for everyone involved—customers and vendors alike. Companies voluntarily integrated their products together, crosspromoted each other publicly, and built partnerships that made owning and operating these technologies far easier
for customers. …
This was a beautiful thing. Private capital fueling founders, who not only built their own products but were
consciously coming together to build an ecosystem, leading to the rapid buildout of interoperable products all taking
advantage of a new technology platform (the cloud).
That’s not quite how I would describe what happened? As it grew, the ecosystem didn’t continue marching towards the
vision that inspired it in its early years; it completely lost its bearings. The unifying experience that guided the original
modern data stack—old tools, made easy—got replaced with a bunch of catchphrases about instant insights, better
decisions, and data democratization—i.e., borderless financial markets, smart contracts, and a decentralized internet.
These ambitions dramatically expanded the modern data stack’s scope from streamlining how data teams were already
working to transforming how entire companies should operate.
But there was no agreement on how we’d do this. There was no visible picture of the collective experience the modern
data stack was supposed to create for people who weren’t data practitioners. So, everyone tried to figure out how to
“democratize data” or “empower decision-makers” on their own—and it turned into a mosh pit. Did documentation live
in a BI tool or a data dictionary? In whichever one you were selling. Were we replacing spreadsheets, or integrating with
them? Depends on if you thought you could compete with Excel. How would an executive know if they can trust the
dashboard they’re looking at? By logging into your product, probably. There was no Schelling point to build towards;
there were shills, pointing towards whatever thing they had built.
Moreover, we got distracted by circular problems of our own making. We created pipelines to shuffle data around, and
orchestrators to coordinate those pipelines, and observability dashboards to monitor the orchestrators, and incident

https://benn.substack.com/p/the-problem-was-the-product

3/8

The problem was the product

managers to organize the observability incidents. We weren’t just driving with no destination in mind; we also got stuck

benn.substack
in our own traffic on the way there.

Though the economics of the modern data stack were always tenuous, 7 I don’t think that Jerome Powell or Sam Altman
are who did us in. 8 The problem was that the modern data stack’s ambitions expanded—from helping data teams to

revolutionizing companies—with no communal vision for how to get there. There was money, and ambition, and loosely
shared philosophy that favored SQL and the cloud, but there were no answers to these questions:
It’s become popular to say that data teams should think of everything they create as a product, and the rest of their
colleagues as their customers. To build on this idea, what should that product be? What should it feel like to go from
question, through technology and tools, through collaboration and conversation, to an answer?
Our current solution, though full of pieces that are individually great, is a disjointed one. Some responsibilities, like
metric governance, are shared across multiple tools; others, like tracking what happens after a question is answered,
are mostly ignored. Even seemingly basic questions, like "where do I first go to ask a question?," don't have clear
answers. …
How should it feel to use modern data stack? What can the system add up to? What’s the best way for people to
answer an unfolding series of questions, to trust those answers, and to decide what to do next? What can we create for
people who care about how well the modern data stack works, regardless of where the lines are drawn between
products and services?
If you want to go fast, the proverb says, go alone. If you want to go far, go together.
Modern data stack vendors chose speed, and never attempted to truly build something together. Companies built
product integrations as a way to cross-sell, or to paper over feature gaps, or to ingratiate themselves with more successful
vendors. 9 But most partnerships were temporary and transactional agreements of mutual convenience that went cosponsored afterparty deep.
One way or another, we weren’t going to last by going it alone. We were going to have to develop a coherent vision as a
bunch of independent companies, or all get acquired and be handed that vision by a few big companies. So far, the latter
seems to be winning.
—
Still, a bigger question remains: Why weren’t we able to produce a more coherent vision for what the modern data stack
was supposed to become? Why has nobody been able to quite articulate how data products go beyond just streamlining
self-referential workflows, and become the transformative strategic asset that they proudly proclaim to be?
One answer is because they can’t. Data may not have that revolutionary power. It may simply be dryly utilitarian.
If that’s true, Tristan’s proposal for rebranding the modern data stack as the analytics stack would be a fitting coda. It
both reorients the ecosystem back towards its original goals of serving the needs of practitioners and away from the
buzzy neologisms that defined the last few years, and it has a sort of dull, workmanlike tone that will bore thrill seekers
and attract people who want to solve real problems. Whereas the modern data stack was expansive—it could be a

boundless platform; it could shape-shift its way into being a critical part of the $7 trillion dollar AI market 10—analytics
is a function. It is accounting: Small and localized and bound. And frugal:

https://benn.substack.com/p/the-problem-was-the-product

4/8

The problem was the product

In what other departments do companies need to buy a wide collection of expensive tools, bought by different people

benn.substack
and priced in different ways, to solve a single set of problems? Equivalent scenarios border on the absurd. Imagine

needing to build a CRM for a nascent sales team, and having to buy a tool for logging phone calls, a tool for logging
emails, a tool that stores these logs, a tool that helps sales reps see the status of their opportunities, a tool that helps
sales leaders keep track of their team’s performance, and a tool to alert you when other tools break. While products
like these may get hung off of Salesforce at some point, they’re bought by growing sales teams, not integral legs to an
eight-legged stool.
The other answer, however, is we simply built the modern data stack in the wrong way. It’s possible that the
transformative potential of data is real; we just lost sight of how to get there amid the riot. If we can figure out that
vision—if someone can reveal their dream to all of us, in a way so visceral we can dream it too—we can start chasing the
same thing again, as we did a decade ago, when the dream was smaller.
In other words, the bigger target—not just analytics, but organizational transformation—remains. The space got invaded
by hordes of new companies, and economic shock is nuking a lot of them out of existence. But the target remains.

Lost in the sauce or lost in the game?
Another—also cynical—way to think about the modern data stack is through the eyes of the people who created it. In a
recent post, Anu Atluru proposes that there are two types of entrepreneurs. Those lost in the sauce and those lost in the
game:
There are those in it for the love of the mission that they’re obsessed with championing. And there are those in it for
the love of the game of entrepreneurship itself, almost irrespective of the mission of the business. Sometimes the
mission is the business and sometimes the business is the mission. Type I, and Type II.
The data world, I’d argue, has very few true mission-driven, Type I founders. At best, most data founders are motivated
by bringing some elegance to an ugly technical problem; at worst, we were opportunists who convinced ourselves we
could turn some internal tool into a business, and saw founding a company as a way to avoid the career cul-de-sac of
becoming a mid-level data director. There aren’t many people who start data companies simply to manifest something in
the world. For most of us, it’s important that we manifest it, either because we’ll have fun building it or because we want
the rewards for doing so.
As Anu says, there’s nothing wrong with starting a company for those reasons; companies can exist for noble reasons,
and they can exist to make something great that makes a lot of money. Both are fine.
However, type II founders aren’t great when an ecosystem needs to collectively build something great, which is what the
modern data stack was. Had we all been chasing a mission, we might’ve figured out ways to help everyone get there. But
when we’re mostly there for the game, we care more about the individual role we’re playing than the communal thing
we’re building.

1

Although, I think there’s a very real possibility that the Vision Pro becomes an engulfing device. Because people are definitely
going to get addicted to this thing, right? According to one review, wearing a Vision Pro is like dreaming. You can conjure entire
worlds—soon, from nothing, literally, with obvious implications—and drown yourself in them. And, sure, they may be nothing
more than “hollow imaginings meant to augment reality through a laminated veil of glass and sensors.” But what if your actual
reality is already empty and isolated? What if detaching isn’t a downside, but exactly the point?
If millions of people already sink themselves into our crude Experience Machines—drugs, porn, video games—and disappear,
what hope do we have against the real thing?

https://benn.substack.com/p/the-problem-was-the-product

5/8

The problem was the product

2

Well, sorta. I’ve never used a Vision Pro, so, ironically, I’m basing this entirely on what I’ve been told about it.

3

It’s time for some game theory.

4

Complete tangent, but—The Bells of Notre Dame and Hellfire are two underrated (and, like, definitely not G-rated) Disney bangers.

5

For example, I don’t think anyone’s ever considered Scale AI or Honeycomb as part of the modern data stack.

6

There’s a lot to love about that TikTok, but the part at 0:53 where her sister sticks the card in the frame and says, “what does it

benn.substack

say?”—absolute gold.
7

And predictably so. From this blog, in the fall of 2021:
The ecosystem is creating category after category, throwing out product after product. Thus far, the market has absorbed them
—but the dynamic is unstable. With few dominant players and fewer agreed-upon categorical standards, customers are
choosing from a large inventory of small companies, offering dozens of startups enough of a foothold to reasonably claim that
they provide more value than they cost. Furthermore, because of the variance in buyers and business models, the true cost of
the stack is amortized across different teams and obfuscated by irregular billing logistics.
But data teams and IT departments have budgets. Even if every product is worth it on its own, the collective cost eventually
becomes too much to bear. Something has to give.

8

Here’s another way to ask this question. Had the economy stayed hot and ChatGPT stayed buried inside OpenAI, would the
modern data stack, as it existed in 2021, have survived? My vote: No.

9

What the LinkedIn post says: “We’re proud to announce that we’re a new Amazon Select partner! We’re excited to work with the
Redshift team to continue building great experiences for our customers! #data #Redshift #AWS #CantStopWontStop”
What the LinkedIn post means: “The only coordination between us and Redshift will be periodic emails from their partner
solutions manager reminding us that we need to upgrade our Redshift drivers if we want to keep our listing in AWS Marketplace.
And we only did this because we’ve missed our pipeline targets for the last three quarters. We know that this won’t fix it, but we
can show our increasingly anxious board that we’re doing something, and that might make us feel good for a minute.”

10 I mean, this is obviously stupid, but just so we’re clear: A $7 trillion investment vehicle isn’t a VC fund; it’s a centrally planned
economy. And that’s not suddenly a good thing, just because Sam Altman is your guy.

Subscribe to benn.substack

By Benn Stancil
A weekly Substack on data and technology, with some occasional conversations about culture, sports, and politics.
Type your email...

Subscribe

By subscribing, you agree Substack's Terms of Use, and
acknowledge its Information Collection Notice and Privacy Policy.
39 Likes ∙ 1 Restack

39

37

1

Previous

https://benn.substack.com/p/the-problem-was-the-product

Share

Next

6/8

The problem was the product

benn.substack
Discussion about this post
Comments Restacks

Write a comment...

Ari Bajo Feb 17, 2024 Edited
Liked by Benn Stancil

MDS tools have been solving the same technical problems on their own. Notably, integrations. Data movement, orchestration,
transformation, quality, bi tools... all need integrations for each data storage system... And each tool solved it from scratch,
with no common ground. Let me explain, when I worked for a BI tool, we wrote integrations to read data from data storages.
When I worked for a data movement tool, we wrote connectors to read and write data from data storages. When I worked for a
data quality tool, we wrote connectors to execute queries (tests) on data storages. Didn't work for a data orchestration tool,
but operators basically make API calls to external systems, notably data storages. The value is in the data, or metadata if the
system is not a data storage per se. And the common thing, is making api calls to these systems: read data, write data, query
data (execute tests), trigger actions (orchestration). If there was a common framework to interact with external systems, then I
think data tool companies could be more ambitious with a clear vision focused around data. We are missing standards, and a
vision like you said. A standard to connect to any external system and be able to read, write, query and trigger actions. Then
we need user experiences on top of that. And probably also a common standard on what to build user experiences.
LIKE (3)

REPLY

SHARE

3 replies by Benn Stancil and others

Nicole Edmonds Feb 19, 2024 Edited
Liked by Benn Stancil

Also, any outsider can look at Matt Turck's Machine learning AI, and data landscape and think - how in the, what?, am I to
make sense of this? There's no connections illustrated between all of these products, and even if there was, it would look like
every conspiracy theorist's pictures with string mood board. Hard to make sense of any gathering point in the chaos indeed.
My search turned up 2021's - how many products can one person know, have skills in, and even further, know now to fit it all
together? https://mattturck.com/wp-content/uploads/2021/12/2021-MAD-Landscape-v3.pdf)
LIKE (2)

REPLY

SHARE

35 more comments...

The end of YC

When engineers lose their edge.
FEB 28, 2025

393

58

59

The end of Big Data

Databricks, Snowflake, and the end of an overhyped era.
APR 8, 2022

84

https://benn.substack.com/p/the-problem-was-the-product

20

7/8

The problem was the product

The conglomerate

benn.substack
Not bundling or unbundling but a secret third thing.
JAN 13, 2023

16

14

See all

Ready for more?
Type your email...

Subscribe

© 2026 Benn Stancil · Privacy ∙ Terms ∙ Collection notice
Start your Substack

Get the app

Substack is the home for great culture

https://benn.substack.com/p/the-problem-was-the-product

8/8
