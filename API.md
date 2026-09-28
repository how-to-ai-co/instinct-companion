# Instinct delivery contract

Use your own deployed URL. `POST /api/memory` saves a delivery atomically to your Supabase database. `GET /api/memory` returns the latest 1,000 records (including completed/archived), a total record count, and the last 50 deliveries. The browser polls GET every five seconds. No AI calls are made.

For POST and private GET send `Authorization: Bearer YOUR_COMPANION_INGEST_TOKEN`. This is your companion integration key, **not** the Supabase service-role key. POST requires `Content-Type: application/json`. Public GET is enabled only by `COMPANION_PUBLIC_READ=true`.

```json
{
  "eventId": "conversation-42-message-7",
  "message": "Here is the link you asked me to save.",
  "records": [
    {
      "id": "saved-link-1",
      "version": 1,
      "type": "link",
      "title": "A useful reference",
      "url": "https://example.com",
      "tags": ["research"],
      "status": "active"
    }
  ]
}
```

Each delivery needs a unique, stable `eventId` (letters, digits, underscore or hyphen; max 100). Retry with the same ID and identical payload after network errors. Duplicate events are acknowledged without duplicate records. Reusing an event ID for different content returns 409.

Record fields:

- `id`: stable identifier; same format as eventId.
- `version`: positive integer; increase for each change. Older versions are ignored. Equal versions with different content return 409, rolling back the delivery.
- `type`: `link`, `list`, `reminder`, `task`, `project`, `note` or `fact`.
- `title`: required, up to 300 characters.
- `text`: optional plain text, up to 20,000 characters.
- `url`: HTTP/HTTPS URL; required for links. The app does not fetch or scrape it.
- `dueAt`: ISO timestamp with timezone; required for reminders.
- `projectId`: optional ID of a project record; links related records into a project view.
- `status`: `active` (default), `waiting`, `done` or `archived`. Done/archived records leave Home and appear in Archive.
- `items`: list entries `{ "id": "item-1", "text": "Pack a bag", "done": false }`.
- `tags`: optional strings.

Send the **whole record** when updating; omitted optional fields reset to their defaults. Max 100 records per delivery, 200 list items per record, 20 tags, 256 KB body. Malformed input is 400, invalid key 401, wrong content type 415, oversized body 413, storage failure 503. On 503 retry the identical event. Resolve 409 by correcting IDs/versions; do not blindly retry changed content under the same event ID.

## Forwarding instructions for Instinct

Configure an HTTP tool with the endpoint and key in its secret settings. On each intended message/update, send a delivery with its stable message/event ID and original text in `message`. Include typed records for anything that belongs in the saved views. Send both sides of the conversation only with the owner's intended scope. Maintain record IDs and monotonically increasing versions across follow-ups. Mark completed items done; mark retired information archived. Check the HTTP response and retry failed network/503 deliveries with the same payload. Read GET when needed to find existing IDs and versions.

Plain messages with no records are saved in Activity; this app does not infer tasks, dates or facts from prose. Instinct supplies that structure. An outbound tool or message hook must actually be configured and tested in Instinct: this repo cannot intercept all messages on its own. Reminder notifications remain the sender's responsibility.
