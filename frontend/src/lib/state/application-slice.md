# Application Slice

Used to interact with nested Application entities (i.e. Contacts, Interviews, Pipeline History) in the cached React Query state. Used when performing create, edit, and delete actions.

- SSOT: ['applications', id] holds ApplicationRead.

- Read: use readSlice(app, 'contacts') on the object you already have (SSR-hydrated in ApplicationShow).

- Optimistic writes: optimistic.insert/update/remove(qc, id, slice, ...) to update the parent cache instantly.

- Post-write sync: after server mutations, fetch the slice endpoint and replaceSlice(qc, id, slice, fresh) to reconcile.
