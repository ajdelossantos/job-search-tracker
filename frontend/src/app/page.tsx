import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ApplicationsHome } from "@/components/ApplicationsHome";
import { getQueryClient } from "@/lib/utils/get-query-client";
import { applicationsQueryOptions } from "@/lib/api/applications";

export default function Home() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(applicationsQueryOptions);

  return (
    <div className="flex min-h-screen flex-col items-left justify-center py-2 px-8">
      <header className="text-2xl font-bold mb-4">Job Search Tracker</header>

      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <div className="mb-8">
          <h2 className="text-4xl font-bold">Welcome to Job Search Tracker</h2>
          <p className="mt-4">
            Track your job applications and interviews in one place.
          </p>
        </div>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ApplicationsHome />
        </HydrationBoundary>
      </main>

      <footer className="flex text-sm text-gray-500 justify-right items-right w-full ">
        <section>
          <p>&copy; {new Date().getFullYear()} By Alvin James</p>
        </section>
      </footer>
    </div>
  );
}
