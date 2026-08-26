import type { SupabaseClient } from "@supabase/supabase-js";
import FacetCard from "@/components/people/FacetCard";
import { PeopleIcon } from "@/components/people/icons";
import { getOrCreateRelationshipMap } from "@/lib/people/relationshipMap";
import { getPeopleList } from "@/lib/people/queries";
import RelationshipMap from "./RelationshipMap";

export default async function RelationshipMapSection({
  supabase,
  workspaceId,
  personId,
}: {
  supabase: SupabaseClient;
  workspaceId: string;
  personId: string;
}) {
  // A transient failure here (a flaky DB round-trip, a race on first-time
  // map seeding) must not take down the rest of the person page with it —
  // degrade to a retry message instead of throwing past this component.
  let map: Awaited<ReturnType<typeof getOrCreateRelationshipMap>>;
  let people: Awaited<ReturnType<typeof getPeopleList>>;
  try {
    [map, people] = await Promise.all([
      getOrCreateRelationshipMap(supabase, workspaceId, personId),
      getPeopleList(supabase, workspaceId),
    ]);
  } catch (error) {
    console.error("Failed to load relationship map section:", error);
    return (
      <div className="mt-8">
        <FacetCard title="Your relationship map" icon={<PeopleIcon />} count={0}>
          <p className="text-[13.5px] text-cocoa-faint">
            Couldn&rsquo;t load your relationship map right now. Refresh the page to try again.
          </p>
        </FacetCard>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <FacetCard title="Your relationship map" icon={<PeopleIcon />} count={map.edges.length}>
        <RelationshipMap
          personId={personId}
          initialNodes={map.nodes}
          initialEdges={map.edges}
          initialNotes={map.notes}
          workspacePeople={people}
        />
      </FacetCard>
    </div>
  );
}
