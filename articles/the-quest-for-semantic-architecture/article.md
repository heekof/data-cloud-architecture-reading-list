# The Quest for Semantic Architecture


Common Sense Data

The Quest for Semantic Architecture

Subscribe

Sign in

What would it take to finally connect data and meaning?
JUHA KORPELA
FEB 02, 2026

44

17

7

Share

We need more semantics. What we have now isn’t cutting it; not in terms of what our AI solutions need, but also not in
terms of what we humans need. Data needs context - has always needed, will always need. The current ways of
implementing semantics around data in most organizations are siloed and in fact quite poor in terms of actual semantic
content. We need to think about the bigger picture.
What is actually needed to enable holistic semantics management at organizational level, beyond individual tools?
How does meaning connect to data? What would it take to make our data understandable across solution boundaries,
technology boundaries, and business domain boundaries?
The answers seem to be way more complex than vendor promises would indicate (which perhaps comes as no surprise to
anyone). Previously, I wrote a piece about the “Semantic Layer” - a term that has many meanings already 1, but which for
most run-of-the-mill IT organizations (and most vendors) still refers to the same old idea about BI-oriented data sets
with some descriptions plugged in at the technical object level. Such a BI Semantic Layer is a good thing to have, but it’s
nowhere near an answer to the whole problem.

Why the "Semantic Layer" Isn't Enough for AI
JUHA KORPELA · JAN 26

Read full story

In fact, I’m not sure there is a fully formed answer yet, in terms of “do exactly this with these tools”. As an industry, we’re
very much in a discovery phase still: while some basic concepts for architecturally solid semantics management have
been established, actual real-life implementations are rare and haven’t consolidated around a specific best-practice
solution. Individual pieces of the puzzle have been found; some have been around for a long time (like the ontology stack)
and some sorely need reinventing (like data catalogs). Some thinkers have started putting the big picture together; some
have even proposed technical solutions already 2. But the picture is not crystal clear yet.

And I find this state of affairs to be extremely stimulating! I think we in the data industry might be on the verge of a
long-awaited revolution, where finally we are connecting the dots between data and knowledge - and this time for real.
GenAI is not going to be the final answer to everything, but it sure has pushed us forward in a direction we should’ve
taken a long time ago.
What a time it is to be in this business! To see something so big and interesting and possibly industry-changing shaping
up and taking form; to see old wisdom reinvigorated and joining forces with cutting-edge technology; to see all the hype,
the failures, the misplaced hopes, as well as the diamond-sharp thinking and the never-ending building, all happening at
the same time.
It’s just that there’s so much going on! We need to try to make some sense of it all. So what follows in this article (and likely
a couple of follow-ups) is my attempt to formulate what is going on, where we need to be heading, and how everything
might fit together. For me personally, this is where everything I am most interested in - semantics, data models,
architecture, metadata, operating models, even data products - seems to be converging. However, the vast majority of

https://commonsensedata.substack.com/p/the-quest-for-semantic-architecture

1 / 11

The Quest for Semantic Architecture

this is not my invention or innovation; I’m merely trying to conceptualize, in my own way, what others have been

Common Sense Data

thinking and talking and building 3.

Therefore, this is not going to be a how-to guide, but more like an hors-d’oeuvre - a bit 4 of brain food that hopefully
activates your appetite for proper Semantic Architecture. After all, pretty much everyone is now stumbling this way to
satisfy their hunger for context; we in this Substack might as well join the salivating crowds!
Oh - one more little disclaimer! I’m using the term “Semantic Architecture” here. I don’t think it’s really a proper term
for anything much, it’s just something that seemed a close enough fit for my purposes here, and I wasn’t able to come up
with anything better. Replace with your chosen buzzword at will! The concept itself is more important; “a rose by any
other name” and so on.
Now, onwards.

Starting points

Discover more from Common Sense Data

Writings on data that (should) make sense. Tackling the
difficult
non-technicallayproblems
relating to data
modeling,
Before we get into the Important Picture That (hopefully) Explains Everything,
we have todata
someoperating
groundwork.
Why
we
data governance,
team
models,
anddoman…
Over 1,000 subscribers

need this kind of architecture? Where does it come from?
I have tried to distill the basic starting points thusly:

Enter your email...

1. Data needs semantics around it to make it understandable and to place it in context. Both humans and AI need to be

Subscribe

have semantical information attached to the data they consume.

2. Data is everywhere, all around the place, and we might need basically any data from anywhere for some use case.

By subscribing, you agree Substack's Terms of Use, and

Our needs for utilizing data are so varied that there’s no way weacknowledge
can ever force
data to Collection
be used from
place only.
its Information
Noticeone
and Privacy
Policy.5

3. The most critical semantic information, i.e. information about the meaning of terms and concepts, is really

knowledge about how the business operates and what creates value in the business.
AlreadyIthave
is also
an account?
vitally Sign
important
in
to
connect these semantic concepts to each other, in order to truly represent business reality. This means that
semantics exists independently of technical data solutions.

4. Because of #1, #2, and #3, semantics must be managed separately, independent of data solutions. Defining and
managing semantics at the solution level will inevitably lead to chaos, as definitions drift and siloes multiply, and
individual shards of semantics will never be connected to each other.
5. Because of #1 and #4, there needs to be a solid connection between a data object and its semantic meaning. The data
object and the semantic concept will live in different layers (or on different planes), but they must be connected.
Our quest is to come up with something that covers all these points. There are of course all kinds of other requirements
to consider, as well, but let’s just use these as our absolute basic principles for now.

Semantic Architecture piece by piece
We’ll start building the Important Picture That (hopefully) Explains Everything now, and we’ll do it piece by piece, so that the
thinking process is easier to follow.
What I’m about to lay down here is something many have written and spoken about. I’m particularly fond of the thinking
of Andrea Gioia; you can find a recording of his presentation in Data Mesh Live ‘25 here 6. Tony Seale has been writing
about this kind of stuff on LinkedIn, likewise many others in the graph & knowledge management scenes like Jessica
Talisman, Katariina Kari, and Juan Sequeda. Prukalpa writes from the metadata management angle. You could also
rather easily argue that John Giles with his “Data Town Plan” concept is part of the same continuum. There are many

https://commonsensedata.substack.com/p/the-quest-for-semantic-architecture

2 / 11

The Quest for Semantic Architecture

others as well. I can’t for the life of me remember which details I have picked from whose output, so I’ll just give a

Common Sense Data

blanket recommendation to follow them all!
Again, I’m trying to present the concepts my way, while original ideas most likely come from others (those named above
+ many more) 7.

Data Plane

Data Plane

The Data Plane is where the actual data lives in. Your databases, files, whatever - they are all here. And I do mean all: I
am not separating “operational” and “analytical” data here. All data, anywhere, any format, any purpose.
You might also notice that in the above diagram, I have cheekily included a box labeled “BI Semantic layer”. Yes, for the
purposes of this setup, all that stuff goes into the Data Plane. After all, they’re just components containing data, like any
database view or any other object.
There’s also a couple of “interfaces” - APIs, usually intended for machines, and dashboards, which I am here considering
to be simply user interfaces into physical data. Again, both are just a type of a component for our purposes here.
If you’ve read my earlier writings on this Substack, you will probably by now know that I tend to ask (or rather, demand)
my readers to take quite a few steps back and zoom out. This is exactly what is happening here!
All the technical stuff we usually do, all the data engineering work, happens here. Simple as that!

Knowledge Plane

https://commonsensedata.substack.com/p/the-quest-for-semantic-architecture

3 / 11

The Quest for Semantic Architecture

Common Sense Data

Data & Knowledge Planes

Now we’re getting to the interesting part. As I mentioned above, I consider it a very basic and entirely unavoidable
principle that semantics must be managed independent from data. This separation is absolutely vital. Therefore, there needs
to be another layer on top of our Data Plane; this is the Knowledge Plane.
What is inside this plane? Semantics. And, as I’ve written before, I like to simplify what “semantics” actually is as
follows:
Terms and concepts (“Customer”, “Delivery Address”, “Sales Price”)
Definitions of those terms and concepts (“Customer” is a person who buys our products)
Relationships between them (“Customer” has a “Delivery Address”)
All this lives within the Knowledge Plane.
Now you ask, is this an ontology? Is this stored in a knowledge graph?
Maybe. Probably, even. It would make a lot of sense if it was, to be honest! But it doesn’t have to be. Right now, we just
need to understand that this semantic information is managed separately in its own layer, and it’s made of the
aforementioned things. Its format, syntax, or storage are of secondary importance at this point.

Semantic Linking

https://commonsensedata.substack.com/p/the-quest-for-semantic-architecture

4 / 11

The Quest for Semantic Architecture

Common Sense Data

Linking the two planes

Semantic Linking is the connection we need between the two layers in order to give data its meaning.
It must be a link between a specific data object (table, column, whatever) and a specific semantic object (term). Note that
I’m not saying anything like “it must be a link between an attribute and a KPI definition”! No, we must be able to

connect semantics to all kinds of objects at all kinds of levels, in all kinds of systems (operational or analytical) 8. Perhaps
there is a higher-level semantic concept of “Counterparty Management” or something that we want to connect with an
entire system? That should be equally as possible as connecting an attribute with a KPI 9.

It also has to be a many-to-many link. Data about the same semantic concept can appear in many places, and all those
places MUST link to the same semantic concept! This is a basic necessity for semantic interoperability (i.e. the ability to
connect different data objects based on the knowledge that they tell us about the same real-life things).
I’ve been toying with a silly idea of calling the Semantic Linking the “isaboutness” of data. You know, “what is this data
about”? I’m not sure if this is a good idea, but I’m probably going to use it in the future nevertheless 10.

This layer contains an important, as-of-yet unanswered question. Where does this link live? Andrea Gioia places it in its
own metadata plane, the Information Plane, in which these mappings exist as part of Data Product Descriptions. That
might well be a solution, but we will leave this question hanging in the air for now (I will likely write another piece
specifically about this linking layer later).
Interestingly, there was an article on LinkedIn recently by Francois Rosselet. He had actually built these layers and the
links between them! The article goes into some technical detail about various dbt files and Data Vault objects, but if
you’re OK with that it’s worth a read. My intention here is to just lay out the basic concepts and not go into
implementation details, but it’s great that someone has gone further and worked out how to build this.
However, we have a couple more very important pieces to consider - not new planes, but something that deserves equal
treatment in the Important Picture That (hopefully) Explains Everything.

Semantic Discovery
Where do the semantics come from?
I find it interesting that we so often focus on the “place where to put things” and the “format in which things should be”,
and relatively rarely discuss the “how on earth do we get the things in the first place” part.

https://commonsensedata.substack.com/p/the-quest-for-semantic-architecture

5 / 11

The Quest for Semantic Architecture

Common Sense Data

Adding Semantic Discovery

We can identify three basic means of discovering new semantic information for our Knowledge Plane:
Human-driven semantic discovery: there’s a lot of tacit knowledge in people’s heads. A very good way to get
information out of a person’s head is to talk with them. Knowledge Management experts and Conceptual Modelers
can do that. Often, these efforts should be focused on the unique semantics of the organization: the most valuable
and most critical core part that we simply can’t afford to miss or mess up. And of course, the humans can be assisted
by AI or other tools!
AI-generated semantics: we all know it’s going to be done in any case, right? And a lot of it is going to be complete
nonsense 11. But consider this: if we have human-created core semantics in place, and we use AI smartly to crawl

through tons and tons of documentation and other content, we could append that core with information that would
otherwise be completely infeasible to gather with human effort. And of course, a human needs to be in the loop in
any case.
External semantics: there are tons and tons of pre-defined semantics everywhere. Industry standard data models,
ontologies for all kinds of purposes, vocabularies, glossaries, you name it. There’s no reason to not use this
information to support your Knowledge Plane - the trick is in figuring out what content to use and how. Blindly
accepting a generic ontology as the basis of your semantic backbone simply means you have just forfeited all
possible competitive advantage.
This is an extremely important part of the big picture. Semantics is not a one-off project, it must be maintained and cared
for. I will certainly be writing more about this area going forward, as I think it warrants much more focus.
But we have one more puzzle piece left.

https://commonsensedata.substack.com/p/the-quest-for-semantic-architecture

6 / 11

The Quest for Semantic Architecture

Utilization
Common Sense Data
Of course, the whole point of such architecture is that it’s somehow useful. Everyone who doesn’t live in a barrel has by
now probably heard that AI agents need context. I’m not going to into too much details of what that means exactly;
rather, I’d like to propose that this is not the only reason to have your semantics in good order!

Utilization of semantics (and only that, because I’m saving the full picture for the next part!)

For GenAI, of course the important thing is that it gets organization-specific context. LLMs already “know” that an

“employee” is a “human” 12, but what it doesn’t know is that in our organization a “trainee” is not an “employee”. This
kind of knowledge is that critical part of semantics I mentioned above.
When we have our semantic concepts neatly arranged and connected to each other, we can offer contextual information
to other applications as well. Many webshops like Amazon and Zalando are built on extensive product taxonomies and
ontologies; the search capabilities require carefully curated semantic information, a vast knowledge base connected right
into the storefront app.
The same can, could, and should be the case with data, too. Data catalogs are all about data discovery - finding data you
need when you need it, without going around asking your colleagues if they know where we keep logistics costs data. If
the Data Plane is properly connected to the Knowledge Plane via Semantic Linking, “what do we have on logistics costs
and where” becomes a trivial question. Interestingly, while this has been a direction many data catalog vendors are
heading, not many of them have got it working properly. The reason? There’s no Semantic Architecture in place, just
some haphazard (and occasionally desperate) attempts to document individual tables and columns inside the catalog tool
itself. But we’ll get into this use case later in more detail, for sure!
Many other use cases could of course be identified. I’ve chosen these three rough categories here more as an example.
The important thing is to realize that the same Knowledge Plane should be built to serve all kinds of use cases, not just
the currently hottest one.
With the final piece of the puzzle covered, we can now get to the end.

The Important Picture That (hopefully) Explains
Everything

https://commonsensedata.substack.com/p/the-quest-for-semantic-architecture

7 / 11

The Quest for Semantic Architecture

Common Sense Data

Semantic Architecture, or my interpretation of it

There it is, the whole thing. That’s what I think we’re heading towards.
Don’t get me wrong, it’s nowhere near complete - there’s a lot of detail to be covered! I want to go deeper into the nature
of the Knowledge Plane, that of Semantic Linking, and how I think Semantic Discovery should take into account
feedback loops between solution-level and enterprise-level activities (a topic that is always in my mind).
You might also, understandably, ask, where’s the practical detail? How does one build this? Has someone built it? I
provided an example earlier; I’m hoping I’ll be able to add some more technical considerations later, too. But at the same
time, I don’t want to go too deep into all that: I believe understanding the overall concept is at this point the key 13.

Everything is in flux, tools and vendors come and go. Get the big picture in your head and you’ll find it easier to navigate
the changing seas. The quest continues, and it’s going to be an interesting one!

Thank you for reading this rather long article. I considered splitting it up, but I also really wanted to have the whole
concept laid out in a single article, come what may. So here it is! Please comment if you have thoughts; subscribe if you’d
like to be notified of upcoming articles; and consider sharing this if you found it thought-provoking or indeed appetiteinducing.
Until next time - cheerio!

Type your email...

Subscribe
Share

https://commonsensedata.substack.com/p/the-quest-for-semantic-architecture

8 / 11

The Quest for Semantic Architecture

Common Sense Data

1

How ironic!

2

Links and references will follow (hopefully; see the next footnote).

3

I will try to give credit where credit is due whenever I possibly can. Unfortunately, I don’t always remember where I first
encountered which concept. There are so many articles, videos, podcasts, and discussions going on, and it all just gets mushed in
my head! So please forgive me in advance. Perhaps we could agree on a basic rule: if an idea you read here seems particularly
clever, you may freely consider it to be invented by someone else (and maybe I just forgot to mention it). If, however, something
seems very stupid, you can by default attribute that part to my original thinking.

4

Or, well, actually it’s quite a long article… Imagine the chef had megalomania and the canapé is the size of your palm!

5

In other words, forget about the “BI Semantic Layer” being the universal access point to data. There’s a million use cases out there
that will never touch that.

6

I was in the audience, and it was nothing short of a revelatory presentation. Good discussions with Andrea over some pints
afterwards, too - he’s a great guy! By the way, I happen to have the privilege of presenting my own stuff in the next Data Mesh Live
conference in June ‘26 in Antwerp. If you are reading this prior to that date, do join us! If you have stumbled upon this article
some time in the future and that’s already in your past, then I’m either happy to have met you or sorry that you missed it: in any
case, I’m sure it was fun!

7

If I have inadvertently misunderstood or misrepresented someone, that is of course my fault alone.

8

Of course, we can and we should prioritize our efforts so that the most important data objects get their semantic linking first. Or
perhaps the most important semantic concepts should get their linked data objects first??

9

There’s a weird myopia in the industry where semantics is often only considered at attribute/column/field level. I understand that
“Customer Lifetime Value” is represented by a column, and it needs a definition. But what is a “Customer”, then, and where is
that explained???

10 Remember the basic rule we agreed about attributing stupid ideas…
11 And, knowing how the discussion went with e.g. Agile and Data Vault and other similar methods, people will end up saying that
“semantics is useless” because their AI agent produced dadaist poetry instead of a perfect ontology.
12 Or is it?
13 And, to be honest, technological finesse has never been the main selling point of this Substack!

Subscribe to Common Sense Data

By Juha Korpela · Launched a year ago
Writings on data that (should) make sense. Tackling the difficult non-technical problems relating to data modeling, data governance,
data team operating models, and many more!
Type your email...

Subscribe

By subscribing, you agree Substack's Terms of Use, and
acknowledge its Information Collection Notice and Privacy Policy.
44 Likes ∙ 7 Restacks

https://commonsensedata.substack.com/p/the-quest-for-semantic-architecture

9 / 11

The Quest for Semantic Architecture

Common Sense
44
17 Data 7

Previous

Share

Next

Discussion about this post
Comments Restacks

Write a comment...

Martin Chesbrough Feb 3
Liked by Juha Korpela

Hey Juha, I have 2 suggestions for you: one useful (I hope) and the other not so much.
On the useful side I’d like to see that you have some arrows in the diagram that loop back between the Utilization bit and the
Discovery bit. Applications create new data, that data has to have meaning, the meaning (in the context of the app that
created it) has to be discovered within the rest of the org. I see a bunch of feedback loops that connect different levels of
discovery.
On the less useful side I’d advise that, in any moderately complex org, there are several versions of your model at play. Sales
and marketing will have their discovery-data-semantics-utilization system, and finance will probably have a different version of
it. People often want the same thing to mean different things for them. Meaning (as in semantic meaning) is a conversation not
an absolute. Meaning evolves as conversations happen.
LIKE (2)

REPLY

SHARE

1 reply by Juha Korpela

Jim Grafton Feb 2

Liked by Juha Korpela

The data function has increasingly mirrored the technology function and, in some cases, exceeded it in scope. In doing so, it
has absorbed an implicit assumption: that more data, better platforms, or greater centralisation will resolve decision-making
problems.
That assumption is false.
Data does not create context. Context is produced by strategy, operating models, decision rights, incentives, and domain
ownership. A data function can optimise storage, movement, and representation, but it cannot determine what matters, why it
matters, or how trade-offs should be made.
As a result, larger and more complex data platforms often slow, rather than accelerate, access to new and relevant
information. Each additional layer of abstraction, harmonisation, and governance increases the time between a business
question emerging and the system being able to answer it.
LIKE (2)

REPLY

SHARE

2 replies by Juha Korpela and others
15 more comments...

https://commonsensedata.substack.com/p/the-quest-for-semantic-architecture

10 / 11

The Quest for Semantic Architecture

Common Sense Data

Conceptual, Logical, Physical - the Truth(*) About Data Models

(*)my personal, extremely opinionated view, which just seems to make a lot of practical sense
OCT 13, 2025 • JUHA KORPELA

49

5

8

The ABSOLUTE Basics of Data Architecture

Taking a looooong step back from all the “markitecture” and seeing the big picture (or actually, just one picture)
NOV 24, 2025 • JUHA KORPELA

50

7

3

6

4

Solution-level Thinking is Killing Us
How to drown yourself in spaghetti
MAR 28 • JUHA KORPELA

49

See all

Ready for more?
Type your email...

Subscribe

© 2026 Juha Korpela · Privacy ∙ Terms ∙ Collection notice
Start your Substack

Get the app

Substack is the home for great culture

https://commonsensedata.substack.com/p/the-quest-for-semantic-architecture

11 / 11
