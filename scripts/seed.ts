/**
 * Seeds (or re-seeds) the shared, fictional demo workspace that judges land
 * in. Run with: npm run seed
 *
 * Every person, note, and quote here is an invented demo persona — none of
 * it refers to a real organisation, project, or person. That's a hard
 * requirement, not a style choice: this data is served on a public URL.
 *
 * This is a standalone script (not part of the Next.js app bundle), so it
 * creates its own Supabase client directly rather than importing the
 * "server-only"-guarded app client.
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

// Unlike `next dev`/`next build`, this standalone script doesn't auto-load
// .env.local, so load it explicitly. Safe to skip if the file is absent
// (e.g. env vars supplied another way in CI).
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local present — fall through to process.env as-is
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role, not anon) before running the seed script."
  );
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000000";

type Confidence = "low" | "medium" | "high";

type PersonInsightSeed = {
  type: "cares_about" | "communication" | "likely_questions" | "avoid" | "approach" | "general";
  content: string;
  confidence: Confidence;
  isInferred: boolean;
  noteId: string;
};

type LessonSeed = {
  title: string;
  explanation: string;
  theme: "Communication" | "Leadership" | "Stakeholder Management" | "Personal Growth";
  isInferred: boolean;
  noteId: string;
  relatedPersonIds?: string[];
};

// Accumulators built up as each person/lesson/relationship is defined below,
// then inserted in a handful of batch calls at the end.
const personInsightRows: Record<string, unknown>[] = [];
const personInsightEvidenceRows: Record<string, unknown>[] = [];

function addPersonInsights(personId: string, items: PersonInsightSeed[]) {
  for (const item of items) {
    const id = randomUUID();
    personInsightRows.push({
      id,
      workspace_id: DEMO_WORKSPACE_ID,
      person_id: personId,
      type: item.type,
      content: item.content,
      confidence: item.confidence,
      is_inferred: item.isInferred,
    });
    personInsightEvidenceRows.push({ insight_id: id, note_id: item.noteId });
  }
}

const lessonRows: Record<string, unknown>[] = [];
const lessonEvidenceRows: Record<string, unknown>[] = [];
const lessonPeopleRows: Record<string, unknown>[] = [];

function addLesson(seed: LessonSeed) {
  const id = randomUUID();
  lessonRows.push({
    id,
    workspace_id: DEMO_WORKSPACE_ID,
    title: seed.title,
    explanation: seed.explanation,
    themes: [seed.theme],
    is_inferred: seed.isInferred,
    user_edited: false,
  });
  lessonEvidenceRows.push({ lesson_id: id, note_id: seed.noteId });
  for (const personId of seed.relatedPersonIds ?? []) {
    lessonPeopleRows.push({ lesson_id: id, person_id: personId });
  }
}

async function main() {
  console.log("Resetting demo workspace...");
  const { error: deleteError } = await supabase.from("workspaces").delete().eq("id", DEMO_WORKSPACE_ID);
  if (deleteError) throw deleteError;

  const { error: wsError } = await supabase
    .from("workspaces")
    .insert({ id: DEMO_WORKSPACE_ID, kind: "demo", seeded_at: new Date().toISOString() });
  if (wsError) throw wsError;

  // ---- People -------------------------------------------------------------
  // Five roles the demo needs to demonstrate, plus two supporting vendor
  // profiles and John kept on as a second Upper management example.
  const giselle = randomUUID(); // Direct boss
  const lydia = randomUUID(); // Upper management
  const sarah = randomUUID(); // Peer
  const jayden = randomUUID(); // Subordinate
  const cayden = randomUUID(); // Stakeholder — the deepest profile in the demo
  const lionel = randomUUID(); // Vendor
  const gordon = randomUUID(); // Vendor
  const john = randomUUID(); // Upper management (kept from the original demo)

  const { error: peopleError } = await supabase.from("people").insert([
    { id: giselle, workspace_id: DEMO_WORKSPACE_ID, name: "Giselle", roles: ["Direct boss"], aliases: [] },
    { id: lydia, workspace_id: DEMO_WORKSPACE_ID, name: "Lydia", roles: ["Upper management"], aliases: [] },
    { id: sarah, workspace_id: DEMO_WORKSPACE_ID, name: "Sarah", roles: ["Peer"], aliases: [] },
    { id: jayden, workspace_id: DEMO_WORKSPACE_ID, name: "Jayden", roles: ["Subordinate"], aliases: [] },
    { id: cayden, workspace_id: DEMO_WORKSPACE_ID, name: "Cayden", roles: ["Stakeholder"], aliases: [] },
    { id: lionel, workspace_id: DEMO_WORKSPACE_ID, name: "Lionel", roles: ["Vendor"], aliases: [] },
    { id: gordon, workspace_id: DEMO_WORKSPACE_ID, name: "Gordon", roles: ["Vendor"], aliases: [] },
    { id: john, workspace_id: DEMO_WORKSPACE_ID, name: "John", roles: ["Upper management"], aliases: ["JT"] },
  ]);
  if (peopleError) throw peopleError;

  // ---- Notes ----------------------------------------------------------------
  // note1-note3 are the original demo notes, kept verbatim — everything they
  // support (John, Sarah, Jayden's existing insights, and the self-insights
  // below) stays exactly as it was.
  const note1 = randomUUID();
  const note2 = randomUUID();
  const note3 = randomUUID();
  const noteSarahCayden = randomUUID();
  const noteGiselle1 = randomUUID();
  const noteGiselle2 = randomUUID();
  const noteGiseldeSarah = randomUUID();
  const noteGiseldeCayden = randomUUID();
  const noteLydia1 = randomUUID();
  const noteLydia2 = randomUUID();
  const noteJayden1 = randomUUID();
  const noteJayden2 = randomUUID();
  const noteCayden1 = randomUUID();
  const noteCayden2 = randomUUID();
  const noteCayden3 = randomUUID();
  const noteCayden4 = randomUUID();
  const noteLionel1 = randomUUID();
  const noteLionel2 = randomUUID();
  const noteGordon1 = randomUUID();
  const noteGordon2 = randomUUID();
  const noteLionelGordon = randomUUID();

  const { error: notesError } = await supabase.from("notes").insert([
    {
      id: note1,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Had the Project Alpha review with John and Sarah today. John kept pushing on downstream impact and wouldn't let up until I showed the mitigation plan - then he was fine. Sarah was quiet until John left, then flagged she's worried about manpower for next sprint. Room felt tense whenever the timeline came up.",
      context_summary: "Room was tense whenever the timeline came up; eased once a mitigation plan was shown.",
      created_at: "2026-07-20T09:00:00Z",
    },
    {
      id: note2,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Follow-up sync with Sarah alone. She was much more detailed and open about the resourcing gap now that John wasn't in the room. She also mentioned John does this on every review - he always wants to know the downstream impact first, before anything else.",
      context_summary: "One-on-one with Sarah felt more open and detailed than the group review.",
      created_at: "2026-07-24T14:00:00Z",
    },
    {
      id: note3,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Jayden joined today's steering committee. Noticed John was noticeably more careful with his numbers and double-checked everything before Jayden arrived. Separately: I flagged the resourcing risk two days early this time instead of waiting, and it landed much better than last month's last-minute timeline ambush.",
      context_summary: "John was visibly more careful/prepared once Jayden was in the room.",
      created_at: "2026-08-05T11:30:00Z",
    },
    {
      id: noteSarahCayden,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Sarah flagged the resourcing gap to Cayden again today, but this time she came with a proposal - cut scope on two workstreams for two weeks rather than just naming the problem. Once we had room to actually talk it through instead of it being a surprise in the room, she was much clearer about the tradeoffs and walked us through a practical next step.",
      context_summary: "Sarah led with a mitigation plan instead of only raising the problem.",
      created_at: "2026-07-28T10:00:00Z",
    },
    {
      id: noteGiselle1,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "1:1 with Giselle today. She's sharp - picked up on the resourcing gap before I even got to it, and asked straight away 'can I understand how your team works?' When I started walking through it top-down she cut in: 'as a lead, you need to lead - guide the discussion and ask the right questions', wanted me driving the conversation, not waiting for her to pull it out of me. Straight to the point throughout, no going in circles, but she clocked how tense the room got and named it before moving on. Near the end: 'can you walk me through how your team is handling this?'",
      context_summary: "Giselle expects the lead to drive the conversation, not wait to be asked.",
      created_at: "2026-07-18T09:00:00Z",
    },
    {
      id: noteGiselle2,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Follow-up steering session with Giselle. She kept the questions coming - 'why did you choose this approach' and 'what are you recommending' - and expected me to already have a point of view rather than present options and wait for her to pick one. She's good at reading whether people are actually following or just nodding along, and asks pointed questions that show her how a team actually thinks, not just what they shipped.",
      context_summary: "Giselle expects a point of view, not a menu of options.",
      created_at: "2026-07-22T15:00:00Z",
    },
    {
      id: noteGiseldeSarah,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Giselle pulled Sarah aside after the sync - told her she has good instincts and should stop waiting to be asked, just say what she thinks and steer the conversation herself next time.",
      context_summary: "Giselle is coaching Sarah to take more ownership in discussions.",
      created_at: "2026-07-29T13:00:00Z",
    },
    {
      id: noteGiseldeCayden,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Cayden pushed back hard on the proposal until I mentioned Giselle had already signed off on the direction - visibly changed his tone after that, said if she's comfortable with it, he is too.",
      context_summary: "Cayden softened once he heard Giselle was aligned.",
      created_at: "2026-08-01T11:00:00Z",
    },
    {
      id: noteLydia1,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Review with Lydia on the Project Alpha delay. She noticed two leads were quietly pointing fingers at Cayden's team and shut that down fast - wanted the actual facts before anyone assigned blame. Kept pushing: what exactly happened, what's causing it, what have other teams done in a similar spot. She wants comparisons, not just our own read. Zero patience for jargon either - when someone said 'operationalise the framework,' she just asked them to say it in plain English.",
      context_summary: "Lydia shut down blame-shifting and asked for facts and comparisons instead.",
      created_at: "2026-07-25T10:00:00Z",
    },
    {
      id: noteLydia2,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Prepped for Lydia's review properly this time - pulled two comparable examples before going in. She clearly noticed the difference: didn't have to ask me to go back and do the homework like last time. Still direct about the gaps, but didn't make it personal - she just wants it fixed.",
      context_summary: "Coming prepared with comparisons changed the tone of Lydia's review.",
      created_at: "2026-08-08T09:00:00Z",
    },
    {
      id: noteJayden1,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Jayden picked up the automation task and ran with it immediately - didn't wait around, which I like, but he'd built half of it before checking the actual requirements with me, so some of it had to be redone. When I walked him through what I actually needed, he got it fast and course-corrected without getting defensive - actually said upfront 'oh I wasn't sure about that part, should've asked.'",
      context_summary: "Jayden moves fast but sometimes before confirming requirements.",
      created_at: "2026-07-30T14:00:00Z",
    },
    {
      id: noteJayden2,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Gave Jayden more specific feedback this round - not just 'fix the edge cases' but walked through why each one mattered. Huge difference in the next version; he applied it correctly across the board without me having to repeat it.",
      context_summary: "Specific, reasoning-based feedback landed much better with Jayden.",
      created_at: "2026-08-11T10:00:00Z",
    },
    {
      id: noteCayden1,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Kickoff prep call with Cayden. He pushed back hard on 'baseline requirements' - said the phrase makes it sound like the bare minimum instead of what's actually needed, asked us to just describe the real requirement. Also made clear he doesn't want this delivered in two phases if it can be done as one complete flow - said splitting it up just creates more handover risk. Wants to be consulted on the agenda and the key POCs before the actual meeting, not surprised on the day. Minutes came back to me twice for corrections afterwards - he's particular about staff work and wants it accurate the first time.",
      context_summary: "Cayden wants complete delivery, early consultation, and precise staff work.",
      created_at: "2026-07-19T09:00:00Z",
    },
    {
      id: noteCayden2,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Cayden was blunt today when two of our leads seemed to be quietly blaming each other in front of him - said he doesn't want to see that again, wants a united front. He's clearly someone who values loyalty; when I mentioned a teammate had covered for someone under pressure, he nodded and said trust matters more to him than almost anything else here.",
      context_summary: "Cayden values a united front and strongly values trust and loyalty.",
      created_at: "2026-07-23T11:00:00Z",
    },
    {
      id: noteCayden3,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Sent Cayden the weekly update as a long email with two attachments - he came back annoyed, said he doesn't read past what fits on one screen and to just put the important stuff directly in the email next time, a table if it helps him scan it. He'd rather I use numbered points instead of bullets too, with space between them, so he can reference '#3' in a reply instead of re-describing it.",
      context_summary: "Cayden wants short, scannable emails with numbered points and tables.",
      created_at: "2026-08-02T16:00:00Z",
    },
    {
      id: noteCayden4,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Cayden challenged the whole approach in today's session - asked why we were following the old process when it clearly didn't fit anymore, and pushed the team to actually think it through instead of just doing what the doc said. He's the type who'll ask 'is there a better way' before accepting 'that's how we've always done it.' Genuinely useful pressure - made me think harder about the flow than I had in weeks.",
      context_summary: "Cayden challenges process for its own sake and pushes for judgement over blind compliance.",
      created_at: "2026-08-06T14:00:00Z",
    },
    {
      id: noteLionel1,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Lionel ran the workshop today - really easy to follow, checked in constantly: 'I've talked a lot, any questions so far?' and 'everyone able to follow me so far?' Used humour when he clearly wasn't 100% sure of an answer, which actually worked, took the pressure off. Ended with 'from my understanding, this is the direction - is that aligned to your vision?' before moving on, which I appreciated.",
      context_summary: "Lionel presents clearly and checks in often to confirm alignment.",
      created_at: "2026-07-21T13:00:00Z",
    },
    {
      id: noteLionel2,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Noticed Lionel spends the first ten minutes of any new client meeting just watching who talks, who gets deferred to, who everyone looks at before agreeing. He clearly clocked that Cayden and Giselle carry more weight in the room and has been deliberately checking in with them directly since, even outside the main sessions.",
      context_summary: "Lionel reads stakeholder dynamics and builds rapport with the most influential people.",
      created_at: "2026-08-04T10:00:00Z",
    },
    {
      id: noteGordon1,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Gordon's explanation of the integration issue ran twenty minutes for something that should've taken five - by the end half the room had lost the thread on what was actually a simple fix. When I gave him feedback on trimming it down, he agreed on the spot, but the next update was just as long again.",
      context_summary: "Gordon over-explains, and verbal agreement to feedback didn't change the next update.",
      created_at: "2026-07-31T15:00:00Z",
    },
    {
      id: noteGordon2,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Client call got awkward when Gordon brought up a disagreement with his own teammate mid-presentation - not the place for it. He also mentioned, unprompted, how much of the work he'd personally done on this phase, a few times.",
      context_summary: "Gordon brought internal team tension into a client-facing call.",
      created_at: "2026-08-09T11:00:00Z",
    },
    {
      id: noteLionelGordon,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Sat in on a joint session with Lionel and Gordon today - Lionel kept trying to simplify the explanation down to the actual decision needed, while Gordon kept adding detail and caveats. You could feel the room getting impatient waiting for them to land on the same page.",
      context_summary: "Lionel and Gordon's contrasting styles created some friction in a joint session.",
      created_at: "2026-08-12T09:00:00Z",
    },
  ]);
  if (notesError) throw notesError;

  const { error: notePeopleError } = await supabase.from("note_people").insert([
    { note_id: note1, person_id: john },
    { note_id: note1, person_id: sarah },
    { note_id: note2, person_id: sarah },
    { note_id: note3, person_id: john },
    { note_id: note3, person_id: jayden },
    { note_id: noteSarahCayden, person_id: sarah },
    { note_id: noteSarahCayden, person_id: cayden },
    { note_id: noteGiselle1, person_id: giselle },
    { note_id: noteGiselle2, person_id: giselle },
    { note_id: noteGiseldeSarah, person_id: giselle },
    { note_id: noteGiseldeSarah, person_id: sarah },
    { note_id: noteGiseldeCayden, person_id: giselle },
    { note_id: noteGiseldeCayden, person_id: cayden },
    { note_id: noteLydia1, person_id: lydia },
    { note_id: noteLydia1, person_id: cayden },
    { note_id: noteLydia2, person_id: lydia },
    { note_id: noteJayden1, person_id: jayden },
    { note_id: noteJayden2, person_id: jayden },
    { note_id: noteCayden1, person_id: cayden },
    { note_id: noteCayden2, person_id: cayden },
    { note_id: noteCayden3, person_id: cayden },
    { note_id: noteCayden4, person_id: cayden },
    { note_id: noteLionel1, person_id: lionel },
    { note_id: noteLionel2, person_id: lionel },
    { note_id: noteLionel2, person_id: cayden },
    { note_id: noteLionel2, person_id: giselle },
    { note_id: noteGordon1, person_id: gordon },
    { note_id: noteGordon2, person_id: gordon },
    { note_id: noteLionelGordon, person_id: lionel },
    { note_id: noteLionelGordon, person_id: gordon },
  ]);
  if (notePeopleError) throw notePeopleError;

  // ---- Person insights ------------------------------------------------------

  // Giselle — Direct boss
  addPersonInsights(giselle, [
    { type: "general", content: "Very observant and quick-thinking — picks up on both the issue and how people are reacting.", confidence: "high", isInferred: false, noteId: noteGiselle1 },
    { type: "general", content: "Straight to the point and doesn't like going in circles.", confidence: "high", isInferred: false, noteId: noteGiselle1 },
    { type: "communication", content: "Get to the point quickly — she doesn't like circling back.", confidence: "high", isInferred: false, noteId: noteGiselle1 },
    { type: "communication", content: "Show your thinking, not just an update — be ready to explain how you arrived at your recommendation.", confidence: "high", isInferred: false, noteId: noteGiselle2 },
    { type: "communication", content: "If you're leading the work, actively guide the discussion rather than waiting for her to drive it.", confidence: "high", isInferred: false, noteId: noteGiselle1 },
    { type: "likely_questions", content: "Can I understand how your team works?", confidence: "high", isInferred: false, noteId: noteGiselle1 },
    { type: "likely_questions", content: "What is your approach moving forward?", confidence: "high", isInferred: false, noteId: noteGiselle1 },
    { type: "likely_questions", content: "Can you walk me through how your team is handling this?", confidence: "high", isInferred: false, noteId: noteGiselle1 },
    { type: "likely_questions", content: "Why did you choose this approach?", confidence: "medium", isInferred: true, noteId: noteGiselle2 },
    { type: "approach", content: "Come prepared to explain your reasoning, not just the outcome, and take ownership of guiding the conversation.", confidence: "medium", isInferred: true, noteId: noteGiselle1 },
  ]);

  // Lydia — Upper management
  addPersonInsights(lydia, [
    { type: "general", content: "Smart and straightforward, but doesn't put people down unnecessarily.", confidence: "high", isInferred: false, noteId: noteLydia2 },
    { type: "general", content: "Notices when someone tries to shift blame onto someone else.", confidence: "high", isInferred: false, noteId: noteLydia1 },
    { type: "general", content: "Probes issues rather than accepting a surface-level explanation.", confidence: "medium", isInferred: true, noteId: noteLydia1 },
    { type: "cares_about", content: "Understanding the facts behind an issue.", confidence: "high", isInferred: false, noteId: noteLydia1 },
    { type: "cares_about", content: "Well-researched recommendations that compare what other organisations have done.", confidence: "high", isInferred: false, noteId: noteLydia1 },
    { type: "cares_about", content: "Clear communication without unnecessary jargon.", confidence: "high", isInferred: false, noteId: noteLydia1 },
    { type: "likely_questions", content: "What exactly happened?", confidence: "high", isInferred: false, noteId: noteLydia1 },
    { type: "likely_questions", content: "What have others done?", confidence: "high", isInferred: false, noteId: noteLydia1 },
    { type: "likely_questions", content: "What evidence supports this?", confidence: "medium", isInferred: true, noteId: noteLydia1 },
    { type: "communication", content: "Prepare the details — she will ask for them.", confidence: "high", isInferred: false, noteId: noteLydia2 },
    { type: "communication", content: "Compare against relevant external examples where useful.", confidence: "high", isInferred: false, noteId: noteLydia1 },
    { type: "communication", content: "Use simple, precise language — skip the jargon.", confidence: "high", isInferred: false, noteId: noteLydia1 },
    { type: "avoid", content: "Using big words that add no meaning.", confidence: "high", isInferred: false, noteId: noteLydia1 },
    { type: "avoid", content: "Giving an answer without doing the homework.", confidence: "high", isInferred: false, noteId: noteLydia2 },
    { type: "avoid", content: "Blaming another person without explaining the facts.", confidence: "high", isInferred: false, noteId: noteLydia1 },
  ]);

  // Sarah — Peer (existing insights kept, new ones added for the Peer use case)
  addPersonInsights(sarah, [
    { type: "cares_about", content: "Manpower and resourcing constraints for upcoming sprints.", confidence: "high", isInferred: true, noteId: note1 },
    { type: "communication", content: "Opens up in more detail one-on-one; more reserved when John is in the room.", confidence: "medium", isInferred: true, noteId: note2 },
    { type: "general", content: "Reads the room before speaking up — waits to see how others react first.", confidence: "low", isInferred: true, noteId: note2 },
    { type: "general", content: "Good at translating operational concerns into practical next steps.", confidence: "medium", isInferred: true, noteId: noteSarahCayden },
    { type: "approach", content: "Give her space to think before responding — she opens up more once there's room to talk through concerns rather than being put on the spot.", confidence: "medium", isInferred: true, noteId: note2 },
  ]);

  // Jayden — Subordinate
  addPersonInsights(jayden, [
    { type: "general", content: "Capable and eager to do well.", confidence: "high", isInferred: false, noteId: noteJayden1 },
    { type: "general", content: "Sometimes moves quickly before checking whether expectations are clear.", confidence: "high", isInferred: false, noteId: noteJayden1 },
    { type: "general", content: "Comfortable admitting when something is unclear.", confidence: "high", isInferred: false, noteId: noteJayden1 },
    { type: "general", content: "Improves quickly when feedback is specific.", confidence: "medium", isInferred: true, noteId: noteJayden2 },
    { type: "approach", content: "Explain the intent, not just the task.", confidence: "medium", isInferred: true, noteId: noteJayden1 },
    { type: "approach", content: "Be specific about what good looks like.", confidence: "medium", isInferred: true, noteId: noteJayden2 },
    { type: "approach", content: "Let him attempt the problem before stepping in.", confidence: "medium", isInferred: true, noteId: noteJayden1 },
    { type: "approach", content: "Give feedback on the reasoning, not only the final output.", confidence: "medium", isInferred: true, noteId: noteJayden2 },
  ]);

  // Cayden — Stakeholder, the richest profile in the demo on purpose
  addPersonInsights(cayden, [
    { type: "general", content: "Influential, straightforward and willing to challenge the norm.", confidence: "high", isInferred: false, noteId: noteCayden4 },
    { type: "general", content: "Prefers complete, end-to-end thinking over fragmented delivery.", confidence: "high", isInferred: false, noteId: noteCayden1 },
    { type: "general", content: "Has high standards for preparation and staff work.", confidence: "high", isInferred: false, noteId: noteCayden1 },
    { type: "general", content: "Values trust and loyalty strongly.", confidence: "high", isInferred: false, noteId: noteCayden2 },
    { type: "general", content: "Pushes people to exercise judgement rather than follow instructions blindly.", confidence: "high", isInferred: false, noteId: noteCayden4 },
    { type: "cares_about", content: "Trust and loyalty.", confidence: "high", isInferred: false, noteId: noteCayden2 },
    { type: "cares_about", content: "Internal teams presenting a united front.", confidence: "high", isInferred: false, noteId: noteCayden2 },
    { type: "cares_about", content: "Complete delivery rather than unnecessary fragmentation.", confidence: "high", isInferred: false, noteId: noteCayden1 },
    { type: "cares_about", content: "Good staff work and preparation.", confidence: "high", isInferred: false, noteId: noteCayden1 },
    { type: "cares_about", content: "Being consulted early on agendas and key POCs.", confidence: "high", isInferred: false, noteId: noteCayden1 },
    { type: "communication", content: "Use numbered points instead of bullets, with spacing between them so he can refer back easily.", confidence: "high", isInferred: false, noteId: noteCayden3 },
    { type: "communication", content: "Keep emails short and scannable — put useful information directly in the email rather than an attachment.", confidence: "high", isInferred: false, noteId: noteCayden3 },
    { type: "communication", content: "Use tables when they make information easier to scan.", confidence: "high", isInferred: false, noteId: noteCayden3 },
    { type: "communication", content: "Consult him on important agendas and POCs before meetings.", confidence: "high", isInferred: false, noteId: noteCayden1 },
    { type: "communication", content: "Show the complete flow rather than isolated fragments.", confidence: "high", isInferred: false, noteId: noteCayden1 },
    { type: "likely_questions", content: "Why are we splitting this into phases?", confidence: "medium", isInferred: true, noteId: noteCayden4 },
    { type: "likely_questions", content: "Why can't we complete the whole flow?", confidence: "medium", isInferred: true, noteId: noteCayden4 },
    { type: "likely_questions", content: "Who has been consulted?", confidence: "medium", isInferred: true, noteId: noteCayden1 },
    { type: "likely_questions", content: "Is there a better way?", confidence: "medium", isInferred: true, noteId: noteCayden4 },
    { type: "avoid", content: "Using the term \"baseline requirements.\"", confidence: "high", isInferred: false, noteId: noteCayden1 },
    { type: "avoid", content: "Breaking his trust.", confidence: "high", isInferred: false, noteId: noteCayden2 },
    { type: "avoid", content: "Internal teams publicly blaming each other.", confidence: "high", isInferred: false, noteId: noteCayden2 },
    { type: "avoid", content: "Long emails.", confidence: "high", isInferred: false, noteId: noteCayden3 },
    { type: "avoid", content: "Unnecessary attachments.", confidence: "high", isInferred: false, noteId: noteCayden3 },
    { type: "avoid", content: "Fragmenting one flow across too many sessions.", confidence: "high", isInferred: false, noteId: noteCayden1 },
    { type: "avoid", content: "Blindly following an instruction when it clearly doesn't make sense.", confidence: "high", isInferred: false, noteId: noteCayden4 },
  ]);

  // Lionel — Vendor
  addPersonInsights(lionel, [
    { type: "general", content: "Friendly, presents clearly and has good presence.", confidence: "high", isInferred: false, noteId: noteLionel1 },
    { type: "general", content: "Uses humour naturally when he's unsure about something.", confidence: "high", isInferred: false, noteId: noteLionel1 },
    { type: "general", content: "Reads stakeholder dynamics and deliberately builds rapport with key influencers.", confidence: "medium", isInferred: true, noteId: noteLionel2 },
    { type: "communication", content: "Confirm whether the proposed understanding is aligned before moving forward.", confidence: "high", isInferred: false, noteId: noteLionel1 },
    { type: "communication", content: "Engage him in discussions rather than treating him only as a presenter.", confidence: "medium", isInferred: true, noteId: noteLionel1 },
  ]);

  // Gordon — Vendor (phrased in observable, non-judgmental terms throughout)
  addPersonInsights(gordon, [
    { type: "general", content: "Tends to over-explain — can make simple topics hard to follow.", confidence: "high", isInferred: false, noteId: noteGordon1 },
    { type: "general", content: "Sometimes agrees quickly with feedback without it always sticking in the next update.", confidence: "medium", isInferred: true, noteId: noteGordon1 },
    { type: "general", content: "Sometimes brings internal team tension into client discussions.", confidence: "high", isInferred: false, noteId: noteGordon2 },
    { type: "general", content: "Frequently highlights how much work he's personally contributed.", confidence: "high", isInferred: false, noteId: noteGordon2 },
    { type: "communication", content: "Ask him to summarise the main point first.", confidence: "medium", isInferred: true, noteId: noteGordon1 },
    { type: "communication", content: "Confirm specific actions at the end of a discussion, ideally in writing.", confidence: "medium", isInferred: true, noteId: noteGordon1 },
    { type: "avoid", content: "Assuming verbal agreement means the feedback has been fully understood.", confidence: "medium", isInferred: true, noteId: noteGordon1 },
    { type: "avoid", content: "Letting internal vendor disagreements dominate the client conversation.", confidence: "medium", isInferred: true, noteId: noteGordon2 },
  ]);

  // John — Upper management (kept exactly as the original demo had it)
  addPersonInsights(john, [
    { type: "cares_about", content: "Delivery risk and downstream impact of any delay.", confidence: "high", isInferred: true, noteId: note1 },
    { type: "communication", content: "Wants downstream impact addressed before anything else. Settles once a mitigation plan is shown.", confidence: "high", isInferred: true, noteId: note1 },
    { type: "likely_questions", content: "What's the downstream impact, and what's the mitigation plan?", confidence: "high", isInferred: true, noteId: note1 },
    { type: "avoid", content: "Don't lead with excuses or background before addressing impact.", confidence: "medium", isInferred: true, noteId: note1 },
    { type: "approach", content: "Lead with impact and the mitigation plan. Keep background for after.", confidence: "medium", isInferred: true, noteId: note1 },
    { type: "general", content: "Stays calm and measured even when pushing hard on a point.", confidence: "medium", isInferred: true, noteId: note1 },
  ]);
  if (personInsightRows.length > 0) {
    const { error } = await supabase.from("person_insights").insert(personInsightRows);
    if (error) throw error;
  }
  if (personInsightEvidenceRows.length > 0) {
    const { error } = await supabase.from("person_insight_evidence").insert(personInsightEvidenceRows);
    if (error) throw error;
  }

  // ---- Relationship insights --------------------------------------------------

  const relationshipRows: Record<string, unknown>[] = [];
  const relationshipEvidenceRows: Record<string, unknown>[] = [];

  function addRelationship(
    personAId: string,
    personBId: string,
    content: string,
    confidence: Confidence,
    isInferred: boolean,
    relationshipType: "reports_to" | "influences" | "works_closely_with" | null,
    noteId: string
  ) {
    const id = randomUUID();
    relationshipRows.push({
      id,
      workspace_id: DEMO_WORKSPACE_ID,
      person_a_id: personAId,
      person_b_id: personBId,
      content,
      confidence,
      is_inferred: isInferred,
      relationship_type: relationshipType,
    });
    relationshipEvidenceRows.push({ relationship_insight_id: id, note_id: noteId });
  }

  addRelationship(
    sarah,
    john,
    "Sarah gives much more detail on resourcing when John isn't in the room.",
    "medium",
    true,
    "influences",
    note1
  );
  // Jayden is person_a here (not John) because relationship_type: "influences"
  // means person_a influences person_b — it's Jayden's presence that changes
  // John's behaviour, not the other way round.
  addRelationship(
    jayden,
    john,
    "John is noticeably more careful and double-checks numbers when Jayden is present.",
    "low",
    true,
    "influences",
    note3
  );
  addRelationship(
    giselle,
    cayden,
    "Cayden tends to be more receptive when Giselle is aligned with the recommendation.",
    "medium",
    true,
    "influences",
    noteGiseldeCayden
  );
  addRelationship(
    cayden,
    lionel,
    "Lionel sees Cayden as a key stakeholder and deliberately builds rapport with him.",
    "medium",
    false,
    "influences",
    noteLionel2
  );
  addRelationship(
    giselle,
    lionel,
    "Lionel recognises Giselle as an influential voice with Cayden and makes sure she understands and supports the direction.",
    "medium",
    false,
    "influences",
    noteLionel2
  );
  addRelationship(
    lydia,
    cayden,
    "Lydia tends to notice when others try to shift blame towards Cayden and probes the facts before taking sides.",
    "medium",
    true,
    null,
    noteLydia1
  );
  addRelationship(
    sarah,
    cayden,
    "Cayden responds better when Sarah comes prepared with a clear mitigation or end-to-end view rather than only highlighting a problem.",
    "medium",
    true,
    "influences",
    noteSarahCayden
  );
  addRelationship(
    giselle,
    sarah,
    "Giselle encourages Sarah to lead the discussion, form a view, and guide the conversation rather than only respond to questions.",
    "medium",
    false,
    "influences",
    noteGiseldeSarah
  );
  addRelationship(
    lionel,
    gordon,
    "Their communication styles contrast: Lionel tends to simplify and facilitate, while Gordon tends to add more explanation. This can create some friction during joint discussions.",
    "medium",
    true,
    "works_closely_with",
    noteLionelGordon
  );

  const { error: relError } = await supabase.from("relationship_insights").insert(relationshipRows);
  if (relError) throw relError;
  const { error: relEvidenceError } = await supabase.from("relationship_insight_evidence").insert(relationshipEvidenceRows);
  if (relEvidenceError) throw relEvidenceError;

  // ---- Lessons ----------------------------------------------------------------
  // A curated library across all four themes — generic, reusable lessons plus
  // a few tied to whoever most clearly demonstrated them.

  // Communication
  addLesson({
    title: "Admit when you don't know.",
    explanation: "Do not pretend to know the answer. Say you do not know and follow up properly.",
    theme: "Communication",
    isInferred: false,
    noteId: noteJayden1,
  });
  addLesson({
    title: "Buy time clearly.",
    explanation: "\"Let me think through this and get back with a clearer answer.\"",
    theme: "Communication",
    isInferred: false,
    noteId: noteLydia1,
  });
  addLesson({
    title: "Disagree respectfully.",
    explanation: "\"If I may share my opinion…\"",
    theme: "Communication",
    isInferred: false,
    noteId: noteCayden4,
  });
  addLesson({
    title: "Ask for the other person's view first.",
    explanation: "If you need more context before answering, ask: \"Before I answer, can I hear your perspective first?\"",
    theme: "Communication",
    isInferred: false,
    noteId: noteGiselle2,
  });
  addLesson({
    title: "Make information easy to reference.",
    explanation: "Numbered points that can be referred back to by number save everyone re-describing the same item.",
    theme: "Communication",
    isInferred: true,
    noteId: noteCayden3,
    relatedPersonIds: [cayden],
  });
  addLesson({
    title: "Check regularly whether the room is following.",
    explanation:
      "A quick \"any questions so far?\" and confirming alignment explicitly keeps everyone actually on the same page, not just nodding.",
    theme: "Communication",
    isInferred: true,
    noteId: noteLionel1,
    relatedPersonIds: [lionel],
  });

  // Leadership
  addLesson({
    title: "Protect the team publicly.",
    explanation:
      "Even when the team could have done better, do not throw them under the bus in front of others. Acknowledge the effort, then realign internally.",
    theme: "Leadership",
    isInferred: false,
    noteId: noteCayden2,
  });
  addLesson({
    title: "Lead the discussion.",
    explanation: "A lead should guide the conversation and ask the right questions rather than wait for others to drive it.",
    theme: "Leadership",
    isInferred: false,
    noteId: noteGiselle1,
    relatedPersonIds: [giselle],
  });
  addLesson({
    title: "Presence matters.",
    explanation: "Leadership impact is not only about technical ability. How someone communicates and carries the room matters too.",
    theme: "Leadership",
    isInferred: true,
    noteId: noteLionel1,
  });
  addLesson({
    title: "Challenge inefficient norms instead of accepting them automatically.",
    explanation: "Questioning \"that's how we've always done it\" is often what actually improves the process.",
    theme: "Leadership",
    isInferred: true,
    noteId: noteCayden4,
    relatedPersonIds: [cayden],
  });
  addLesson({
    title: "Think about the complete flow, not only the immediate step.",
    explanation: "Fragmenting delivery into disconnected pieces creates more handover risk than it saves in effort.",
    theme: "Leadership",
    isInferred: true,
    noteId: noteCayden1,
    relatedPersonIds: [cayden],
  });

  // Stakeholder Management
  addLesson({
    title: "Sometimes the question is testing acknowledgement.",
    explanation:
      "A senior stakeholder may already know the answer. They may keep asking because they want you to acknowledge the real issue yourself.",
    theme: "Stakeholder Management",
    isInferred: true,
    noteId: noteLydia1,
  });
  addLesson({
    title: "Admit the issue before defending it.",
    explanation:
      "If something went wrong, acknowledge it first and explain what will change next instead of immediately defending the old decision.",
    theme: "Stakeholder Management",
    isInferred: false,
    noteId: noteGordon1,
  });
  addLesson({
    title: "Avoid internal blame.",
    explanation: "Present a united front externally. Resolve internal disagreements internally.",
    theme: "Stakeholder Management",
    isInferred: false,
    noteId: noteGordon2,
  });
  addLesson({
    title: "Observe stakeholder dynamics instead of treating every attendee as equally influential.",
    explanation: "Noticing who the room defers to, and building rapport with them deliberately, changes how a proposal lands.",
    theme: "Stakeholder Management",
    isInferred: true,
    noteId: noteLionel2,
    relatedPersonIds: [lionel],
  });

  // Personal Growth
  addLesson({
    title: "Observe why people behave the way they do.",
    explanation: "Do not only remember what someone said. Think about why they asked it and what that reveals about how they work.",
    theme: "Personal Growth",
    isInferred: true,
    noteId: noteGiselle2,
  });
  addLesson({
    title: "It is okay to be learning.",
    explanation: "When something is genuinely new, it is okay to say you are still learning rather than pretending you already know everything.",
    theme: "Personal Growth",
    isInferred: false,
    noteId: noteJayden1,
  });
  addLesson({
    title: "Exercise judgement instead of blindly following instructions.",
    explanation: "An instruction that clearly doesn't fit the situation is worth questioning, not executing anyway.",
    theme: "Personal Growth",
    isInferred: true,
    noteId: noteCayden4,
    relatedPersonIds: [cayden],
  });

  const { error: lessonsError } = await supabase.from("lessons").insert(lessonRows);
  if (lessonsError) throw lessonsError;
  const { error: lessonEvidenceError } = await supabase.from("lesson_evidence").insert(lessonEvidenceRows);
  if (lessonEvidenceError) throw lessonEvidenceError;
  if (lessonPeopleRows.length > 0) {
    const { error: lessonPeopleError } = await supabase.from("lesson_people").insert(lessonPeopleRows);
    if (lessonPeopleError) throw lessonPeopleError;
  }

  // ---- Self insights (kept exactly as the original demo had them) -------------

  const siPattern = randomUUID();
  const siStrength = randomUUID();
  const siWatchOut = randomUUID();
  const siWorkingOn = randomUUID();

  const { error: selfInsightsError } = await supabase.from("self_insights").insert([
    {
      id: siPattern,
      workspace_id: DEMO_WORKSPACE_ID,
      type: "pattern",
      content: "You tend to explain background before answering the direct question when challenged.",
      confidence: "medium",
      is_inferred: true,
    },
    {
      id: siStrength,
      workspace_id: DEMO_WORKSPACE_ID,
      type: "strength",
      content: "You prepare a concrete mitigation plan before raising difficult news.",
      confidence: "medium",
      is_inferred: true,
    },
    {
      id: siWatchOut,
      workspace_id: DEMO_WORKSPACE_ID,
      type: "watch_out",
      content: "Over-explaining under pressure can read as less confident than a direct answer.",
      confidence: "medium",
      is_inferred: true,
    },
    {
      id: siWorkingOn,
      workspace_id: DEMO_WORKSPACE_ID,
      type: "working_on",
      content: "Flagging risks early instead of waiting until they become blockers.",
      confidence: "low",
      is_inferred: true,
    },
  ]);
  if (selfInsightsError) throw selfInsightsError;

  const { error: selfEvidenceError } = await supabase.from("self_insight_evidence").insert([
    { self_insight_id: siPattern, note_id: note1 },
    { self_insight_id: siStrength, note_id: note1 },
    { self_insight_id: siWatchOut, note_id: note1 },
    { self_insight_id: siWorkingOn, note_id: note3 },
  ]);
  if (selfEvidenceError) throw selfEvidenceError;

  console.log(
    `Demo workspace seeded: 8 people, 21 notes, ${personInsightRows.length} person insights, ${relationshipRows.length} relationships, ${lessonRows.length} lessons, self insights.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
