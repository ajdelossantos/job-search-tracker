import { client } from "@/client/client.gen";
import type { ApplicationRead, ApplicationUpdate, PipelineStatus } from "@/client/index";

export { readApplicationsApiV1ApplicationsGetOptions as getApplicationsOptions } from "@/client/@tanstack/react-query.gen";
export { readApplicationApiV1ApplicationsApplicationIdGetOptions as getApplicationByIdOptions } from "@/client/@tanstack/react-query.gen";
export type { ApplicationRead, ApplicationUpdate, PipelineStatus } from "@/client/index";

export async function updateApplicationStatus(args: {
  id: number;
  pipeline_status: PipelineStatus;
}) {
  const { id, pipeline_status } = args;
  // Adjust to your generated operation; this generic client.request works with path+method
  return client.request<ApplicationRead>({
    method: "PATCH",
    url: `/api/v1/applications/${id}`,
    body: { pipeline_status } satisfies ApplicationUpdate
  });
}