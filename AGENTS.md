<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Chat streaming lives in `src/routes/api/chat.ts` → `src/lib/chat.server.ts`, which verifies the caller's bearer token and uses an RLS-scoped client; keeps AI keys server-side and stored threads per-user.
- Threads are real URLs (`/chat/$threadId`); messages are stored as full AI SDK UIMessage JSON in `messages.message`, keyed by `ui_id` text (not the uuid PK).
