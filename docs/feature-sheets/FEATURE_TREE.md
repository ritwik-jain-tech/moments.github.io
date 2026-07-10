# Moments Studio — Feature Tree

> Obsidian-style expandable tree. Fold headings (hover gutter) or fold nested list items.
> `- [ ]` = not done, `- [x]` = done. Mirrors the 3 CSV sheets (Photographers / Couples / Guests).
> Personas linked: [[#Photographers]] · [[#Couples]] · [[#Guests]]

---

## Photographers
*Studio B2B tool — workflow: Collect → Select → Deliver → Manage.*

- [ ] **Auth & Login**
    - [ ] Login
        - [ ] Email + password
        - [ ] Google OAuth (SSO)
        - [ ] Apple sign-in
        - [ ] Magic link (passwordless)
    - [ ] Signup
        - [ ] Start free trial
        - [ ] Studio/agency profile setup (name, logo, branding)
    - [ ] Session
        - [ ] Password reset
        - [ ] 2FA / MFA
        - [ ] Active sessions / logout all
- [ ] **Dashboard**
    - [ ] Studio KPIs (events, storage, pending deliveries, tagging status)
    - [ ] Recent activity feed
    - [ ] Quick actions (create event / upload / invite client)
- [ ] **Collect** — *camera-to-cloud ingest*
    - [ ] Camera-to-cloud
        - [ ] SFTP auto-upload
        - [ ] SFTP credentials management (per event)
    - [ ] Ingest
        - [ ] Chronological sync into buckets
        - [ ] Drag-and-drop web upload
        - [ ] RAW / CR3 support + preview
        - [ ] Upload progress & resume
    - [ ] Auto-sort
        - [ ] AI event bucketing
- [ ] **Select** — *AI-assisted culling*
    - [ ] AI face tagging
        - [ ] Auto face detection & clustering
        - [ ] Per-person cluster gallery
    - [ ] AI event tagging
        - [ ] Scene/emotion tags (haldi, dance, candid, traditional)
    - [ ] Culling
        - [ ] Rating & pick/reject flags
        - [ ] Duplicate / burst grouping
        - [ ] Blur / eyes-closed detection
    - [ ] Filters
        - [ ] Combined filter (person + tag + rating)
- [ ] **Deliver** — *client review + album*
    - [ ] Client galleries
        - [ ] Create branded gallery
        - [ ] Shareable review link / QR
        - [ ] Access control / expiry / password
    - [ ] Feedback loop
        - [ ] Client shortlist review
        - [ ] Per-photo comments & approvals
    - [ ] Digital album
        - [ ] Branded digital album builder
    - [ ] Delivery
        - [ ] Final high-res download controls (limits/watermark)
    - [ ] Guest value-add
        - [ ] Enable guest face-find & POV upload
- [ ] **Manage** — *team, storage, business*
    - [ ] Team
        - [ ] Invite freelancers/editors
        - [ ] Roles & permissions (admin/editor/viewer)
        - [ ] Task assignment & tracking
    - [ ] Storage
        - [ ] Usage & tiers
        - [ ] Archive / cold storage
    - [ ] Events & clients
        - [ ] Event CRUD
        - [ ] Client CRM
    - [ ] Business
        - [ ] Subscription & invoices
        - [ ] Custom branding (logo/domain/colors)
        - [ ] Email/push notifications

---

## Couples
*Client review experience — mostly link-token access, optional account.*

- [ ] **Auth & Login**
    - [ ] Access
        - [ ] Magic link / no-account entry
        - [ ] Password/PIN gated link
        - [ ] Optional account claim (persist album + notifications)
    - [ ] Login
        - [ ] Google / Apple / email
- [ ] **Gallery**
    - [ ] Browse
        - [ ] Full event gallery
        - [ ] Filter by person (face-find)
        - [ ] Filter by moment/scene tag
        - [ ] Lightbox full-screen + swipe
        - [ ] Favorites / heart
- [ ] **Review**
    - [ ] Shortlisting
        - [ ] Build album shortlist
        - [ ] Shortlist counter / target
        - [ ] Submit shortlist to photographer
    - [ ] Feedback
        - [ ] Per-photo comments
        - [ ] Approve / request changes
- [ ] **Album**
    - [ ] Digital album
        - [ ] View branded digital album
        - [ ] Permanent access (lasts forever)
    - [ ] Downloads
        - [ ] Download high-res
        - [ ] Download all / zip
- [ ] **Share**
    - [ ] Share album link with family
    - [ ] Social share cards
- [ ] **Guest POV**
    - [ ] See guest-uploaded POV photos
- [ ] **Notifications**
    - [ ] Delivery & update alerts

---

## Guests
*Consumer event app — find-my-photos via face recognition + POV upload.*

- [ ] **Auth & Login**
    - [ ] Entry
        - [ ] Join event via QR / link
        - [ ] No-account browse
    - [ ] Login
        - [ ] Phone OTP
        - [ ] Google / Apple
        - [ ] Selfie-only identify (no account)
- [ ] **Find My Photos**
    - [ ] Face recognition
        - [ ] Selfie face-match
        - [ ] My photos gallery
        - [ ] Re-scan / improve match
    - [ ] Privacy
        - [ ] Opt out of face matching
- [ ] **Browse**
    - [ ] Full event gallery
    - [ ] Filter by moment/scene
    - [ ] Lightbox view
- [ ] **Upload POV**
    - [ ] Upload my photos
    - [ ] In-app camera capture
    - [ ] Upload moderation status
- [ ] **Download**
    - [ ] Download photos of me
    - [ ] Download selected (multi-select)
- [ ] **Share**
    - [ ] Share to social (Instagram/WhatsApp)
    - [ ] Personal share link
- [ ] **Notifications**
    - [ ] New-photos-of-me alert

---

## Legend
- **Priority:** P0 = MVP/critical · P1 = important · P2 = nice-to-have · P3 = later
- **Login/Access:** *Public* (pre-auth) · *Authenticated* · *Link token* (shareable, no account) · *Selfie* (biometric identify)
- **Done:** check the box when shipped; keep in sync with the `Done` column in the CSV sheets.
