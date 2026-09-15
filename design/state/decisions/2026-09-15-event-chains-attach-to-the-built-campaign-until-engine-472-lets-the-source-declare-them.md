# decision/2026-09-15-event-chains-attach-to-the-built-campaign-until-engine-472-lets-the-source-declare-them
Date: 2026-09-15
Anchor: 2026-09-15 — Event chains attach to the built campaign until engine #472 lets the source declare them
Status: accepted

## Claim
Stable Life's `EventChainDefinition`s are spread into the built `SimulationCampaign` content in
`buildStableLifeCampaign`, because `SimulationCampaignSource` has no `eventChains` field (engine
issue #472) and Tier 1 rejects any undeclared `chainId`. The site cites #472. When a pin carries its
fix, the chains move onto the source and the spread is removed; neither dropping `chainId` nor
hand-editing the export is an acceptable substitute.
