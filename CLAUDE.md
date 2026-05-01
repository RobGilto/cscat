# CSAT Survey for APAC Projects

## Project Summary

| Field | Value |
|---|---|
| **Project Slug** | cscat |
| **Type** | Consulting / Internal tooling |
| **Asana Task** | [1214079904075713](https://app.asana.com/0/1213801551934822/1214079904075713) |
| **Asana Projects** | APAC Sprint Board (`1213801551934822`), `1213638707069525` |
| **Owner** | Robert Gilto |
| **Requestor** | Paul Basterfield — Senior Manager, Consulting & Partner Services, APAC |
| **Status** | Not started — scoping |
| **Created** | 2026-04-17 |
| **Last Modified** | 2026-04-21 |
| **Due** | none set |

## Goal

Build web form in Domo to capture post-project customer feedback. Input feeds APAC delivery CSAT measurement. Form hosted on `domo.domo.com`.

## Email Template (sent with survey link)

**Subject:** We Value Your Feedback

> Thank you for partnering with us on your Domo initiative. As we complete this phase of the engagement, we would greatly appreciate your feedback on both the delivery experience and the business impact of the solution.
>
> Your input helps us continuously improve how we design, implement, and support analytics solutions for our customers. This short survey will take less than two minutes to complete.
>
> We sincerely value your perspective and appreciate your time.
>
> Best Regards,
> Paul Basterfield
> Senior Manager, Consulting & Partner Services, APAC

## Survey Schema

| # | Question | Type | Scale / Options |
|---|---|---|---|
| 1 | Overall Satisfaction — How satisfied are you with the Domo engagement overall? | single-select | 5 Extremely satisfied → 1 Extremely dissatisfied |
| 2 | Business Value — Has the delivered solution provided meaningful business value? | single-select | 5 Significant measurable value → 1 No value |
| 3 | Alignment to Objectives — How well did the solution align with original goals/expectations? | single-select | 5 Exceeded → 1 Did not meet |
| 4 | Delivery Experience — Project delivery experience (communication, organization, professionalism)? | single-select | 5 Excellent → 1 Poor |
| 5 | Future Engagement — Would you engage with our team or Partner again? | single-select | Definitely / Probably / Not sure / Probably not / Definitely not |
| 6 | Additional Feedback | open text | free text |

## Working Model — Build Plan

### Hosting decision
- **Target:** Domo custom app (Pro Code / brick) embedded in App Studio page on `domo.domo.com`.
- Alternative: native Domo Form (no-code). Custom app preferred for branding + write to AppDB + email-link token capture.

### Data model (AppDB collection: `apac_csat_responses`)
| Field | Type | Notes |
|---|---|---|
| `response_id` | uuid | client-generated |
| `submitted_at` | ISO timestamp | server-side |
| `project_name` | string | passed via URL param or selected from list |
| `customer_account` | string | URL param |
| `customer_contact` | string | optional, prefilled |
| `q1_overall` | int 1-5 | required |
| `q2_value` | int 1-5 | required |
| `q3_alignment` | int 1-5 | required |
| `q4_delivery` | int 1-5 | required |
| `q5_future` | enum | Definitely/Probably/NotSure/ProbablyNot/DefinitelyNot |
| `q6_feedback` | text | optional |
| `submitter_email` | string | optional |
| `nps_like_score` | int | derived: avg(q1..q4) |

### App stack
- React 18 + TypeScript + Vite + ryuu.js v6 (per `domain/domo-custom-apps.md`).
- AppDB write via `domo.post('/domo/datastores/v1/collections/apac_csat_responses/documents/')`.
- Manifest collection permissions: write for end-users.
- IS_LOCAL CSV mock for dev.

### Reporting layer (downstream, not part of MVP)
- AppDB → DataSet via AppDB connector → Card: avg per question, trend by month, breakdown by project/account.
- Dashboard for Paul.

## Architecture (locked)

```
Customer email
   └─> https://robgilto.github.io/cscat/?project=X&account=Y&contact=Z
        (Vite + React static site, hosted on GH Pages)
            └─> POST JSON to Domo Workflow webhook
                 └─> Workflow appends row to DataSet `apac_csat_responses`
                      └─> Domo card / dashboard for Paul
```

## Decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Audience | External customer contacts (Domo Everywhere acceptable but not used) |
| 2 | Storage write path | Domo Workflow webhook → DataSet (option b/a) |
| 3 | Hosting | GitHub Pages, public personal repo `robgilto/cscat` |
| 4 | Webhook target | Workflow with HTTP trigger → DataSet append (Stream API action) |
| 5 | Repo visibility | Public, personal account |
| 6 | Domain | `robgilto.github.io/cscat/` for MVP; `csat.domo.com` CNAME later |
| 7 | URL link generation | Manual for MVP; Asana-driven script later |
| - | URL shortener | bit.ly free tier for clean customer-facing link |

## DataSet Schema — `apac_csat_responses`

| Column | Type | Notes |
|---|---|---|
| `response_id` | string | UUID v4 |
| `submitted_at` | datetime | ISO timestamp, client-set |
| `project_name` | string | from `?project=` |
| `customer_account` | string | from `?account=` |
| `customer_contact` | string | from `?contact=` |
| `q1_overall` | long | 1-5 |
| `q2_value` | long | 1-5 |
| `q3_alignment` | long | 1-5 |
| `q4_delivery` | long | 1-5 |
| `q5_future` | string | enum: Definitely / Probably / NotSure / ProbablyNot / DefinitelyNot |
| `q6_feedback` | string | free text, optional |
| `avg_score` | decimal | mean(q1..q4) |
| `user_agent` | string | UA string |

## Action Plan

### Phase 1 — Code complete (DONE)
- [x] Scaffold Vite + React + TS
- [x] 6-question form with validation
- [x] URL param capture
- [x] Webhook POST + thank-you state
- [x] GH Actions deploy workflow
- [x] Build green, dev server running

### Phase 2 — Domo backend (next)
- [ ] Create DataSet `apac_csat_responses` with schema above (empty CSV upload or API)
- [ ] Build Domo Workflow:
  - Trigger: HTTP webhook
  - Action: write incoming JSON row to DataSet via Stream API
  - Confirm CORS allows browser POST
- [ ] Capture webhook URL
- [ ] Test with curl POST → verify row lands in DataSet

### Phase 3 — Deploy
- [ ] Create public GitHub repo `robgilto/cscat`
- [ ] Push code
- [ ] Add Actions secret `VITE_WEBHOOK_URL`
- [ ] Enable GitHub Pages (Settings → Pages → source: GitHub Actions)
- [ ] Verify deploy at `robgilto.github.io/cscat/`
- [ ] End-to-end test: submit form → check DataSet

### Phase 4 — Reporting
- [ ] Build summary card: avg per question
- [ ] Trend card: monthly avg
- [ ] Breakdown card: by project / account
- [ ] Dashboard for Paul

### Phase 5 — Pilot
- [ ] Pick 2-3 recently closed APAC projects
- [ ] Manually generate URL with shortener (bit.ly)
- [ ] Send via Paul's email template
- [ ] Gather submission feedback (UX issues, mobile, etc.)
- [ ] Iterate

### Phase 6 — Rollout
- [ ] Build Asana-driven URL generator script
- [ ] Request `csat.domo.com` CNAME from Domo IT
- [ ] Document process for Paul + APAC team
- [ ] Hand off

## Open Items / Future
- Token-per-link to prevent duplicate submissions (skipped for MVP)
- Anonymous vs attributed — currently captures contact only via URL param, not authenticated
- Email automation — Paul sends manually for now; could fire from Domo Workflow on project close
- Multi-language support if customer base expands

## Sync State

| Field | Value |
|---|---|
| **Last Asana Sync** | 2026-05-01 14:40 |
| **Asana Status** | open, unscheduled |
| **Last Outbound** | — |
| **Last Inbound** | — |
