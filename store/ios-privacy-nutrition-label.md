# iOS Privacy Nutrition Label

Reference document for completing the App Privacy section in App Store Connect.
Fill in these answers under **App Store Connect > App Privacy** for `com.raiseher.app`.

---

## Does this app collect data?

**Yes**

---

## Data Types and Purposes

### Contact Info
| Field | Value |
|---|---|
| Data type | Email address |
| Linked to identity | Yes |
| Used for tracking | No |
| Purposes | App Functionality (authentication) |

### Financial Info
| Field | Value |
|---|---|
| Data type | Other financial info (user-entered salary data) |
| Linked to identity | Yes |
| Used for tracking | No |
| Purposes | App Functionality (pay gap analysis) |

### User Content
| Field | Value |
|---|---|
| Data type | Other user content (wins/accomplishments text entered by user) |
| Linked to identity | Yes |
| Used for tracking | No |
| Purposes | App Functionality |

### Audio Data (Microphone)
| Field | Value |
|---|---|
| Data type | Audio data (microphone input during rehearsal sessions) |
| Linked to identity | No (processed during session, not stored persistently) |
| Used for tracking | No |
| Purposes | App Functionality (salary negotiation rehearsal) |

### Usage Data
| Field | Value |
|---|---|
| Data type | Other usage data (in-app actions, session counts) |
| Linked to identity | Yes |
| Used for tracking | No |
| Purposes | App Functionality, Analytics |

---

## Data Not Collected

The following data types are **not** collected by RaiseHER:
- Location
- Health & Fitness
- Purchases (subscription status is managed by RevenueCat; individual purchase history is not stored in our backend)
- Browsing history
- Search history
- Sensitive info (race, religion, biometrics, etc.)
- Contacts
- Photos or videos

---

## Tracking

RaiseHER does **not** track users across apps or websites owned by other companies for advertising purposes.

**NSUserTrackingUsageDescription**: Not required — no tracking.

---

## Privacy Policy URL

`https://raiseher.app/privacy`

> **Team action**: Publish this URL before submitting for TestFlight external review. The privacy policy must be live and accessible.

---

## Steps to complete in App Store Connect

1. Sign in to App Store Connect
2. Select your app > **App Privacy**
3. Click **Edit** and answer each question using the tables above
4. Confirm "No" for tracking
5. Save and submit alongside the TestFlight build
