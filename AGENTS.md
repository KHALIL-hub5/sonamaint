# SonaMaint contribution rules

- Layering: routes -> controller -> service -> repository. Only repositories contain SQL.
- Use plain SQL with the `pg` library and parameterised queries only; never concatenate SQL strings.
- API JSON uses camelCase. Database columns use snake_case. Convert between them in the repository layer.
- Validate every request body, query, and param with Zod.
- Throw `AppError(status, code, message)` for expected errors. One central error middleware returns `{ error: { code, message, details? } }`.
- All routes live under `/api` and require authentication, except `/api/health`.
- Allowed values: `pc.status` in `operational`, `in_maintenance`, `incident`; `intervention_class.type` in `H`, `S`; `storage_type` in `SSD`, `HDD`, `NVMe`.
- Never modify `db/schema.sql`.
- Every new route gets tests.
