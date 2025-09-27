export {
  // Queries
  readApplicationsApiV1ApplicationsGetOptions as getApplicationsOptions,
  readApplicationApiV1ApplicationsApplicationIdGetOptions as getApplicationByIdOptions,

  // Mutations
  createApplicationApiV1ApplicationsPostMutation as createApplicationMutation,
  updateApplicationApiV1ApplicationsApplicationIdPatchMutation as updateApplicationMutation,
  deleteApplicationApiV1ApplicationsApplicationIdDeleteMutation as deleteApplicationMutation,
} from "@/client/@tanstack/react-query.gen";

export type {
  ApplicationRead,
  ApplicationUpdate,
  PipelineStatus,
} from "@/client/index";
