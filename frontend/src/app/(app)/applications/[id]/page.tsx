import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/utils/get-query-client";
import { getApplicationByIdOptions } from "@/lib/api/applications";
import ApplicationShow from "@/components/ApplicationShow";

type PageProps = { params: { id: string } };

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numId = Number(id);
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

//
