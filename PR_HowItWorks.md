# Add Unit Tests for HowItWorks

## Description
This PR introduces comprehensive unit tests for the `HowItWorks` component located in `components/payment/HowItWorks.tsx`. The tests ensure the component renders correctly and covers all critical rendering paths.

## Changes Included
- Added test file `components/payment/__tests__/HowItWorks.test.tsx`.
- Tested the main section title rendering.
- Tested the mapping and rendering of all three hard-coded steps (deposit funds, seller delivers, funds released) with their correct titles and descriptions.
- Tested the correct heading hierarchy (one `h2` and three `h3` tags).

## Acceptance Criteria
- [x] Test file covers critical rendering paths.
- [x] Tests pass locally (verified rendering logic) and in CI.
- [x] No React state update warnings outside `act()`.

## Related Issues
Closes #854
