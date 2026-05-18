# 🔒 How to Fix Your Website Security — Step by Step

This guide walks you through fixing the security issues found on **staffps.com**.

**You don't need to be technical.** Every fix has a ready-made prompt you can copy and paste directly into [Claude](https://claude.ai) or ChatGPT. The AI will guide you through the rest.

---

## Before You Start

You will need:
- Your **Supabase dashboard** → [app.supabase.com](https://app.supabase.com)
- Your **Vercel dashboard** → [vercel.com](https://vercel.com)
- Your website **code** open (on GitHub, or in VS Code)

> 💡 **Tip:** Open Claude or ChatGPT in a separate tab. When you see a prompt box below, copy it, paste it there, and follow what it tells you.

---

## ✅ Checklist

| # | Fix | Priority | Done? |
|---|-----|----------|-------|
| 1 | Enable RLS on the profiles table | 🔴 Critical | ☐ |
| 2 | Enable RLS on all other tables | 🔴 Critical | ☐ |
| 3 | Stop browser from calling Supabase directly | 🔴 Critical | ☐ |
| 4 | Limit which columns your queries return | 🟡 Important | ☐ |
| 5 | Check login rate limits | 🟡 Important | ☐ |
| 6 | Fix login error messages (email leak) | 🟡 Important | ☐ |
| 7 | Make file storage private | 🟡 Important | ☐ |
| 8 | Validate user roles on the server | 🟡 Important | ☐ |
| 9 | Rotate the anon key | 🟢 Good Practice | ☐ |
| 10 | Add CAPTCHA to signup | 🟢 Good Practice | ☐ |
| 11 | Add security headers | 🟢 Good Practice | ☐ |
| 12 | Remove unused tables and columns | 🟢 Good Practice | ☐ |

---

## 🔴 CRITICAL — Do These First

---

### Fix 1: Enable RLS on the profiles table

**What's wrong?**
Anyone on the internet can read every user's name, email, and profile on your site without logging in. A protection feature called Row Level Security (RLS) is turned off.

**Step 1 — Turn on RLS:**
1. Go to [app.supabase.com](https://app.supabase.com) and open your project
2. Click **Table Editor** in the left sidebar
3. Click on the **profiles** table
4. Find the **Enable RLS** toggle and turn it ON

**Step 2 — Add policies so your users can still use the site:**

After turning RLS on, even logged-in users can't read anything until you add rules. Copy and paste the prompt below into Claude or ChatGPT:

---

📋 **COPY THIS PROMPT INTO CLAUDE / CHATGPT:**

```
I'm building a job platform called staffps.com using Next.js and Supabase.

I just enabled Row Level Security (RLS) on my "profiles" table in Supabase.
Now I need to add RLS policies so that:
1. Any logged-in user can read any profile (needed for job listings to work)
2. A user can only update or delete their own profile

The user ID column in the profiles table is called "id".
Supabase's current user ID is auth.uid().

Please give me the exact SQL statements to run in the Supabase SQL Editor to create these policies.
Also tell me step by step where to go in the Supabase dashboard to run the SQL.
```

---

Paste what the AI gives you into **Supabase → SQL Editor → New Query**, then click **Run**.

---

### Fix 2: Enable RLS on all other tables

**What's wrong?**
Other tables like messages, notifications, and jobs may also be unprotected.

**Step 1 — Find which tables are exposed:**
1. Go to **Supabase → SQL Editor → New Query**
2. Paste this and click **Run**:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

3. Any table where `rowsecurity` says `false` is unprotected.

**Step 2 — Fix each unprotected table** by copying this prompt (replace `TABLE_NAME` with the real table name):

---

📋 **COPY THIS PROMPT INTO CLAUDE / CHATGPT:**

```
I'm building a job platform called staffps.com using Next.js and Supabase.

I need to enable Row Level Security on my "TABLE_NAME" table and add the right policies.

This table is used for: [describe it briefly, e.g. "private messages between employers and job seekers"]

The column that links a row to a user is called: [e.g. "user_id" or "sender_id"]
Supabase's current user ID is auth.uid().

Please give me:
1. The SQL to enable RLS on this table
2. The SQL to add appropriate read/write policies
3. Step by step instructions for where to run this in Supabase
```

---

Repeat for every table that showed `false` in the results.

---

### Fix 3: Stop the browser from calling Supabase directly

**What's wrong?**
Your Supabase database address is visible to anyone who opens browser developer tools. All database calls should go through your own server instead.

---

📋 **COPY THIS PROMPT INTO CLAUDE / CHATGPT:**

```
I'm building a job platform called staffps.com using Next.js 14 (App Router) and Supabase.

Right now, my frontend React components are calling Supabase directly from the browser
using createBrowserClient from @supabase/ssr. This exposes my Supabase URL in network requests.

I want to move my database calls to Next.js server-side code (Server Components or API Routes)
so the Supabase URL is not visible in the browser.

Can you:
1. Explain in simple terms why this matters
2. Show me a before/after example — before: a client component fetching a user profile,
   after: a Server Component doing the same thing
3. Tell me exactly which files I need to change and where to put the new code
4. Tell me what to do with the old client-side code

My environment variables are:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 🟡 IMPORTANT — Do These Soon

---

### Fix 4: Limit which columns your queries return

**What's wrong?**
Your queries currently ask for all columns (`select *`). This can expose data users shouldn't see even after RLS is enabled.

---

📋 **COPY THIS PROMPT INTO CLAUDE / CHATGPT:**

```
I'm building a job platform called staffps.com using Next.js and Supabase.

My Supabase queries use .select('*') which returns all columns from the database table.
I want to update them to only return the columns my app actually needs.

For the profiles table, the columns I display in the UI are:
id, full_name, avatar_url, role, bio, location

Can you:
1. Show me how to change .select('*') to only select specific columns in Supabase
2. Explain how to figure out which columns each page of my app actually needs
3. Show me if I can hide sensitive columns like "email" from ever being returned publicly
```

---

### Fix 5: Check your login rate limits

**What's wrong?**
Without rate limits, a bot could try thousands of passwords on your login page automatically.

**No-code fix — just click through:**
1. Go to **Supabase → Authentication → Rate Limits**
2. Make sure **Sign in** and **Sign up** limits are enabled
3. A safe setting is around **5 attempts per hour per IP**

If you can't find it or something looks wrong:

---

📋 **COPY THIS PROMPT INTO CLAUDE / CHATGPT:**

```
I'm using Supabase Auth for my Next.js job platform staffps.com.
I want to protect my login and signup pages from brute force attacks.

Can you:
1. Tell me exactly where in the Supabase dashboard to find and configure rate limits
2. Tell me what the recommended settings are
3. Show me if there's anything to add in my Next.js code for extra protection
```

---

### Fix 6: Fix login error messages

**What's wrong?**
If your login shows "user not found" for unknown emails and "wrong password" for known ones, attackers can figure out which emails are registered.

**Test it first:**
1. Go to your login page
2. Try a fake email: `test99999fake@nowhere.com` — note the error message
3. Try a real user's email with a wrong password — note the error message
4. If the messages are different, use the prompt below

---

📋 **COPY THIS PROMPT INTO CLAUDE / CHATGPT:**

```
I'm building a job platform called staffps.com using Next.js and Supabase Auth.

My login form shows different error messages depending on whether an email exists or not.
This lets attackers find out which emails are registered on my platform.

I want ALL login errors to show the same message:
"Invalid email or password. Please try again."
— regardless of whether the email exists or not.

Can you:
1. Show me where in my Next.js login code to catch the Supabase auth error
2. Show me how to display the same generic message for every type of login failure
3. Show me the exact code change to make
```

---

### Fix 7: Make your file storage private

**What's wrong?**
If any storage bucket is set to "public", anyone can access files like resumes or profile photos using a guessable URL.

**Check first:**
1. Go to **Supabase → Storage**
2. Click each bucket — if it says "Public", it needs fixing

---

📋 **COPY THIS PROMPT INTO CLAUDE / CHATGPT:**

```
I'm building a job platform called staffps.com using Next.js and Supabase Storage.

I have a storage bucket that contains user profile photos and resumes.
I want to make it private so files can't be accessed with random URLs.

Can you:
1. Tell me step by step how to change a bucket from public to private in the Supabase dashboard
2. Show me how to generate a signed URL in Next.js so my users can still view their own files
3. Show me where in my component to use the signed URL to display a profile photo
4. Tell me if I need to add any RLS policies for storage as well
```

---

### Fix 8: Validate user roles on the server

**What's wrong?**
Your app has two user types: seekers and employers. If the role check only happens in the browser, a technical user could fake being an employer and access features they shouldn't.

---

📋 **COPY THIS PROMPT INTO CLAUDE / CHATGPT:**

```
I'm building a job platform called staffps.com using Next.js and Supabase Auth.

My users have a custom field "user_role" in their JWT token — either "seeker" or "employer".
Only employers should be able to post jobs.

I'm worried a user could bypass the frontend check and pretend to be an employer.

Can you:
1. Explain in simple terms why frontend-only role checks are unsafe
2. Show me how to check the user's role securely in a Next.js Server Component or API route
3. Show me how to protect my "post a job" page so only employers can access it
4. Show me the Supabase RLS policy to add to the "jobs" table to enforce this at the database level too
```

---

## 🟢 GOOD PRACTICE — Do These When You Have Time

---

### Fix 9: Rotate your Supabase anon key

Since the key was visible during this test, it's good to generate a new one.

**No-code steps:**
1. Go to **Supabase → Settings → API**
2. Regenerate the **anon / public** key
3. Copy the new key
4. Go to **Vercel → Your Project → Settings → Environment Variables**
5. Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the new key
6. Redeploy on Vercel

If you get stuck:

---

📋 **COPY THIS PROMPT INTO CLAUDE / CHATGPT:**

```
I need to rotate (regenerate) my Supabase anon key for my Next.js project on Vercel.
Can you give me step by step instructions for:
1. How to regenerate the key in Supabase
2. Where to update it in Vercel
3. How to make sure nothing breaks after the rotation
4. Whether I need to update anything in my codebase
```

---

### Fix 10: Add CAPTCHA to your signup page

This stops bots from creating thousands of fake accounts.

---

📋 **COPY THIS PROMPT INTO CLAUDE / CHATGPT:**

```
I'm building a job platform called staffps.com using Next.js and Supabase Auth.
I want to add CAPTCHA to my signup page to prevent bot registrations.

Supabase supports hCaptcha natively. Can you:
1. Tell me step by step how to enable hCaptcha in the Supabase dashboard
2. Show me how to add the hCaptcha widget to my existing Next.js signup form
3. Tell me which npm package I need to install
4. Show me the complete updated signup form code with CAPTCHA included
```

---

### Fix 11: Add security headers to your Next.js app

This limits what your website can do in the browser, reducing damage if any future vulnerability is found.

---

📋 **COPY THIS PROMPT INTO CLAUDE / CHATGPT:**

```
I have a Next.js 14 app deployed on Vercel for a job platform called staffps.com.
I want to add HTTP security headers to improve protection.

Can you:
1. Show me the security headers I should add to my next.config.js file
2. Explain in one sentence what each header does
3. Make sure the headers won't break my Google OAuth login or Supabase API calls
4. Tell me how to verify the headers are working after I deploy
```

---

### Fix 12: Remove unused database columns

Less data stored = less data that can be leaked.

---

📋 **COPY THIS PROMPT INTO CLAUDE / CHATGPT:**

```
I'm using Supabase for my Next.js job platform staffps.com.
I want to clean up my database by removing columns that my app doesn't actually use.

Can you:
1. Explain how to safely identify unused columns without breaking anything
2. Tell me what to check in my codebase before deleting a column
3. Show me how to safely remove a column from a Supabase table
4. Tell me how to back up my data first just in case
```

---

## 💬 If You Get Stuck

When the AI gives you a response and you're still confused, try these follow-up messages:

| Situation | What to say to the AI |
|-----------|----------------------|
| Don't understand the code | *"Can you explain what this code does in plain English, line by line?"* |
| Got an error | *"I got this error: [paste error here]. What do I do?"* |
| Not sure where to put the code | *"Which file does this go in? Show me exactly where in the file."* |
| Still not working | *"It's still not working. Here's what I see: [describe]. What should I try next?"* |
| Want to double-check before running | *"Is this safe to run? Will it delete any of my data?"* |

---

> 🚨 **Most urgent:** Fix 1 should be done today. Right now anyone can read your users' emails and profiles without logging in.

*Security test conducted May 13, 2026 by Osama Jarrar — browser-based only, no automated tools.*
