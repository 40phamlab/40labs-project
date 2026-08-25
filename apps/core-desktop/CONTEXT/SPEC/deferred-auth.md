# DEFERRED — Sign In / Role Screen

**Status:** 🔴 Do not build against real auth logic.

## Why
PRD §8 explicitly blocks `apps/core-desktop` auth screens pending the
Staff/Pharmacist/Admin redesign and device-binding logic finalization.
The current design draft shows a First Name/Last Name/Phone/Role/Password
self-registration form, which appears to contradict the locked two-tier
auth model (SUDO created at registration, staff added only by SUDO —
no staff self-registration).

## What to do instead right now
Build all feature screens (Inventory, Sales, etc.) assuming an already-
authenticated SUDO or staff session exists. Use a mocked/static current-user
context for local dev. Do not wire a real login flow.

## Unblock condition
Sairiamu confirms: (a) this screen is SUDO first-time setup only, renamed
accordingly, or (b) it's replaced by owner-adds-staff + QR/PIN pairing
consistent with Orbit Worker's model. Until then, this file stays 🔴.