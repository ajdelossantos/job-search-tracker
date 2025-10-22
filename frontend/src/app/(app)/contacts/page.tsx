import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import ContactsIndex from "@/components/contacts/ContactsIndex";
import { getQueryClient } from "@/lib/utils/get-query-client";
import { getContactsFlat } from "@/lib/api/contacts";

const PAGE_SIZE = 200;

export default async function ContactsPage() {
  const queryClient = getQueryClient();

  await queryClient.ensureQueryData(
    getContactsFlat({ query: { limit: PAGE_SIZE, offset: 0 } }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ContactsIndex />
    </HydrationBoundary>
  );
}
