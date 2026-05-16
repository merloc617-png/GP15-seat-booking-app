
[![codecov](https://codecov.io/github/merloc617-png/GP15-seat-booking-app/graph/badge.svg?token=LUIBL2HSMW)](https://codecov.io/github/merloc617-png/GP15-seat-booking-app)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel-000?logo=vercel)](https://seat-booking-gp-15.vercel.app/)
[![Lighthouse Accessibility](https://img.shields.io/badge/Lighthouse-Accessibility%20100-brightgreen?logo=lighthouse)](https://developer.chrome.com/docs/lighthouse/accessibility/scoring)

# Seat Booking App — CPT304 Coursework

**Module**: CPT304 Software Engineering II 25-26  
**Group**: 15  
**Live Deployment**: [seat-booking-gp-15.vercel.app](https://seat-booking-gp-15.vercel.app/)  
**Repository**: [github.com/merloc617-png/GP15-seat-booking-app](https://github.com/merloc617-png/GP15-seat-booking-app)

---

## About This Project

**T**his repository contains the enhanced version of a vanilla JavaScript seat-reservation prototype, refactored for the CPT304 **Research-Led Software Enhancement** coursework.  
**T**he original codebase was audited for deficiencies, researched against software-engineering literature, and elevated to production-ready standards including accessibility, internationalization, privacy compliance, and automated testing.

---

## Research-Led Deficiencies Fixed

1. **UX/UI Feedback**
2. **Privacy & Compliance**
3. **Auditability**
4. **Validation & Error Handling**

---

## Baseline Standards Evidence

| Standard | Evidence | Status |
|----------|----------|--------|
| **Live Uptime** | Deployed on Vercel since May 2026 | ✅ |
| **Test Coverage ≥ 80%** | Codecov badge above | ✅ |
| **Accessibility 90+** | Lighthouse Accessibility score: **100** | ✅ |
| **i18n (2 languages)** | English / Chinese toggle implemented | ✅ |
| **Legal Compliance** | Functional cookie banner + dedicated privacy policy page | ✅ |

---

## Tech Stack

- **Core**: Vanilla JavaScript (ES6+ modules)
- **Build Tool**: Vite
- **Testing**: Vitest with jsdom
- **Styling**: Modern CSS with custom properties for theming
- **Storage**: Browser LocalStorage API (consent-gated)
- **Internationalization**: Custom i18n implementation

---

## Project Structure

```
src/
├── audit/          # Audit logging functionality
├── core/           # Core business logic (SeatBookingApp, Service, Sector)
├── i18n/           # Internationalization support
├── storage/        # LocalStorage adapter with consent checks
├── styles/         # CSS styling
├── ui/             # UI components and renderers
├── validation/     # Input validation utilities
├── main.js         # Application entry point
└── privacy.js      # Privacy compliance module
```

---

## Installation & Setup

### Prerequisites

- Node.js (v20 or higher)
- npm

### Getting Started

```bash
git clone https://github.com/merloc617-png/GP15-seat-booking-app.git
cd GP15-seat-booking-app

npm install

npm run dev
```

---

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run coverage

# Watch mode
npm run test:watch
```

Coverage reports are uploaded to [Codecov](https://codecov.io/github/merloc617-png/GP15-seat-booking-app).

---

## License

This project is a fork of the [sptin2002/seat-booking-app](https://github.com/sptin2002/seat-booking-app).   
No additional license is applied beyond the original repository terms.