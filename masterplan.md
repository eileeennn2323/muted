# Muted — Masterplan

## 1. Product Overview

**Muted** is a private AI-powered relationship intelligence assistant for people at work.

Its purpose is to turn messy workplace observations into a living playbook that helps users:

1. **LEARN** — capture and organise what they learn about people, workplace dynamics, and themselves.
2. **PREDICT** — anticipate what someone may care about, ask, challenge, or respond to.
3. **STRATEGISE** — decide how to communicate and approach a specific future interaction.

Muted is not a CRM, meeting-notes app, personality test, or employee-rating system.

The core promise is:

> **Your private second brain for people at work.**

Muted should help users answer practical questions such as:

- What does this person care about?
- How should I communicate with them?
- What will they probably ask?
- What should I avoid saying or doing?
- How should I approach this specific situation?
- What have I learned about myself from previous interactions?
- What lessons from past situations are relevant now?

---

# 2. Why Muted Exists

Workplace relationships are full of useful observations:

- what a boss tends to ask,
- how a stakeholder prefers information,
- what makes someone push back,
- how two people behave around each other,
- lessons from difficult conversations,
- communication mistakes worth avoiding,
- and patterns in the user's own behaviour.

Today, these insights are often:

- buried in meeting notes,
- scattered across personal notes,
- remembered inconsistently,
- difficult to connect across time,
- and rarely turned into actionable guidance.

Muted turns these fragments into structured, evolving relationship intelligence.

---

# 3. Target Audience

Muted is designed for **anyone working in a corporate environment**.

Typical users include:

- individual contributors working with different bosses and stakeholders,
- managers working with subordinates,
- employees preparing to communicate with senior management,
- leaders trying to understand how to work with their own bosses,
- cross-functional team members,
- PMs, UX practitioners, consultants, analysts, engineers, and other knowledge workers.

The relationship being understood could be:

- employee → boss,
- manager → subordinate,
- peer → peer,
- employee → senior management,
- employee → stakeholder,
- cross-functional colleague → colleague.

The common need is:

> **“I need to work effectively with this person, but I don't fully understand how they think, what they care about, or how they may respond.”**

---

# 4. Product Principles

## 4.1 Simple input, intelligent organisation

The user should not have to classify information before capturing it.

Primary behaviour:

> **Open Muted → type or paste anything → Submit.**

Muted handles the categorisation.

---

## 4.2 Show intelligence, not process

Muted may perform complex reasoning behind the scenes, but the interface should remain simple.

After analysing a note, show a concise summary rather than exposing every classification step.

Example:

**Picked up**

- **John** — Cares about delivery risk
- **Sarah** — Manpower is a key concern
- **John ↔ Sarah** — Possible pattern: John challenges her estimates
- **Lesson** — Raise resource constraints early

The user does not need to approve every item.

They only intervene when something is wrong.

---

## 4.3 Muted does not label people

Muted builds **working hypotheses**, not fixed personality labels.

Bad:

> John is risk-averse.

Better:

> **Possible pattern:** John tends to stress-test proposals for risk.

Insights should evolve as new evidence appears.

---

## 4.4 Useful even when uncertain

Muted should not refuse to help simply because evidence is limited.

Instead:

> **Not enough history to predict this confidently.**  
> Based on your previous interaction, John seemed focused on delivery risk.

Muted should then give a reasonable best-effort approach.

---

## 4.5 Evidence should always be available

Predictions and recommendations should be concise by default.

A collapsed **“Based on…”** section should allow the user to inspect the notes or interactions supporting the advice.

---

## 4.6 The user should not maintain a CRM

Manual profile fields should be minimal.

For a person:

- **Name**
- **Role to me** — optional

Possible roles:

- Boss
- Upper Management
- Stakeholder
- Peer
- Subordinate
- Other

A person may have more than one role and roles may change over time.

Everything else should primarily come from captured notes.

---

# 5. Core Product Loop

The central loop is:

**Capture → Understand → Remember → Connect → Advise → Learn**

### Before an interaction

User asks:

> “I need to ask John for a two-week delay tomorrow. How should I approach it?”

Muted uses accumulated memory to prepare them.

### During / after an interaction

User writes:

> “John kept asking about downstream impact. He was okay once I showed the mitigation plan.”

Muted analyses the interaction.

### Learning

Muted updates:

- John's playbook,
- relationship dynamics,
- relevant lessons,
- the user's own patterns.

### Next interaction

The accumulated understanding improves future predictions and strategies.

This loop is the core of the product.

---

# 6. Memory Model

Muted should maintain several connected types of memory.

## 6.1 People Memory

Knowledge about a specific person.

Examples:

- what they care about,
- communication preferences,
- recurring questions,
- things that work,
- things to avoid,
- behavioural patterns.

---

## 6.2 Context / Interaction Memory

Knowledge about what happened in a specific meeting, conversation, or situation.

This may include:

- meeting context,
- general atmosphere,
- tension,
- reactions,
- decision dynamics,
- who influenced whom,
- situational details that should not be permanently attributed to one person.

Example:

> “The room became tense when the timeline was discussed.”

This is useful even if it cannot be assigned to one person.

---

## 6.3 Lessons Memory

Reusable lessons learned from workplace situations.

Muted should keep the number of themes small.

Initial themes:

1. **Communication**
2. **Leadership**
3. **Stakeholder Management**
4. **Personal Growth**

Avoid expanding into general productivity or project-management knowledge unless it is directly relevant to working with people.

Muted should automatically suggest the category.

A lesson should belong to no more than two themes.

---

## 6.4 Relationship Memory

Muted should understand relationships between people as first-class intelligence.

Examples:

- John tends to challenge Sarah's estimates.
- Sarah explains more detail when John is present.
- John becomes more cautious when Alvin joins the meeting.
- Two stakeholders often align on a certain issue.

Relationship patterns should influence future advice.

Advice for:

> “Meeting John”

may differ from:

> “Meeting John and Alvin.”

---

## 6.5 About Me Memory

Muted should gradually learn about the user as well.

This is not a personality test.

It is a working understanding of:

- communication habits,
- repeated mistakes,
- strengths,
- reactions under pressure,
- things the user is trying to improve,
- lessons the user keeps encountering.

Examples:

> **Pattern:** You tend to explain too much when challenged.

> **Try:** Answer the question first. Add context only if needed.

This enables two-sided relationship intelligence:

> **Understand them + understand yourself + choose the best approach.**

---

# 7. Inference Model

Muted should use an **intelligent but cautious** inference philosophy.

The main distinction shown to users should be:

### User-provided information

The user wrote or pasted it.

### Muted inferred

Muted derived a pattern or conclusion from the user's notes.

Example:

> **Muted inferred:** John may respond better to risks when there is a clear mitigation plan.  
> **Confidence:** Medium.

Do not burden the main interface with detailed provenance labels unless required.

---

## 7.1 Confidence

Suggested conceptual levels:

- Low
- Medium
- High

Confidence may consider:

- number of supporting interactions,
- recency,
- consistency,
- contradictions,
- explicit user correction.

---

## 7.2 Evidence

Every inferred insight should retain links to the notes supporting it.

This allows a collapsed:

> **Based on…**

section.

---

## 7.3 Evolution

Muted's playbooks should show the **current best understanding**.

Old conclusions should not remain frozen.

Example:

Initial understanding:

> John dislikes detailed presentations.

After more evidence:

> John wants presentations to get to the point. Detail is useful during technical reviews.

Users should be able to inspect the evidence behind the current understanding.

---

## 7.4 Corrections

If Muted is wrong, correction should be lightweight.

For an inference:

- Edit / correct
- Remove
- Optionally prevent a clearly wrong inference from returning

A user's explicit correction should outweigh older AI inference.

---

## 7.5 Source-note changes

Memory should be self-correcting.

If a user edits or deletes an old note:

- insights supported by that note should be reconsidered,
- confidence may decrease,
- unsupported patterns may disappear,
- contradictions should be resolved into the current best understanding.

---

# 8. Core Screens

## 8.1 Home / Capture

This is the launch screen.

The dominant element should be a large text area.

Users can paste or write:

- meeting notes,
- an email,
- a message,
- a one-line observation,
- a long brain dump,
- a lesson,
- meeting dynamics,
- thoughts about themselves.

Primary flow:

1. Enter text
2. Submit
3. Claude analyses it
4. Muted updates memory
5. Show concise **Picked up** summary
6. User can correct anything if needed
7. Capture box becomes immediately available again

No mandatory classification.

No mandatory review step.

---

# 9. People

The People section houses each person's living playbook.

## 9.1 People List

Keep it simple.

Show:

- Name
- Optional role to me
- Small useful indicator such as recent activity or confidence

Search should be the primary way to find someone once the list grows.

---

## 9.2 New Person Detection

When a captured note contains someone who does not yet exist:

> **2 new people found**  
> John · Sarah  
> **Add both**

New people require lightweight confirmation.

Existing people should be automatically linked when Muted is confident.

If names or aliases are ambiguous, Muted should ask before merging.

---

## 9.3 Person Playbook

The core person page should answer five questions:

### 1. What they care about

Priorities, concerns, motivations, recurring areas of attention.

### 2. How to communicate effectively with them

Useful communication patterns and preferences.

### 3. Questions they will probably ask

Recurring questions or challenges.

### 4. What to avoid

Phrases, behaviours, framing, or approaches that have repeatedly worked poorly.

### 5. Suggested approach

Context-sensitive guidance for working with this person.

Supporting raw notes, quotes, evidence, and history should sit one level deeper.

---

## 9.4 Relationship Cards

Person pages should show relevant relationships.

Example:

**John ↔ Sarah**

> John tends to challenge Sarah's estimates. He responds better when she brings a recovery plan.

**Muted inferred · Medium confidence**

For the hackathon, explore a lightweight visual representation as well.

Example:

**Sarah ─── John ─── Alvin**

With short relationship labels.

This should remain simple rather than becoming a complex interactive network graph.

On mobile, relationship cards are the default.

---

# 10. Lessons

Lessons should feel like a personal library of reusable wisdom, not another chronological notes feed.

Initial themes:

- Communication
- Leadership
- Stakeholder Management
- Personal Growth

Each lesson may include:

- concise lesson,
- short explanation,
- relevant people,
- relevant situations,
- number of supporting examples.

Example:

> **Admit the issue before explaining it.**  
> When a senior stakeholder already sees what went wrong, defending the old decision first can make the conversation worse.

Muted should actively surface relevant lessons during Ask Muted conversations.

---

# 11. Me

The Me section is a living playbook about the user.

Suggested areas:

### Patterns

Repeated behaviours Muted has noticed.

### Strengths

Things the user repeatedly does well.

### Watch Outs

Patterns that may work against the user.

### Working On

Areas the user appears to be trying to improve.

### Relevant Lessons

Lessons repeatedly connected to the user's own behaviour.

Muted should remain direct and practical.

Avoid personality typing.

---

# 12. Ask Muted

Ask Muted is the conversational intelligence layer.

Users should be able to speak naturally.

Example:

> “I need to ask John for a two-week delay tomorrow. He's probably going to push back. How should I approach this?”

Muted should automatically combine:

- John's people memory,
- relevant relationships,
- current situation,
- previous interactions,
- lessons,
- About Me patterns.

---

## 12.1 Ideal Response Structure

Keep responses concise and action-oriented.

Example:

### Approach

Lead with the impact and mitigation plan.

### Expect

- Why the delay is necessary
- Downstream impact
- Whether there is a fallback

### Avoid

Do not spend too long explaining the background before answering his question.

### Watch yourself

You tend to add context when challenged. Answer first, then explain if needed.

### Based on…

Collapsed by default.

---

## 12.2 Conversation History

Ask Muted should remember recent conversations.

The distinction is:

- **Chat history** = conversational continuity
- **Memory** = durable long-term learning

Useful observations or lessons discovered through chat may be distilled into memory.

Users should not need to manually organise conversations.

---

# 13. Tone of Voice

Muted is designed initially with a Singaporean corporate audience in mind.

This does **not** mean Singlish.

Tone should be:

- straight to the point,
- practical,
- concise,
- calm,
- simple English,
- matter-of-fact,
- non-judgmental.

Avoid:

- corporate jargon,
- therapy-speak,
- excessive encouragement,
- verbose explanations,
- dramatic psychological labels,
- fluffy AI language.

Bad:

> “You may benefit from reflecting on whether your communication approach is contributing to stakeholder friction.”

Good:

> **Pattern:** You tend to explain before acknowledging the concern.  
> **Try:** Acknowledge it first, then explain.

---

# 14. Visual Design Direction

Muted should follow the supplied brand direction.

## 14.1 Overall Feel

- warm,
- quiet,
- private,
- thoughtful,
- editorial,
- confident,
- uncluttered.

The interface should feel like a **private intelligence notebook**, not a corporate dashboard.

---

## 14.2 Colour Direction

Use:

- **Warm cream / rice-paper background**
- **Dark cocoa / near-black text**
- **Cedar green** for primary actions
- **Brass / muted gold** for Muted-generated insights
- **Ochre red** sparingly for caution, destructive actions, or incorrect information

Follow the principle:

> **One accent per screen where possible.**

---

## 14.3 Typography Direction

Based on the current brand guide:

- **Newsreader** — headings / display moments
- **DM Sans** — body text and UI
- **JetBrains Mono** — sparingly for timestamps, confidence labels, metadata, or privacy cues

---

## 14.4 UX Principles

- large touch targets,
- responsive design,
- mobile-first consideration,
- very little visual clutter,
- important advice readable within seconds,
- progressive disclosure,
- evidence collapsed by default,
- no giant dashboards,
- avoid unnecessary charts.

---

# 15. Platform Strategy

## Hackathon

Build a **responsive web application**.

It must work well on:

- desktop,
- laptop,
- mobile browser.

Host at a public Vercel URL so judges can access it directly on their phones.

Do not build native iOS or Android apps during the hackathon.

---

## Future

If Muted proves useful, consider a proper mobile application later for:

- biometric unlock,
- quick capture,
- push notifications,
- stronger native-device integration.

---

# 16. Hackathon Demo Access

Judges should not create accounts.

The demo should be frictionless.

## Mobile

Show a **mock facial-recognition unlock experience**.

This is a visual simulation only.

## Desktop

Show a **mock four-digit PIN unlock experience**.

This is also a demo interaction, not real security.

The demo should contain only fictional workplace information.

Never place the user's real private notes behind mock authentication.

---

# 17. Demo Mode

The public hackathon experience should open into a pre-populated fictional workspace.

Judges should be able to:

1. explore fictional people,
2. inspect playbooks,
3. view lessons,
4. see relationship intelligence,
5. explore Me,
6. Ask Muted,
7. paste their own sample note.

Judge-entered information should remain isolated from the shared fictional dataset.

Prefer temporary demo-session behaviour so one judge does not affect another judge's experience.

---

# 18. High-Level Technical Stack Recommendation

The goal is simplicity and maximum leverage for a solo one-week Claude Code build.

## Frontend

**Responsive modern web framework suitable for Vercel deployment**

Requirements:

- strong responsive support,
- straightforward server/API integration,
- easy deployment,
- one codebase for desktop and mobile web.

Avoid separate mobile codebases during the hackathon.

---

## Hosting

**Vercel**

Why:

- fits the public-URL requirement,
- quick deployment,
- straightforward hackathon workflow,
- suitable for a responsive web product.

---

## Backend / Database

**Supabase**

Use as the managed backend for persistent application data.

Why it fits Muted conceptually:

- Muted's information is highly relational,
- a note may involve several people,
- multiple notes may support one inference,
- relationships connect people,
- lessons connect back to situations and people,
- future user accounts require strong data separation.

Keep the schema small and understandable.

Do not over-engineer infrastructure during the hackathon.

---

## AI

**Claude API**

Claude powers:

- note analysis,
- structured extraction,
- inference,
- memory refinement,
- relationship reasoning,
- lesson generation,
- About Me insights,
- Ask Muted answers.

For the hackathon, use one AI provider only.

Do not build a model-switching architecture.

---

# 19. Conceptual Data Model

This is conceptual rather than implementation-specific.

## User

Represents the owner of a private Muted workspace.

Future fields may include:

- identity,
- preferences,
- privacy settings.

Hackathon demo mode may use a fictional or temporary workspace.

---

## Person

Core fields:

- identifier
- name
- role(s) to user

Keep manually maintained attributes minimal.

---

## Note

Represents raw captured text.

Possible conceptual attributes:

- raw content,
- timestamp,
- owner,
- edit history,
- linked people,
- related situation.

The original note should remain preserved as evidence.

---

## Interaction / Context

Represents a meaningful workplace situation identified from notes.

May connect:

- several people,
- relevant observations,
- relationship behaviour,
- lessons,
- inferred patterns.

---

## Person Insight

An evolving understanding about a person.

Possible types:

- cares about,
- communication,
- likely questions,
- avoid,
- approach,
- other observed pattern.

Should include:

- current wording,
- confidence,
- supporting evidence,
- whether Muted inferred it.

---

## Relationship Insight

Represents behaviour or dynamics between two or more people.

Example:

> John challenges Sarah's estimates more when reviewing delivery dates.

Should include evidence and confidence.

---

## Lesson

Reusable people-related lesson.

Belongs to one or at most two of:

- Communication
- Leadership
- Stakeholder Management
- Personal Growth

May link to:

- people,
- situations,
- supporting notes.

---

## Self Insight

Represents About Me knowledge.

Possible types:

- pattern,
- strength,
- watch out,
- working on.

---

## Conversation

Represents Ask Muted conversation history.

Useful discoveries from a conversation may become durable insights separately.

---

## Evidence Link

Conceptually connects:

- raw notes,
- person insights,
- relationship insights,
- lessons,
- self insights.

This enables:

> **Based on…**

and supports later re-evaluation if a note is edited or deleted.

---

# 20. AI Analysis Pipeline — Conceptual

When the user submits a note:

### Step 1 — Understand the note

Claude identifies:

- people mentioned,
- relevant context,
- observations,
- useful relationship dynamics,
- reusable lessons,
- possible About Me insights.

### Step 2 — Resolve people

Determine whether names match existing people.

New people require lightweight confirmation.

### Step 3 — Compare with memory

Check whether the note:

- supports an existing insight,
- contradicts it,
- refines it,
- creates a new possible pattern.

### Step 4 — Update memory

Update the current best understanding.

### Step 5 — Preserve evidence

Keep the original note linked to derived knowledge.

### Step 6 — Show concise result

Return the **Picked up** summary.

Do not expose the entire pipeline to the user.

---

# 21. Privacy and Security Principles

Muted handles sensitive personal workplace observations.

Privacy should eventually become part of the product identity.

Core rule:

> **Your Muted workspace belongs to you.**

Avoid:

- public colleague profiles,
- shared workplace ratings,
- “what everyone thinks about John,”
- employer/admin access to private notes,
- social discovery features.

---

## Hackathon Security

The mock PIN and facial-recognition screens are only presentation devices.

They are **not real authentication**.

Therefore:

- use fictional demo data only,
- do not store private personal notes in the public demo.

---

## Post-Hackathon Security

Before storing real private notes:

- add real authentication,
- isolate each user's data,
- use secure cloud storage,
- protect all AI/backend endpoints,
- use encrypted transport,
- avoid exposing API keys in the client,
- add proper session handling.

Future mobile versions may support native biometric re-entry.

---

## User Data Controls

Long-term product should support:

- delete note/person,
- full data reset,
- export personal data.

If a note is deleted, downstream inferred knowledge should be reconsidered.

---

# 22. Integrations

## Hackathon

Keep integrations minimal.

### Supported

- text typing,
- copy/paste.

### Not supported

- direct Gmail integration,
- direct Outlook integration,
- automatic message ingestion,
- screenshot ingestion,
- document upload,
- voice capture.

---

## Calendar

Optional calendar integration is part of the future vision, but not a one-week MVP requirement.

Possible future use:

- know who the user is meeting,
- prepare relevant intelligence,
- prompt capture after meetings.

Muted should ingest only the calendar information needed for this workflow.

---

# 23. Notifications

Low priority.

Possible future notifications:

### Before meeting

> Meeting with John in 30 minutes.  
> 3 things worth remembering.

### After meeting

> Project Alpha Review ended.  
> Anything worth remembering?

These should be optional and user-controlled.

Do not make them part of the core hackathon build.

---

# 24. One-Week Hackathon MVP

The MVP must prove one thing exceptionally well:

> **Messy workplace notes can become connected, useful relationship intelligence.**

## Must Have

### 1. Mock Unlock

- mobile facial-recognition simulation,
- desktop four-digit PIN simulation.

### 2. Home / Capture

- large text area,
- type or paste text,
- Submit,
- Claude analysis,
- concise Picked Up summary.

### 3. People

- people list,
- person page,
- five-part playbook.

### 4. Relationships

- relationship cards,
- optional very lightweight visual connection within person pages.

### 5. Lessons

Four themes:

- Communication
- Leadership
- Stakeholder Management
- Personal Growth

### 6. Me

Show:

- patterns,
- strengths,
- watch outs,
- working on.

### 7. Ask Muted

Conversational advice using:

- people,
- relationships,
- lessons,
- About Me,
- relevant interactions.

Include collapsed **Based on…** evidence.

### 8. Memory Evolution

Multiple notes should be able to:

- reinforce,
- refine,
- or contradict previous patterns.

The demo needs at least one visible example of this.

### 9. Demo Workspace

- fictional pre-populated data,
- no judge account,
- judges can explore immediately.

### 10. Try It Yourself

Judges can paste a sample note and see Muted analyse it.

Do not allow their data to corrupt the shared demo state.

### 11. Responsive UI

Works properly on desktop and phone.

### 12. Public Deployment

Accessible through a Vercel URL.

---

# 25. Explicitly Out of Scope for the Hackathon

Do not spend the one-week build on:

- real multi-user authentication,
- Apple login,
- Google login,
- real biometrics,
- native mobile apps,
- direct email integration,
- calendar integration,
- notifications,
- bulk historical-note import,
- screenshot/document ingestion,
- voice capture,
- advanced data export,
- complex network graph,
- enterprise admin features,
- organisation-wide data sharing,
- extensive settings,
- model switching,
- elaborate onboarding.

These belong after the core idea is proven.

---

# 26. Suggested One-Week Build Order

## Day 1 — Product Shell + Data Structure

Focus:

- application shell,
- responsive navigation,
- brand styling,
- Supabase structure,
- fictional seed dataset,
- mock unlock flow.

Do not over-polish.

---

## Day 2 — Capture + Claude Analysis

Build the most important workflow:

> input → analysis → Picked Up

Validate the AI output using realistic messy notes.

---

## Day 3 — Memory + People

Build:

- people list,
- person profiles,
- five playbook sections,
- inferred insight storage,
- evidence linking.

---

## Day 4 — Relationships + Lessons + Me

Build:

- relationship cards,
- lightweight visual connection,
- four lesson themes,
- About Me insights.

Keep each simple.

---

## Day 5 — Ask Muted

Build the strongest demo moment:

> scenario question → context-aware strategy.

Ensure Ask Muted draws from:

- people,
- relationships,
- lessons,
- About Me,
- interaction evidence.

Add **Based on…**.

---

## Day 6 — Demo Story + Reliability

Create a carefully designed fictional sequence.

Test:

- capture,
- inference,
- memory evolution,
- relationship update,
- Ask Muted.

Fix confusing AI output.

Optimise mobile experience.

---

## Day 7 — Polish + Rehearse

Priorities:

1. reliability,
2. clarity,
3. speed,
4. demo timing,
5. visual polish.

Do not introduce major new functionality.

Rehearse the full pitch several times using the exact live demo path.

Prepare a fallback in case an AI call is slow or fails during presentation.

---

# 27. Recommended Demo Narrative

The live demo should tell one clear story.

## Scene 1 — Learn

Paste a messy fictional meeting note.

Muted identifies:

- John,
- Sarah,
- what each appears to care about,
- a lesson,
- a possible relationship dynamic.

Show the concise Picked Up summary.

Key message:

> **Muted turns notes into usable understanding.**

---

## Scene 2 — Memory Evolves

Paste another note involving John and Sarah.

Show how Muted:

- strengthens one pattern,
- refines another,
- notices a relationship dynamic.

Key message:

> **Muted doesn't just save notes. It learns over time.**

---

## Scene 3 — Predict

Ask:

> “I'm presenting a delayed project to John and Sarah tomorrow. What are they likely to ask?”

Muted predicts questions using the accumulated notes.

Expand:

> **Based on…**

briefly to prove the answer is grounded in the user's memory.

Key message:

> **Muted uses what you've learned to predict what may happen next.**

---

## Scene 4 — Strategise

Ask:

> “How should I approach them?”

Muted combines:

- John's playbook,
- Sarah's playbook,
- their relationship,
- relevant lessons,
- About Me patterns.

Key message:

> **Muted turns accumulated experience into a practical strategy.**

---

# 28. Hackathon Pitch Story

The pitch should be designed around one simple transformation:

### Before Muted

We notice useful things about people all the time.

But those lessons end up:

- in random notes,
- in our heads,
- forgotten,
- or impossible to retrieve when we actually need them.

### With Muted

You dump in what happened.

Muted turns it into an evolving private playbook.

Then before the next interaction, it gives the useful part back to you.

---

# 29. Three Things the Audience Should Remember

## 1. LEARN

> **Muted turns messy workplace observations into a living playbook for people.**

## 2. PREDICT

> **It uses what you've learned to anticipate what someone may care about, ask, or do.**

## 3. STRATEGISE

> **It combines what it knows about them, the situation, relationships, lessons, and you to suggest how to approach the interaction.**

These should be repeated visually and verbally throughout the pitch.

---

# 30. Potential Product Challenges

## Challenge 1 — AI over-infers

### Risk

Muted confidently creates psychological conclusions based on weak evidence.

### Response

- use cautious inference,
- show confidence,
- distinguish Muted-inferred insights,
- keep evidence accessible,
- allow correction.

---

## Challenge 2 — Profiles become stale

### Risk

People change, contexts differ, old conclusions become misleading.

### Response

Maintain a current-best-understanding model rather than permanent labels.

Use recency, contradictions, and new evidence to evolve patterns.

---

## Challenge 3 — Too much review work

### Risk

If every inference requires approval, users stop capturing notes.

### Response

Auto-save analysis.

Show a concise summary.

User corrects only when needed.

---

## Challenge 4 — Too much information

### Risk

Person pages become giant AI summaries.

### Response

Anchor profiles around the five playbook questions.

Hide supporting detail one level deeper.

---

## Challenge 5 — Trust

### Risk

AI advice sounds convincing but is unsupported.

### Response

Every material prediction should support a **Based on…** evidence view.

When evidence is weak, say so plainly.

---

## Challenge 6 — Privacy

### Risk

Workplace observations may be sensitive.

### Response

Private individual workspace.

No collaborative rating system.

No employer-facing analytics.

Proper authentication before storing real personal data.

---

## Challenge 7 — Hackathon scope creep

### Risk

Time gets consumed by integrations, authentication, or polish.

### Response

Protect the core demo loop.

Every proposed feature should be tested against:

> **Does this make Learn → Predict → Strategise more convincing?**

If not, defer it.

---

# 31. Future Expansion

Only explore these after the core product proves useful.

## Real Authentication

- Google
- Apple
- email/password
- mobile biometric re-entry

---

## Calendar Intelligence

Optional calendar connection for:

- upcoming meetings,
- relevant pre-meeting preparation,
- post-meeting capture prompts.

---

## Native Mobile App

Useful for:

- Face ID / fingerprint,
- quick capture,
- push notifications,
- stronger mobile experience.

---

## Voice Capture

Example:

> “I just came out of a meeting with John…”

Muted transcribes and analyses the observation.

---

## Image / Document Capture

Future ability to extract useful information from:

- screenshots,
- documents,
- photographed handwritten notes.

---

## Richer Relationship Visualisation

If relationship intelligence proves valuable, explore:

- lightweight network maps,
- group dynamics,
- influence patterns.

Avoid turning it into organisational surveillance.

---

## Reflection

Muted could periodically surface:

> “Here are three patterns you've learned this month.”

or:

> “This lesson has appeared in four different stakeholder situations.”

This should support reflection rather than become another notification stream.

---

# 32. North-Star Product Experience

The ideal Muted experience should feel like this:

### Capture

> “Dump whatever happened. I'll organise it.”

### Learn

> “Here's what seems worth remembering.”

### Predict

> “Based on your previous interactions, expect these questions.”

### Strategise

> “Here's how I would approach this person in this situation.”

### Reflect

> “You keep encountering this pattern too. Watch for it.”

The user should feel that Muted has quietly accumulated the practical wisdom that would otherwise have disappeared into old notes.

---

# 33. Final Product Definition

**Muted is a private AI relationship intelligence assistant that turns workplace observations into an evolving playbook of people, relationships, lessons, and self-awareness. It helps users learn from past interactions, predict what may happen next, and strategise how to work with people more effectively.**

For the hackathon, success does not mean demonstrating every future feature.

Success means that after seeing the live demo, a judge immediately understands:

> **“I already collect these observations in my head or notes. Muted would actually make them useful.”**
