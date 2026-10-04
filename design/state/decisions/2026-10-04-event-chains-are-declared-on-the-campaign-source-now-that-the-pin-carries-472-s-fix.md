# decision/2026-10-04-event-chains-are-declared-on-the-campaign-source-now-that-the-pin-carries-472-s-fix
Date: 2026-10-04
Anchor: 2026-10-04 — Event chains are declared on the campaign source, now that the pin carries #472's fix
Status: accepted

## Claim
Stable Life's event chains are authored on `SimulationCampaignSource.eventChains`, as every other
collection is, since engine pin `cb64a05` carries #472's fix. The post-build spread the 2026-09-15
entry required is gone, and a source-level test asserts every referenced chain is declared.
