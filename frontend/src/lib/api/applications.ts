import { queryOptions } from "@tanstack/react-query";

export const applicationsQueryOptions = queryOptions({
  queryKey: ["applications"],
  queryFn: async () => {
    const res = await fetch("http://localhost:8000/api/v1/applications");
    return res.json();
  },
});
