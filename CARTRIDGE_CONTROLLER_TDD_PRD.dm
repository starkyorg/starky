# Cartridge Controller Integration PRD (TDD)

Version: v0.1  
Date: March 3, 2026  
Owner: Starky Engineering

## 1. Background

Starky verifies Starknet wallet ownership for Discord members through a web verification flow and backend signature checks.

Current flow is built around:
- `starknetkit.connect()` in [pages/verify/[discordServerId]/[discordMemberId]/[customLink].tsx](/Users/os/conductor/workspaces/starky/khartoum-v1/pages/verify/[discordServerId]/[discordMemberId]/[customLink].tsx)
- Starknet wallet context in [utils/ethereum/context/WalletConnect.tsx](/Users/os/conductor/workspaces/starky/khartoum-v1/utils/ethereum/context/WalletConnect.tsx)
- Signature validation in [utils/starknet/verifySignature.ts](/Users/os/conductor/workspaces/starky/khartoum-v1/utils/starknet/verifySignature.ts)

Goal is to add Cartridge Controller compatibility with low risk, zero backend contract changes, and a strict TDD process.

## 2. Problem Statement

Users may want to connect and verify with Cartridge Controller, but Starky currently has no explicit Cartridge integration path and includes wallet-specific assumptions in the frontend verification flow.

## 3. Goals

1. Add Cartridge as a supported Starknet wallet for verification.
2. Preserve existing `/api/verify` request/response behavior.
3. Keep network guardrails (mainnet/sepolia) working consistently.
4. Roll out behind a feature flag for controlled adoption.
5. Implement changes using strict Red-Green-Refactor.

## 4. Non-Goals

1. No full wallet stack rewrite in phase 1.
2. No database schema changes.
3. No token-gating rule changes.
4. No broad Ethereum connection redesign.
5. No session-policy transaction automation in v1.

## 5. Users and Use Cases

1. Discord member connects Cartridge wallet and verifies Starknet identity.
2. Member sees clear guidance for wrong network and can retry.
3. Admin expects no regression in role-verification reliability.

## 6. Scope

### In Scope

1. Cartridge wallet adapter and connect/sign/disconnect integration for verification flow.
2. Wallet-agnostic network validation helper.
3. Feature flag gating for Cartridge enablement.
4. Error mapping for user-facing verification failures.
5. Automated tests covering adapter behavior and verification orchestration.

### Out of Scope

1. Removing existing non-Cartridge Starknet wallet path.
2. Rewriting module-level wallet detector semantics.
3. Replacing existing API routes.

## 7. Functional Requirements

1. App must offer Cartridge wallet path when feature flag is on.
2. App must collect `address`, `chainId`, and allow `signMessage` through adapter interface.
3. App must block verification signing when network mismatch is detected.
4. App must submit existing verification payload shape to `/api/verify`.
5. App must allow disconnect and return UI to unconnected state.
6. App must surface actionable error states for auth/connect/sign failures.
7. App must keep legacy wallet path functional when Cartridge flag is off.

## 8. Non-Functional Requirements

1. No regression in successful verification conversion after rollout.
2. No fatal frontend crash introduced in verify route.
3. Deterministic network validation behavior across wallets.
4. Observable logs for connect/sign/verify failure classes.

## 9. Technical Design (Phase 1)

1. Introduce wallet adapter contract:
   - `connect(): Promise<{ address: string; chainId: string; account: any }>`
   - `disconnect(): Promise<void>`
   - `signMessage(message): Promise<Signature>`
2. Implement `CartridgeAdapter` behind feature flag.
3. Keep existing adapter path as fallback/default.
4. Extract pure network helper:
   - `isExpectedStarknetNetwork(chainId, expectedNetwork, aliases)`
5. Refactor verify-page orchestration to use adapter + helper.
6. Keep backend signature verification logic unchanged.

## 10. Feature Flag and Rollout

1. Add `ENABLE_CARTRIDGE_CONTROLLER` env/config flag.
2. Default `false`.
3. Internal QA on Sepolia first.
4. Canary release to limited traffic.
5. Full release after 7-day error budget pass.

## 11. Metrics and SLIs

1. `wallet_connect_success_rate` (Cartridge).
2. `signature_submit_success_rate` (Cartridge).
3. `wrong_network_recovery_rate`.
4. `verify_flow_dropoff_rate`.
5. Error counts by type:
   - connect failed
   - sign failed
   - verify API failed

## 12. Risks and Mitigations

1. Dependency/version compatibility with current Starknet stack.
   - Mitigation: isolate adapter, avoid broad upgrades in phase 1.
2. Wallet-specific network-switch behavior differences.
   - Mitigation: rely on generic mismatch UX, remove brand-specific logic.
3. Browser storage/cookie restrictions for auth mode.
   - Mitigation: explicit error mapping, fallback instructions, browser QA.
4. Regressions in existing flow.
   - Mitigation: feature flag + test coverage + canary rollout.

## 13. Milestones

1. [x] M0: Compatibility spike and adapter API proof.
2. [x] M1: Test-first adapter and network utility implementation.
3. [x] M2: Verify-page integration and UX hardening.
4. [ ] M3: Canary and rollout validation.

## 14. TDD Execution Plan

## 14.1 TDD Rules (Mandatory)

1. No production code before a failing test exists.
2. For each test:
   - RED: write failing test
   - GREEN: minimal code to pass
   - REFACTOR: cleanup with tests still green
3. No batching multiple behaviors into one test.
4. No "test-after" commits.

## 14.2 Test Inventory

1. [x] `tests/wallet/networkResolution.test.ts`
2. [x] `tests/wallet/walletAdapterContract.test.ts`
3. [x] `tests/wallet/cartridgeAdapter.test.ts`
4. [x] `tests/verification/verifyFlowOrchestrator.test.ts`
5. [x] `tests/starknet/verifySignature.test.ts` (expanded)

## 14.3 Red-Green-Refactor Stories

### Story A: Wallet Adapter Contract

RED tests:
1. [x] Adapter returns normalized address + chainId.
2. [x] Adapter throws typed error when wallet unavailable.
3. [x] Adapter `disconnect()` clears connection state.

GREEN:
1. [x] Minimal adapter interface.
2. [x] Minimal Cartridge adapter implementation satisfying tests.

REFACTOR:
1. [x] Consolidate shared error normalization.

### Story B: Network Validation

RED tests:
1. [x] Known alias chain IDs resolve to expected network.
2. [x] Unknown chain IDs fail validation.
3. [x] Validation is wallet-brand agnostic.

GREEN:
1. [x] Add pure `isExpectedStarknetNetwork` utility.

REFACTOR:
1. [x] Remove duplicate network-check code from page component.

### Story C: Verification Orchestrator

RED tests:
1. [x] Connect success + valid network triggers signing and API call.
2. [x] Wrong network blocks signing and surfaces mismatch state.
3. [x] Adapter failure maps to user-facing error state.

GREEN:
1. [x] Add minimal orchestration layer callable by verify page.

REFACTOR:
1. [x] Isolate side effects and simplify component state transitions.

### Story D: Backend Signature Safety Regression

RED tests on existing util:
1. [x] Primary entrypoint `isValidSignature` success.
2. [x] Fallback `is_valid_signature` success.
3. [x] Empty result returns explicit invalid signature error.
4. [x] Contract call errors return deterministic failure object.

GREEN:
1. [x] Minimal util fixes only if required to satisfy tests. (No production changes required)

REFACTOR:
1. [ ] Extract response parser helper.

### Story E: Feature Flag Gate

RED tests:
1. [x] Flag off: no Cartridge path used.
2. [x] Flag on: Cartridge path available.

GREEN:
1. [x] Add minimal flag lookup and conditional adapter selection.

REFACTOR:
1. [x] Centralize runtime config reads.

## 14.4 Test Commands

1. [x] `npm test tests/wallet/networkResolution.test.ts`
2. [x] `npm test tests/wallet/walletAdapterContract.test.ts`
3. [x] `npm test tests/wallet/cartridgeAdapter.test.ts`
4. [x] `npm test tests/verification/verifyFlowOrchestrator.test.ts`
5. [x] `npm test tests/starknet/verifySignature.test.ts`
6. [x] `npm test` (full suite before merge)

## 14.5 Definition of Done

1. [x] Every new behavior has a test that failed first.
2. [x] All new and existing tests pass.
3. [x] Cartridge verification flow works on supported networks.
4. [x] Flag-based rollback is immediate and reliable.
5. [ ] No unresolved P0/P1 issues in canary period.

## 15. Open Decisions

1. Keep dual-wallet support long-term or migrate to Cartridge-first.
2. Select initial auth mode preference for Cartridge integration.
3. Decide if broader Starknet dependency upgrade is phase 2.

## 16. Appendix: Existing Reference Points

1. Verify route UI orchestration:
   - [pages/verify/[discordServerId]/[discordMemberId]/[customLink].tsx](/Users/os/conductor/workspaces/starky/khartoum-v1/pages/verify/[discordServerId]/[discordMemberId]/[customLink].tsx)
2. Wallet context:
   - [utils/ethereum/context/WalletConnect.tsx](/Users/os/conductor/workspaces/starky/khartoum-v1/utils/ethereum/context/WalletConnect.tsx)
3. Signature verification:
   - [utils/starknet/verifySignature.ts](/Users/os/conductor/workspaces/starky/khartoum-v1/utils/starknet/verifySignature.ts)
4. Current tests:
   - [tests/networkConfig.test.ts](/Users/os/conductor/workspaces/starky/khartoum-v1/tests/networkConfig.test.ts)
