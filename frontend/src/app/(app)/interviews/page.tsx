import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import InterviewsIndex from "@/components/interviews/InterviewsIndex";
import { getQueryClient } from "@/lib/utils/get-query-client";
import { getInterviewsFlat } from "@/lib/api/interviews";

const PAGE_SIZE = 200;

export default async function InterviewsPage() {
  const queryClient = getQueryClient();

  await queryClient.ensureQueryData(
    getInterviewsFlat({ query: { limit: PAGE_SIZE, offset: 0 } }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InterviewsIndex />
    </HydrationBoundary>
  );
}
