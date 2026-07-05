# Architecture Decisions

## Services and what each one owns

### auth-service
- **Owns:** User registration, login, role management (Customer vs. Agent), and issuing/verifying JWTs (the digital VIP pass).
- **Database:** PostgreSQL (Auth DB).
- **Why separate from ticket-service:** Security and stability. If the ticket database crashes under heavy load, users can still log in or log out. Also, authentication logic changes rarely, while ticket features change often; keeping them separate means an update to the ticket system won't accidentally break user logins.

### ticket-service
- **Owns:** The core business logic. Creating, reading, updating, and deleting support tickets, plus tracking SLAs (time limits for resolving issues).
- **Database:** PostgreSQL (Ticket DB).
- **Publishes events:** `TicketCreated` (when a user submits a form) and `StatusUpdated` (when a ticket is resolved).
- **Subscribes to events:** `AIAnalysisComplete` (listens for the AI to finish so it can save the drafted reply to the database).

### ai-triage-service
- **Owns:** Reading ticket text, finding similar past tickets (RAG), and asking the LLM to categorize, prioritize, and draft a response.
- **Database:** No traditional relational database like Postgres. It only talks to the Vector DB (Chroma) to search for similar text embeddings — Chroma itself is its only memory between requests.
- **Subscribes to events:** `TicketCreated` (wakes up when there is a new ticket to analyze).
- **Publishes events:** `AIAnalysisComplete` (announces that it has finished thinking and has a draft ready).
- **External dependencies:** Hugging Face (for free sentence embeddings) and Groq (LLM) to generate the actual text.
- **Step-by-step flow when a TicketCreated event arrives:**
  1. Take the new ticket's text and turn it into an embedding (numbers).
  2. Search Chroma using that embedding — find similar OLD tickets.
     (The new ticket is NOT in Chroma yet, so it can't match itself.)
  3. Send the new ticket + the similar old tickets found in step 2 to the LLM.
  4. LLM returns category, priority, sentiment, draft reply.
  5. Publish `AIAnalysisComplete` with that result.
  6. NOW store the new ticket's embedding into Chroma — available as a
     "similar past ticket" for whatever ticket comes in next.
- **Cold start note:** Chroma starts empty, so the first tickets get no
  retrieved context — the system gets smarter as more tickets accumulate.
  Will seed Chroma with sample tickets before demoing, so the RAG behavior
  is visible from the start rather than waiting for real volume to build up.

### notification-service
- **Owns:** Sending out emails, webhooks, or in-app alerts to human agents and customers.
- **Subscribes to events:** All ticket events (e.g., hears `StatusUpdated` and sends an email saying "Your ticket has a new reply!").

### api-gateway
- **What does it NOT do:** It does not process any business logic, does not talk to any databases, and does not run any AI tasks. It is strictly a traffic cop: checks if your token is valid and routes your request to the correct microservice.

---

## Why microservices instead of one app?
In a single app, if the AI is taking 30 seconds to read a massive, complicated
ticket and maxes out the server's CPU, the whole system freezes. A customer
just trying to check their profile picture would be stuck on a loading screen.
By splitting them up, we can give the heavy AI service its own dedicated
resources without slowing down the fast, simple actions like saving a ticket
or logging in.

## Why event-driven (Redis pub/sub) instead of direct HTTP calls everywhere?
If the Ticket Service used an HTTP call to ask the AI Service for an analysis,
the user's browser would be stuck spinning until the AI finished generating
its reply. By using Redis (events), the Ticket Service simply drops a
"New Ticket" note in a box and instantly tells the user "Success!", letting
the AI take as much time as it needs in the background without making the
user wait.