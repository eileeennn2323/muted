/**
 * Seeds (or re-seeds) the shared, fictional demo workspace that judges land
 * in. Run with: npm run seed
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

async function main() {
  console.log("Resetting demo workspace...");
  const { error: deleteError } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", DEMO_WORKSPACE_ID);
  if (deleteError) throw deleteError;

  const { error: wsError } = await supabase.from("workspaces").insert({
    id: DEMO_WORKSPACE_ID,
    kind: "demo",
    seeded_at: new Date().toISOString(),
  });
  if (wsError) throw wsError;

  const john = randomUUID();
  const sarah = randomUUID();
  const jayden = randomUUID();

  const { error: peopleError } = await supabase.from("people").insert([
    { id: john, workspace_id: DEMO_WORKSPACE_ID, name: "John", roles: ["Upper management"], aliases: ["JT"] },
    { id: sarah, workspace_id: DEMO_WORKSPACE_ID, name: "Sarah", roles: ["Stakeholder"], aliases: [] },
    { id: jayden, workspace_id: DEMO_WORKSPACE_ID, name: "Jayden", roles: ["Peer"], aliases: [] },
  ]);
  if (peopleError) throw peopleError;

  const note1 = randomUUID();
  const note2 = randomUUID();
  const note3 = randomUUID();

  const { error: notesError } = await supabase.from("notes").insert([
    {
      id: note1,
      workspace_id: DEMO_WORKSPACE_ID,
      raw_content:
        "Had the Project Alpha review with John and Sarah today. John kept pushing on downstream impact and wouldn't let up until I showed the mitigation plan - then he was fine. Sarah was quiet until John left, then flagged she's worried about manpower for next sprint. Room felt tense whenever the timeline came up.",
      context_summary:
        "Room was tense whenever the timeline came up; eased once a mitigation plan was shown.",
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
  ]);
  if (notesError) throw notesError;

  const { error: notePeopleError } = await supabase.from("note_people").insert([
    { note_id: note1, person_id: john },
    { note_id: note1, person_id: sarah },
    { note_id: note2, person_id: sarah },
    { note_id: note3, person_id: john },
    { note_id: note3, person_id: jayden },
  ]);
  if (notePeopleError) throw notePeopleError;

  const piJohnCares = randomUUID();
  const piJohnComm = randomUUID();
  const piJohnQuestions = randomUUID();
  const piJohnAvoid = randomUUID();
  const piJohnApproach = randomUUID();
  const piSarahCares = randomUUID();
  const piSarahComm = randomUUID();
  const piJohnGeneral = randomUUID();
  const piSarahGeneral = randomUUID();

  const { error: personInsightsError } = await supabase.from("person_insights").insert([
    {
      id: piJohnCares,
      workspace_id: DEMO_WORKSPACE_ID,
      person_id: john,
      type: "cares_about",
      content: "Delivery risk and downstream impact of any delay.",
      confidence: "high",
      is_inferred: true,
    },
    {
      id: piJohnComm,
      workspace_id: DEMO_WORKSPACE_ID,
      person_id: john,
      type: "communication",
      content: "Wants downstream impact addressed before anything else. Settles once a mitigation plan is shown.",
      confidence: "high",
      is_inferred: true,
    },
    {
      id: piJohnQuestions,
      workspace_id: DEMO_WORKSPACE_ID,
      person_id: john,
      type: "likely_questions",
      content: "What's the downstream impact, and what's the mitigation plan?",
      confidence: "high",
      is_inferred: true,
    },
    {
      id: piJohnAvoid,
      workspace_id: DEMO_WORKSPACE_ID,
      person_id: john,
      type: "avoid",
      content: "Don't lead with excuses or background before addressing impact.",
      confidence: "medium",
      is_inferred: true,
    },
    {
      id: piJohnApproach,
      workspace_id: DEMO_WORKSPACE_ID,
      person_id: john,
      type: "approach",
      content: "Lead with impact and the mitigation plan. Keep background for after.",
      confidence: "medium",
      is_inferred: true,
    },
    {
      id: piSarahCares,
      workspace_id: DEMO_WORKSPACE_ID,
      person_id: sarah,
      type: "cares_about",
      content: "Manpower and resourcing constraints for upcoming sprints.",
      confidence: "high",
      is_inferred: true,
    },
    {
      id: piSarahComm,
      workspace_id: DEMO_WORKSPACE_ID,
      person_id: sarah,
      type: "communication",
      content: "Opens up in more detail one-on-one; more reserved when John is in the room.",
      confidence: "medium",
      is_inferred: true,
    },
    {
      id: piJohnGeneral,
      workspace_id: DEMO_WORKSPACE_ID,
      person_id: john,
      type: "general",
      content: "Stays calm and measured even when pushing hard on a point.",
      confidence: "medium",
      is_inferred: true,
    },
    {
      id: piSarahGeneral,
      workspace_id: DEMO_WORKSPACE_ID,
      person_id: sarah,
      type: "general",
      content: "Reads the room before speaking up — waits to see how others react first.",
      confidence: "low",
      is_inferred: true,
    },
  ]);
  if (personInsightsError) throw personInsightsError;

  const { error: piEvidenceError } = await supabase.from("person_insight_evidence").insert([
    { insight_id: piJohnCares, note_id: note1 },
    { insight_id: piJohnComm, note_id: note1 },
    { insight_id: piJohnComm, note_id: note2 },
    { insight_id: piJohnQuestions, note_id: note1 },
    { insight_id: piJohnQuestions, note_id: note2 },
    { insight_id: piJohnAvoid, note_id: note1 },
    { insight_id: piJohnApproach, note_id: note1 },
    { insight_id: piSarahCares, note_id: note1 },
    { insight_id: piSarahComm, note_id: note2 },
    { insight_id: piJohnGeneral, note_id: note1 },
    { insight_id: piSarahGeneral, note_id: note2 },
  ]);
  if (piEvidenceError) throw piEvidenceError;

  const relJohnSarah = randomUUID();
  const relJohnJayden = randomUUID();

  const { error: relError } = await supabase.from("relationship_insights").insert([
    {
      id: relJohnSarah,
      workspace_id: DEMO_WORKSPACE_ID,
      person_a_id: john,
      person_b_id: sarah,
      content: "Sarah gives much more detail on resourcing when John isn't in the room.",
      confidence: "medium",
      is_inferred: true,
      relationship_type: "influences",
    },
    {
      id: relJohnJayden,
      workspace_id: DEMO_WORKSPACE_ID,
      // Jayden is person_a here (not John) because relationship_type: "influences"
      // means person_a influences person_b — it's Jayden's presence that changes
      // John's behaviour, not the other way round.
      person_a_id: jayden,
      person_b_id: john,
      content: "John is noticeably more careful and double-checks numbers when Jayden is present.",
      confidence: "low",
      is_inferred: true,
      relationship_type: "influences",
    },
  ]);
  if (relError) throw relError;

  const { error: relEvidenceError } = await supabase.from("relationship_insight_evidence").insert([
    { relationship_insight_id: relJohnSarah, note_id: note1 },
    { relationship_insight_id: relJohnSarah, note_id: note2 },
    { relationship_insight_id: relJohnJayden, note_id: note3 },
  ]);
  if (relEvidenceError) throw relEvidenceError;

  const lessonComm = randomUUID();
  const lessonLeadership = randomUUID();
  const lessonStakeholder = randomUUID();
  const lessonGrowth = randomUUID();

  const { error: lessonsError } = await supabase.from("lessons").insert([
    {
      id: lessonComm,
      workspace_id: DEMO_WORKSPACE_ID,
      title: "Answer the question first, then explain.",
      explanation: "Leading with background before answering the actual question reads as evasive under pressure.",
      themes: ["Communication"],
      is_inferred: true,
    },
    {
      id: lessonLeadership,
      workspace_id: DEMO_WORKSPACE_ID,
      title: "Raise resourcing risk early.",
      explanation: "Flagging a constraint days ahead lands far better than surfacing it as a last-minute ambush.",
      themes: ["Leadership"],
      is_inferred: true,
    },
    {
      id: lessonStakeholder,
      workspace_id: DEMO_WORKSPACE_ID,
      title: "Bring a mitigation plan whenever you raise a delay.",
      explanation: "A delay lands better paired with a concrete plan than with an explanation alone.",
      themes: ["Stakeholder Management"],
      is_inferred: true,
    },
    {
      id: lessonGrowth,
      workspace_id: DEMO_WORKSPACE_ID,
      title: "Notice when you're over-explaining under pressure.",
      explanation: "Adding context before answering the direct question is a recurring habit worth watching.",
      themes: ["Personal Growth"],
      is_inferred: true,
    },
  ]);
  if (lessonsError) throw lessonsError;

  const { error: lessonEvidenceError } = await supabase.from("lesson_evidence").insert([
    { lesson_id: lessonComm, note_id: note1 },
    { lesson_id: lessonLeadership, note_id: note3 },
    { lesson_id: lessonStakeholder, note_id: note1 },
    { lesson_id: lessonGrowth, note_id: note1 },
  ]);
  if (lessonEvidenceError) throw lessonEvidenceError;

  const { error: lessonPeopleError } = await supabase.from("lesson_people").insert([
    { lesson_id: lessonComm, person_id: john },
    { lesson_id: lessonLeadership, person_id: sarah },
    { lesson_id: lessonStakeholder, person_id: john },
  ]);
  if (lessonPeopleError) throw lessonPeopleError;

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

  console.log("Demo workspace seeded: 3 people, 3 notes, 4 lesson themes, self insights.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
