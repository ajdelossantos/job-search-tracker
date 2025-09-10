import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import ApplicationsTable from "@/components/ApplicationsTable";
import { getQueryClient } from "@/lib/utils/get-query-client";
import { getApplicationsOptions } from "@/lib/api/applications";

const PAGE_SIZE = 50

export default async function Home() {
  const queryClient = getQueryClient();

  await queryClient.ensureQueryData(
    getApplicationsOptions({ query: { limit: PAGE_SIZE, offset: 0 } })
  )

  return (
    <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ApplicationsTable initialLimit={PAGE_SIZE} />
      </HydrationBoundary>
    </main>
  );
}
