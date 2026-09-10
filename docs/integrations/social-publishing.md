# Social publishing

Publishing uses active tenant integrations in `integrations` and `integration_credentials`; credentials never reach the browser. Facebook uses Graph `/feed`, Instagram uses media creation plus `/media_publish`, and LinkedIn uses `/v2/ugcPosts`.

Configure an access token and `external_account_id` (Facebook Page ID, Instagram Business Account ID, or LinkedIn person ID/URN). Missing credentials fail with `PROVIDER_NOT_CONFIGURED`; the API never reports success without a provider response.

Scheduled posts persist as `scheduled`. Without a queue, the API polls every 30 seconds and records `published`/`failed`, provider IDs in `external_ids`, and errors in `last_error`.
