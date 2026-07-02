# API ADR 009: Transactional Email

## Status

Accepted

## Context

The system sends emails for: magic link, password reset OTP, barbershop admin invitation, and appointment notifications.

## Decision

### Provider
- **Resend** for MVP (transactional email API)
- Dedicated `email.ts` service module wrapping Resend SDK

### Email Types
| Type | Trigger | To |
|------|---------|----|
| Magic Link | Customer requests login | Customer |
| Password Reset OTP | User requests reset | User |
| Invitation | Super Admin creates barbershop | Barbershop Admin |
| Appointment Confirmation | Booking created | Customer |
| Appointment Cancellation | Booking cancelled | Customer |

### Implementation
- All email content sent as HTML templates
- Templates stored in `src/modules/templates/`
- Async, non-blocking (fire and forget for non-critical emails)
- Magic link and OTP are time-sensitive — logged if send fails

## Consequences
- Resend free tier (100 emails/day) sufficient for MVP
- Template rendering adds minimal complexity
- Failed email sends must be logged for debugging
