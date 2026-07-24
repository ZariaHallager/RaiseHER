# Google Play Data Safety Form

Reference document for completing the Data Safety section in Google Play Console.
Fill in these answers when configuring the Data Safety form for `com.raiseher.app`.

---

## Does your app collect or share any of the required user data types?

**Yes** — RaiseHER collects the data types listed below.

---

## Data Collected

### Account Info
| Question | Answer |
|---|---|
| Data type | Email address |
| Collection | Yes |
| Shared with third parties | No |
| Required or optional | Required (for account creation) |
| Purpose | App functionality (authentication via Clerk) |
| Encrypted in transit | Yes |
| Can user request deletion | Yes (via Settings > Delete Account) |

### Personal Info
| Question | Answer |
|---|---|
| Data type | Name (optional display name) |
| Collection | Yes (optional) |
| Shared with third parties | No |
| Required or optional | Optional |
| Purpose | App functionality |
| Encrypted in transit | Yes |
| Can user request deletion | Yes |

### Financial Info
| Question | Answer |
|---|---|
| Data type | Salary / compensation data entered by user |
| Collection | Yes |
| Shared with third parties | No |
| Required or optional | Required for pay gap analysis |
| Purpose | App functionality |
| Encrypted in transit | Yes |
| Can user request deletion | Yes |

### App activity
| Question | Answer |
|---|---|
| Data type | In-app actions (wins logged, rehearsal sessions) |
| Collection | Yes |
| Shared with third parties | No |
| Required or optional | Required |
| Purpose | App functionality, analytics |
| Encrypted in transit | Yes |
| Can user request deletion | Yes |

### Audio (Microphone)
| Question | Answer |
|---|---|
| Data type | Voice recordings from rehearsal sessions |
| Collection | Processed on-device / via AI only during session; not persistently stored |
| Shared with third parties | No (audio is not transmitted to third parties) |
| Required or optional | Optional (only when user starts a rehearsal session) |
| Purpose | App functionality (salary negotiation rehearsal) |
| Encrypted in transit | Yes (if transmitted) |
| Can user request deletion | Not applicable (not stored persistently) |

---

## Data Sharing

RaiseHER does **not** share user data with third parties for advertising or analytics purposes.

Third-party services used internally:
- **Clerk** (authentication) — receives email address. Governed by Clerk's privacy policy.
- **Convex** (backend/database) — stores all app data. Data is encrypted at rest and in transit.
- **Google Gemini API** (AI analysis) — receives anonymized salary/role inputs to generate analysis. No personally identifiable information (name, email) is sent to Gemini. Governed by Google's AI usage policies.
- **RevenueCat** (subscription management) — receives subscription status. No personal financial data beyond subscription tier.

---

## Security Practices

- All data is encrypted in transit using TLS.
- User data is stored in Convex with encryption at rest.
- Users can request account deletion, which removes all stored data within 30 days.

---

## Age Rating

The app does not target children. Minimum age: **17+** based on financial content context, or **4+** if Apple / Google rates it lower — the advisory questionnaire answers produce a **4+** rating with no content overrides.

> **Team action**: Confirm target age rating with legal before submission. Financial/career content may warrant selecting 4+ and relying on context, or opting for 17+ to be conservative.

---

## Steps to complete in Google Play Console

1. Go to **Policy > App content > Data safety**
2. Fill in each section using the table above
3. Review and confirm the form matches this document before submission
4. Submit for review alongside the Internal Testing build
