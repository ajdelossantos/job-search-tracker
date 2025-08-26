# Planning notes: Job Search Tracker backend phase 1

The Job Search Tracker lets users track job applications and interviews. For the first iteration, let's keep the backend MVP lean. `Applications` will have information about the company, role, dates, contacts, application status, and notes. `Applications` has many `Interviews`. `Interviews` are mapped to a given application status and will have dates, contacts, notes. It'll be a locally deployed app used for a single user.

## Tech Stack

- FastAPI
- SQLite
- SQLAlchemy
- Uvicorn

## MVPs

- RESTful API that allows users to CRUD `Applications` and `Interviews`
- Users can create a job application, add details, and update an applications status
- Users can create application interviews and update relevant details, contacts, and dates

## Entities

Applications
  - id: int
  - created_at: timestamp
  - updated_at: timestamp
  - company_name: str
  - date_applied: Date(mm/dd/yyyy)
  - pipeline_status: Enum['initial', 'stage-1', 'stage-2', 'stage-3', 'stage-final', 'offer']
  - resolution_status: Enum[]
  - contacts: Contact(name, email, phone_number, title)[]
  - links: str[]
  - notes: str
  - interview_ids: int[]

Interview
  - id: int
  - created_at: timestamp
  - updated_at: timestamp
  - date_interviewed: Date(mm/dd/yyyy)
  - contacts: Contact(name, email, phone_number, title)[]
  - notes: str
  - application_id: int

### TODOs

  - come up with a strategy for adding dates for when the `pipeline_status` and `resolution_status`
    - consider something like `{ "pipeline_status": "stage-final", date: "08/23/2025"}`
    - consider Slowly Changing Dimension Type 2 strategy
