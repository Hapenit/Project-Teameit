# Production email and SMS campaigns

Campaigns use tenant-scoped, verified integrations: SMTP credentials are
verified before delivery and Twilio (or a future adapter) is selected through
the provider field. No provider credentials or synthetic success are accepted.

Email supports plain text, HTML, `{{contact_field}}` variables, sender/reply-to
fields, List-Unsubscribe headers, audience tags/source segments, and scheduled
delivery. SMS is queued with provider delivery callbacks, exponential retries
(three attempts), rate-limit-friendly delayed retries, and per-contact opt-out.

Apply migrations `029_marketing_campaigns.sql` and `030_campaign_lifecycle_compliance.sql`. Configure `CAMPAIGN_PUBLIC_URL`
as an HTTPS URL in production. Configure SMTP or `SMS_PROVIDER=twilio` and
Twilio credentials/number. For India, obtain TRAI DLT principal-entity,
sender/header, and template registrations before sending commercial SMS.
Maintain documented consent; the API skips contacts without channel consent or
with `email_opt_out`/`sms_opt_out`.
