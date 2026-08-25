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
  const [map, people] = await Promise.all([
    getOrCreateRelationshipMap(supabase, workspaceId, personId),
    getPeopleList(supabase, workspaceId),
  ]);

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
