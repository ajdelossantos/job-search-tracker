# Job Search Tracker Backend

A FastAPI-powered API for tracking job applications, contacts, interviews and pipeline status history. Data is stored in a SQLite database and the API is documented with OpenAPI/Swagger at `/docs`.

## Data model

The backend uses SQLAlchemy models to persist four core entities:

- **Application** – company, role, salary expectations, current `pipeline_status`, related contacts and interviews, and audit `pipeline_histories`.
- **Contact** – person details and links to any number of applications (many‑to‑many).
- **Interview** – a scheduled interview for a specific application.
- **PipelineHistory** – immutable log of pipeline status transitions for an application.

## API Features

### Applications `/api/v1/applications`
- List applications including interviews, contacts and history.
- Retrieve a single application by id.
- Create applications and automatically append the initial pipeline history entry.
- Patch applications; if `pipeline_status` changes, a new history record is written.
- Delete applications (cascades to interviews, contacts links and history).

### Contacts `/api/v1/contacts`
- List contacts with optional filters: name, company or application id.
- Retrieve a contact by id with linked application ids.
- Create contacts and optionally link to existing applications.
- Patch contacts to edit details, add or remove application links.
- Delete contacts.

### Interviews
- Nested routes under an application: `GET/POST /api/v1/applications/{application_id}/interviews`.
- Flat convenience routes: `GET/POST /api/v1/interviews` and CRUD by interview id.
- `scheduled_date` must be timezone-aware; responses are coerced to UTC.

### Pipeline History
- Nested routes: `GET/POST /api/v1/applications/{application_id}/pipeline-history`.
- Flat routes: `GET/POST /api/v1/pipeline-history` and CRUD by history id.
- Only the `note` field is editable once a history row exists.

### Health Check
`GET /health-check` returns `{"status": "Healthy"}`.

## Local Development

1. **Set up Python environment**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install fastapi "uvicorn[standard]" sqlalchemy pydantic pydantic-extra-types
   ```

2. **Run the server**
   ```bash
   uvicorn app.main:app --reload
   ```
   The API is now available at <http://localhost:8000>, with docs at <http://localhost:8000/docs>.

3. **Run tests**
   ```bash
   pytest
   ```

The SQLite database file is created at `app/data/jobsapp.db`. Foreign key constraints are enforced and tables are created automatically on startup.
