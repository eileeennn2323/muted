import Link from "next/link";
import { AddNoteFormPanel, AddNoteProvider, AddNoteTriggerButton } from "@/components/people/AddNote";
import DeletePersonMenu from "@/components/people/DeletePersonMenu";
import FacetCard from "@/components/people/FacetCard";
import InsightList from "@/components/people/InsightList";
import PersonLessons from "@/components/people/PersonLessons";
import RelationshipCard from "@/components/people/RelationshipCard";
import RelationshipGraph from "@/components/people/RelationshipGraph";
import { ChatIcon, HeartIcon, HelpIcon, NoEntryIcon, SparkleIcon } from "@/components/people/icons";
import { getPersonPlaybook } from "@/lib/people/queries";
import { initialsFor } from "@/lib/people/format";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

const FACETS = [
  { type: "cares_about", title: "What they care about", icon: <HeartIcon /> },
  { type: "likely_questions", title: "Questions they'll probably ask", icon: <HelpIcon /> },
  { type: "communication", title: "How to communicate effectively with them", icon: <ChatIcon /> },
  { type: "avoid", title: "What to avoid", icon: <NoEntryIcon />, variant: "avoid" as const },
];

export default async function PersonPlaybookPage({ params }: PageProps<"/people/[id]">) {
  const { id } = await params;
  const workspaceId = await getWorkspaceId();
  const playbook = workspaceId ? await getPersonPlaybook(getSupabaseAdmin(), workspaceId, id) : null;

  if (!playbook) {
    return (
      <div>
        <h1 className="font-serif text-4xl font-light tracking-tight text-cocoa">Not found</h1>
        <p className="mt-4 text-cocoa-soft">
          This person doesn&rsquo;t exist in your workspace.{" "}
          <Link href="/people" className="text-cedar-dark underline">
            Back to People
          </Link>
        </p>
      </div>
    );
  }

  const { person, insightsByType, relationships, lessons } = playbook;
  const approachInsights = insightsByType.approach ?? [];
  const generalInsights = insightsByType.general ?? [];

  return (
    <div>
      <Link href="/people" className="text-[13.5px] text-cocoa-faint hover:text-cocoa-soft">
        ← People
      </Link>

      <AddNoteProvider>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage font-serif text-xl text-cedar-deep">
              {initialsFor(person.name)}
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-serif text-3xl font-light tracking-tight text-cocoa">{person.name}</h1>
              {person.roles.length > 0 && (
                <p className="mt-0.5 text-[14px] text-cocoa-soft">{person.roles.join(" · ")}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AddNoteTriggerButton />
            <DeletePersonMenu personId={person.id} personName={person.name} />
          </div>
        </div>

        <AddNoteFormPanel personId={person.id} />
      </AddNoteProvider>

      {generalInsights.length > 0 && (
        <div className="mt-6">
          <h2 className="font-serif text-xl font-light text-cocoa">Read of this person</h2>
          <div className="mt-2">
            <InsightList insights={generalInsights} />
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-border-warm bg-cream-highlight p-5">
        <div className="flex items-center gap-2">
          <span className="text-brass">
            <SparkleIcon />
          </span>
          <p className="font-mono text-[11px] tracking-wide text-brass uppercase">Working with {person.name}</p>
        </div>
        {approachInsights.length > 0 ? (
          <InsightList insights={approachInsights} />
        ) : (
          <p className="text-[13.5px] text-cocoa-faint">Nothing suggested yet.</p>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {FACETS.map((facet) => {
          const items = insightsByType[facet.type] ?? [];
          return (
            <FacetCard key={facet.type} title={facet.title} icon={facet.icon} count={items.length} variant={facet.variant}>
              <InsightList insights={items} />
            </FacetCard>
          );
        })}
      </div>

      <PersonLessons lessons={lessons} />

      {relationships.length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-xl font-light text-cocoa">Works with</h2>
          <div className="mt-4">
            <RelationshipGraph personName={person.name} relationships={relationships} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {relationships.map((r) => (
              <RelationshipCard key={r.id} relationship={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
