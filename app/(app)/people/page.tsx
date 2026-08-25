import AddPersonDialog from "@/components/people/AddPersonDialog";
import PeopleSearch from "@/components/people/PeopleSearch";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getPeopleList } from "@/lib/people/queries";
import { getWorkspaceId } from "@/lib/workspace";

export default async function PeopleListPage() {
  const workspaceId = await getWorkspaceId();
  const people = workspaceId ? await getPeopleList(getSupabaseAdmin(), workspaceId) : [];

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-light tracking-tight text-cocoa">People</h1>
          <p className="mt-1.5 text-[15px] text-cocoa-soft">Everyone you keep notes on.</p>
        </div>
        <AddPersonDialog />
      </div>

      <div className="mt-8">
        <PeopleSearch people={people} />
      </div>
    </div>
  );
}
