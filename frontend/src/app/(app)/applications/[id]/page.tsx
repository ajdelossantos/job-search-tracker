import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/utils/get-query-client";
import { getApplicationByIdOptions } from "@/lib/api/applications";
import ApplicationShow from "@/components/applications/ApplicationShow";

type Params = { id: string };

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const p = params instanceof Promise ? await params : params;
  const numId = Number(p.id);
  if (Number.isNaN(numId)) notFound();

  const qc = getQueryClient();
  const appQuery = getApplicationByIdOptions({
    path: { application_id: numId },
  });

  await qc.ensureQueryData(appQuery);
  const dehydrated = dehydrate(qc);

  // Optional: you could fetch here to render server-only summary too.
  return (
    <HydrationBoundary state={dehydrated}>
      <ApplicationShow id={numId} />
    </HydrationBoundary>
  );
}
