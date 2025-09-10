import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/utils/get-query-client";
import { getApplicationByIdOptions } from "@/lib/api/applications"
import ApplicationRead from "@/components/ApplicationRead";


type PageProps = { params: { id: string } };

export default async function ApplicationDetailPage({ params }: PageProps) {
  const id = Number(params.id);
  if (Number.isNaN(id)) notFound();

  const qc = getQueryClient();
  const appQuery = getApplicationByIdOptions({ path: { application_id: id } });

  await qc.ensureQueryData(appQuery);
  const dehydrated = dehydrate(qc);

  // Optional: you could fetch here to render server-only summary too.
  return (
    <HydrationBoundary state={dehydrated}>
      <ApplicationRead id={id} />
    </HydrationBoundary>
  );
}

// 