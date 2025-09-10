'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ApplicationRead,
  getApplicationByIdOptions,
  getApplicationsOptions,
  updateApplicationStatus,
} from '@/lib/api/applications'
import { PipelineStatus, pipelineStatusOptions } from '@/lib/utils/enums'

type MaybeWrapped<T> = T | { data: T }

function hasData<T>(x: unknown): x is { data: T } {
  return typeof x === 'object' && x !== null && 'data' in x
}

export default function ApplicationStatusSelect({
  applicationId,
  current,
}: {
  applicationId: number
  current: PipelineStatus
}) {
  const qc = useQueryClient()
  const [value, setValue] = React.useState<PipelineStatus>(current)

  React.useEffect(() => setValue(current), [current])

  const appKey = getApplicationByIdOptions({
    path: { application_id: applicationId },
  }).queryKey
  const listKey = getApplicationsOptions().queryKey

  const mutation = useMutation({
    mutationFn: (next: PipelineStatus) =>
      updateApplicationStatus({ id: applicationId, pipeline_status: next }),

    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: appKey })

      const prev = qc.getQueryData<MaybeWrapped<ApplicationRead>>(appKey)

      qc.setQueryData<MaybeWrapped<ApplicationRead>>(appKey, (old) => {
        if (!old) return old
        const payload = hasData<ApplicationRead>(old) ? old.data : old
        const patched: ApplicationRead = { ...payload, pipeline_status: next }
        return hasData<ApplicationRead>(old)
          ? { ...old, data: patched }
          : patched
      })

      setValue(next)
      return { prev }
    },

    onError: (_e, _vars, ctx) => {
      if (ctx?.prev)
        qc.setQueryData<MaybeWrapped<ApplicationRead>>(appKey, ctx.prev)
      alert('Failed to update status')
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appKey })
      qc.invalidateQueries({ queryKey: listKey })
    },
  })

  return (
    <select
      className="border rounded px-2 py-1"
      value={value}
      disabled={mutation.isPending}
      aria-busy={mutation.isPending}
      onChange={(e) => mutation.mutate(e.target.value as PipelineStatus)}
    >
      {pipelineStatusOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
