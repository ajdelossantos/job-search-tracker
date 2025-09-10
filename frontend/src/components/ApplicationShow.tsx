'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import ApplicationStatusSelect from '@/components/ApplicationStatusSelect'
import { getApplicationByIdOptions } from '@/lib/api/applications'
import { PipelineStatus } from '@/lib/utils/enums'

/**
 * Tiny client shell to read cached data and show the status control.
 */
export default function ApplicationShow({ id }: { id: number }) {
  const { data: app } = useSuspenseQuery(getApplicationByIdOptions({ path: { application_id: id } }))

  if (!app) return <div className="p-4">Not found.</div>

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">
        {app.company} — {app.role}
      </h1>
      <div className="flex items-center gap-3">
        <span className="text-sm opacity-70">Pipeline status:</span>
        <ApplicationStatusSelect
          applicationId={id}
          current={app.pipeline_status as PipelineStatus}
        />
      </div>
      {/* v0.1 later: tabs for Interviews / Contacts / History */}
    </div>
  )
}
