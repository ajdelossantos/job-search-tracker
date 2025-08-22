## 🖥️ Frontend Stack (Revised)

**Framework & UI**

* **Next.js (App Router)** + **TypeScript**
* **Tailwind CSS** for styling
* Component-level accessibility and responsiveness baked in

**Data Layer**

* **OpenAPI Typescript** (e.g. `openapi-typescript`) to **generate types** from your FastAPI spec
* **OpenAPI Fetch** (e.g. `openapi-fetch`) or a thin wrapper for **type-safe client calls**
* **TanStack Query** (React Query) for caching, mutations, and async state

  * Use query keys like `['applications', filters]`, `['application', id]`, `['companies', q]`

**Forms**

* **TanStack Form** for form state, validation, and async submission

  * Replace Zod with **OpenAPI-generated types** for input shape + lightweight custom validators where needed (e.g. URL, date)

**Auth**

* JWT stored in memory (or HTTP-only cookie if you go that route later)
* Add simple fetch interceptor to attach token when present

---

## 🔌 API Integration (With OpenAPI)

* Generate client & types from FastAPI docs:

  * `openapi-typescript http://localhost:8000/openapi.json -o src/types/openapi.ts`
* Use **OpenAPI Fetch** to create a typed client:

  ```ts
  import createClient from 'openapi-fetch';
  import { paths } from '@/types/openapi';

  export const api = createClient<paths>({ baseUrl: process.env.NEXT_PUBLIC_API_URL });
  ```
* Wrap network calls in **TanStack Query hooks**:

  ```ts
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

  export function useApplications(params) {
    return useQuery({
      queryKey: ['applications', params],
      queryFn: () => api.GET('/applications', { params: { query: params } }).then(r => r.data),
    });
  }

  export function useCreateApplication() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (body) => api.POST('/applications', { body }),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
    });
  }
  ```

**Forms via TanStack Form**

```tsx
import { useForm } from '@tanstack/react-form';

const form = useForm({
  defaultValues: { companyId: '', roleTitle: '', dateApplied: '' },
  onSubmit: async ({ value }) => { await createApplication.mutateAsync(value); },
  validators: {
    onChange: ({ value }) => ({
      roleTitle: value.roleTitle ? undefined : 'Role title is required',
      dateApplied: isValidDate(value.dateApplied) ? undefined : 'Invalid date',
    }),
  },
});
```

---

## 🧰 Tooling Adjustments (Frontend)

* ✅ **Keep**: Next.js, Tailwind, TanStack Query
* ✅ **Use**: TanStack Form instead of Zod
* ✅ **Add**: `openapi-typescript`, `openapi-fetch`, a client wrapper if needed
* ❌ **Drop**: Zod from the stack (you can still do ad-hoc validation where required)
* 📄 Add a small script to regenerate types from FastAPI OpenAPI on `postbuild` or via a `make gen-types` command

---

## 📄 Docs (Updated)

Add a section to `README.md`:

* “**API Types** are generated from FastAPI’s OpenAPI spec using `openapi-typescript`. The frontend consumes a fully typed client using `openapi-fetch`. Queries and mutations are composed with TanStack Query, while forms use TanStack Form with lightweight inline validators.”

---

If you want, I can generate a starter template for:

* `openapi-typescript` codegen config
* a typed client wrapper with auth header injection
* sample hooks + TanStack Form usage for `/applications` and `/applications/{id}/status`

Want me to scaffold the frontend with **Next.js + Tailwind + TanStack Query/Form + OpenAPI client** to get you moving fast?
