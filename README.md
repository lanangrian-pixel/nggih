# Usaha XYZ Roadmap

The client roadmap is available at `/` (`index.html`). The editor is at `/editor.html`. Both pages load the same live milestone data from Supabase; editor access requires an email sign-in and an explicit database allowlist entry.

## Supabase setup

1. Create a Supabase project in the intended organization and region.
2. Run [`supabase-schema.sql`](./supabase-schema.sql) in the Supabase SQL Editor. It creates and seeds the milestone table, read-only public access, editor-only updates, and Realtime publication.
3. Add the approved editor email to the private allowlist in the SQL Editor:

   ```sql
   insert into private.editor_emails (email)
   values (lower(trim('YOUR_EDITOR_EMAIL')));
   ```

4. Copy the project URL and publishable/anon key from **Project Settings → API** into [`supabase-config.js`](./supabase-config.js). The publishable/anon key is intended for browser use; never put a `service_role` or secret key in this file.
5. In **Authentication → URL Configuration**, set the site URL to the Vercel deployment URL and add that URL plus `https://YOUR-VERCEL-DOMAIN/editor.html` to the redirect URL allowlist. Enable email OTP/magic links.

The RLS policies allow anyone to read milestones but only an authenticated, allowlisted email to update names, descriptions, and status. Do not disable RLS.

## Vercel deployment

Import the `nggih` GitHub repository into the intended Vercel account/team. This is a static HTML/CSS/JavaScript site, so no build command or output directory is required. After configuring Supabase, deploy the project. Share the root URL for clients and `/editor.html` for the editor.
