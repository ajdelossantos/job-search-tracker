import { client } from "@/client/client.gen";
import type {
  ApplicationRead,
  ApplicationUpdate,
  PipelineStatus,
} from "@/client/index";
export {
  readApplicationsApiV1ApplicationsGetOptions as getApplicationsOptions,
  readApplicationApiV1ApplicationsApplicationIdGetOptions as getApplicationByIdOptions,
} from "@/client/@tanstack/react-query.gen";
export type {
  ApplicationRead,
  ApplicationUpdate,
  PipelineStatus,
} from "@/client/index";
import { requestData } from "@/lib/api/http";

/**
 * Updates an existing job application with the provided data.
 *
 * @param id - The unique identifier of the application to update
 * @param body - The application data to update, containing partial application fields
 * @returns A promise that resolves to the updated application data
 * @throws Will throw an error if the request fails or the application is not found
 */
export function patchApplication(
  id: number,
  body: Partial<ApplicationUpdate>,
): Promise<ApplicationRead> {
  return requestData<ApplicationRead, Partial<ApplicationUpdate>>({
    method: "PATCH",
    url: `/api/v1/applications/${id}`,
    body: body satisfies ApplicationUpdate,
  });
}

/**
 * Updates the pipeline status of a job application.
 *
 * @param args - The update parameters
 * @param args.id - The unique identifier of the application to update
 * @param args.pipeline_status - The new pipeline status to set for the application
 * @returns A promise that resolves to the updated application data
 * @throws Will throw an error if the API request fails or the application is not found
 */
export async function updateApplicationStatus(args: {
  id: number;
  pipeline_status: PipelineStatus;
}) {
  const { id, pipeline_status } = args;
  return client.request<ApplicationRead>({
    method: "PATCH",
    url: `/api/v1/applications/${id}`,
    body: { pipeline_status } satisfies ApplicationUpdate,
  });
}
