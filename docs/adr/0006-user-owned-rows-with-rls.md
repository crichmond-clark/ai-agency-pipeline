# User-owned rows with RLS

Superseded by [0011 Next.js, Payload CMS, and Python AI workers architecture](0011-nextjs-payload-python-workers-architecture.md).

The underlying safety decision remains: records should have explicit ownership/access rules from the first implementation. The specific mechanism changes from Supabase `user_id` ownership and RLS to Payload Auth and collection access control.
