import { readContactsApiV1ContactsGetOptions } from "@/client/@tanstack/react-query.gen";

export {
  createContactApiV1ContactsPostMutation as createContactMutation,
  updateContactApiV1ContactsContactIdPatchMutation as updateContactMutation,
  deleteContactApiV1ContactsContactIdDeleteMutation as deleteContactMutation,
} from "@/client/@tanstack/react-query.gen";

export type { ContactRead } from "@/client";

export const getContactsByApplicationId = (appId: number) =>
  readContactsApiV1ContactsGetOptions({
    query: { application_id: appId, limit: 200, offset: 0 },
  });
