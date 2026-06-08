POST /api/users/create

Body:
{
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "Supplier",
  "display_name": "Acme Exporters Ltd",
  "company": { "id": "uuid", "name": "Acme Exporters Ltd" }
}

This route uses the SUPABASE_SERVICE_ROLE_KEY environment variable on the server.
