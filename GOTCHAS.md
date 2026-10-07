# 40Labs Development Gotchas & Rules

1. **Rust commands never accept actor/workspace/branch from the payload. Every command is listed in COMMAND_POLICY.**
2. **Audit rows are audit-first inside the same transaction as the mutation (GOTCHAS #9); performed_by = ctx.user_id, never payload.**
