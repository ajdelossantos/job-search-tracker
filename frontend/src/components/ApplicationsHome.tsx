"use client";

import { applicationsQueryOptions } from "@/lib/api/applications";
import { useSuspenseQuery } from "@tanstack/react-query";

export const ApplicationsHome = () => {
  const { data } = useSuspenseQuery(applicationsQueryOptions);

  return (
    <div className="flex justify-start w-full max-w-4xl py-4 border border-gray-300">
      <pre className="text-left text-sm px-4">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};
