# Lab 10 – User Acceptance Test Plan

## Overview
This plan describes the user acceptance tests that will be executed during project week four to confirm that WalletWatch meets stakeholder expectations. Each test outlines the data that will be used, the environment in which the test will be executed, the expected outcome, and the profile of the tester responsible for validating the behavior.

## Feature 1 – Account Registration
| Scenario | Description | Test Data | Environment | Expected Result | Tester Profile |
| --- | --- | --- | --- | --- | --- |
| Successful sign-up | New visitor registers for WalletWatch to gain access to the dashboard. | Name: Casey Green; Email: casey.green+uat@walletwatch.app; Password: `Secure!Pass123` | Docker Compose stack (Node.js API + PostgreSQL) running on localhost | API returns 201 with success message and JSON payload containing generated user id; confirmation email logged for delivery; dashboard redirect occurs. | First-time budgeter with moderate technical experience. |
| Duplicate account guardrail | Repeat visitor attempts to sign up with an existing email. | Email reused from previous scenario; password arbitrary. | Docker Compose stack on localhost | API returns 400 with message `User already exists` and form displays inline error without creating a duplicate record. | Customer support representative verifying data integrity. |

## Feature 2 – Spending Entry & Budget Tracking
| Scenario | Description | Test Data | Environment | Expected Result | Tester Profile |
| --- | --- | --- | --- | --- | --- |
| Log new expense | Authenticated user records a grocery purchase and reviews updated monthly summary. | User: pre-seeded demo account; Expense: Category "Groceries", Amount `$82.45`, Notes "Weekly produce". | Logged-in session via web UI against Docker Compose backend. | Entry appears in recent activity list, monthly grocery total increases by `$82.45`, and remaining budget indicator recalculates without errors. | Household budgeter focused on day-to-day expense tracking. |
| Edit existing expense | User adjusts a previously logged transaction to correct the amount. | Update same record to `$80.00`. | Web UI on localhost Docker stack. | Updated value persists in database, UI refreshes to show `$80.00`, and budget summary reflects the corrected total. | Returning user comfortable editing transactions. |

## Feature 3 – Logout & Session Cleanup
| Scenario | Description | Test Data | Environment | Expected Result | Tester Profile |
| --- | --- | --- | --- | --- | --- |
| Successful logout | Authenticated user chooses to sign out from the application header. | User: pre-seeded demo account already logged in. | Web UI on localhost Docker stack. | API returns 200, auth token is invalidated, and user is redirected to login screen with confirmation banner. | Frequent user ensuring quick transitions between shared devices. |
| Session token cleared | After logout, user refreshes dashboard link to confirm session removal. | Browser with cached dashboard URL. | Web browser on localhost Docker stack. | Refresh prompts login screen without restoring dashboard access; local storage/session cookies no longer contain auth token. | QA analyst validating security hygiene. |

## Execution Notes
- All tests will be executed on team laptops using the shared Docker Compose configuration supplied with Lab 10.
- Observed results, screenshots, and follow-up actions will be logged in the project journal to inform the final project report.
