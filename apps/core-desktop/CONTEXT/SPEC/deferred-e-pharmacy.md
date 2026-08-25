# DEFERRED — e-pharmacy Panel

**Status:** 🔴 Post-MVP. Do not wire to live data.

## Why
Business Mechanism doc §2.1: e-pharmacy is a dormant OWNER-SIDE configuration
dashboard for future aMob visibility — not a live storefront in MVP. The
design draft shows live-looking Orders/Total Customers/Total Sales/Income/
Profit metrics and an "Online Store" toggle, which reads as a working
storefront rather than a config surface.

## What to do instead right now
If built at all before aMob ships, this screen should only expose:
availability hours/days, service toggles (Advice/Education/Consultancy/
Delivery/etc. — MODE only, not live bookings), and display name/logo config.
No live orders, no live revenue numbers, no functioning "Online Store" toggle
that does anything beyond saving a config flag.

## Unblock condition
aMob build begins (post-MVP phase, per PRD Non-Goal #1).