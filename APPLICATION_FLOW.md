# DoggyWalk - Application Flow Diagram

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DoggyWalk Platform                           │
│                     Pet Services Marketplace                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 👤 User Roles & Authentication Flow

```
                    ┌──────────────┐
                    │  Landing Page │
                    │   (Home)      │
                    └───────┬───────┘
                            │
                    ┌───────▼────────┐
                    │  Auth System   │
                    └───────┬────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
    ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼───────┐
    │   Register   │ │   Login   │ │Forgot Password│
    └───────┬──────┘ └─────┬─────┘ └──────┬───────┘
            │               │               │
            └───────────────┼───────────────┘
                            │
                    ┌───────▼────────┐
                    │ Select Account │
                    │     Type       │
                    └───────┬────────┘
                            │
            ┌───────────────┴────────────────┐
            │                                │
    ┌───────▼────────┐            ┌─────────▼────────┐
    │  Pet Owner     │            │  Service Provider │
    │  Dashboard     │            │    Dashboard      │
    └────────────────┘            └──────────────────┘
```

---

## 🐕 Pet Owner Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PET OWNER JOURNEY                             │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   Dashboard  │
    └──────┬───────┘
           │
    ┌──────▼───────┐
    │ Quick Actions│
    └──────┬───────┘
           │
    ┌──────┴──────────────────────────────────────┐
    │                                              │
    │  ┌────────────────────────────────────┐    │
    │  │  1. MANAGE PETS                    │    │
    │  └────────────────────────────────────┘    │
    │       │                                     │
    │       ├──► View All Pets (/pets)           │
    │       ├──► Add New Pet (/pets/new)         │
    │       ├──► Edit Pet (/pets/:id/edit)       │
    │       └──► Pet Profile (photos, details)   │
    │                                              │
    │  ┌────────────────────────────────────┐    │
    │  │  2. SEARCH & BOOK SERVICES         │    │
    │  └────────────────────────────────────┘    │
    │       │                                     │
    │       ├──► Search by Location (/search)    │
    │       │    ├─ Filter by service type       │
    │       │    ├─ Filter by rating             │
    │       │    ├─ See on map                   │
    │       │    └─ Calculate distance           │
    │       │                                     │
    │       ├──► Provider Profile                │
    │       │    ├─ View services & prices       │
    │       │    ├─ See photos & reviews         │
    │       │    ├─ Check availability           │
    │       │    └─ View operating hours         │
    │       │                                     │
    │       ├──► Create Booking (/provider/:id/book)│
    │       │    ├─ Select pet(s) - Multi-pet   │
    │       │    ├─ Choose date & time           │
    │       │    ├─ Set duration                 │
    │       │    ├─ Enter pickup address         │
    │       │    ├─ Add special instructions     │
    │       │    │                                │
    │       │    └─ 🆕 RECURRING OPTIONS         │
    │       │         ├─ Enable recurring        │
    │       │         ├─ Set frequency           │
    │       │         │  ├─ Daily                │
    │       │         │  ├─ Weekly (select days) │
    │       │         │  └─ Monthly              │
    │       │         └─ Set end condition       │
    │       │            ├─ End date             │
    │       │            └─ Max occurrences      │
    │       │                                     │
    │       └──► Payment calculation             │
    │            ├─ Base rate × duration         │
    │            └─ Multi-pet: +50% per extra    │
    │                                              │
    │  ┌────────────────────────────────────┐    │
    │  │  3. MANAGE BOOKINGS                │    │
    │  └────────────────────────────────────┘    │
    │       │                                     │
    │       ├──► View All Bookings (/bookings)   │
    │       │    ├─ Filter: All/Pending/Active/  │
    │       │    │         Completed/Cancelled    │
    │       │    ├─ See booking details          │
    │       │    └─ Multi-pet indicator          │
    │       │                                     │
    │       ├──► 🆕 Recurring Series              │
    │       │    (/recurring-bookings)           │
    │       │    ├─ View all active series       │
    │       │    ├─ See upcoming bookings        │
    │       │    ├─ Check statistics             │
    │       │    └─ Cancel entire series         │
    │       │                                     │
    │       ├──► Live Tracking (/live-tracking/:id)│
    │       │    ├─ Real-time GPS location       │
    │       │    ├─ Route visualization          │
    │       │    ├─ Distance traveled            │
    │       │    ├─ Duration counter             │
    │       │    └─ Provider location            │
    │       │                                     │
    │       ├──► Cancel Booking                  │
    │       │    ├─ Smart refund calculation     │
    │       │    │  ├─ >24h: 100% refund        │
    │       │    │  ├─ 6-24h: 50% refund        │
    │       │    │  └─ <6h: No refund           │
    │       │    └─ Cancellation reason          │
    │       │                                     │
    │       └──► Rate & Review (/rate/:id)       │
    │            ├─ Star rating (1-5)            │
    │            ├─ Written review               │
    │            └─ Updates provider rating      │
    │                                              │
    │  ┌────────────────────────────────────┐    │
    │  │  4. COMMUNICATION                  │    │
    │  └────────────────────────────────────┘    │
    │       │                                     │
    │       ├──► Chat with Provider (/chat/:id)  │
    │       │    ├─ Real-time messaging          │
    │       │    ├─ Photo sharing                │
    │       │    └─ Booking context              │
    │       │                                     │
    │       ├──► Notifications                   │
    │       │    ├─ Booking accepted/declined    │
    │       │    ├─ Service started/completed    │
    │       │    ├─ Chat messages                │
    │       │    └─ 🆕 Recurring series updates  │
    │       │                                     │
    │       └──► Support (/support)              │
    │            ├─ FAQ section                  │
    │            └─ Contact form                 │
    │                                              │
    │  ┌────────────────────────────────────┐    │
    │  │  5. ACCOUNT MANAGEMENT             │    │
    │  └────────────────────────────────────┘    │
    │       │                                     │
    │       └──► Settings (/settings)            │
    │            ├─ Profile information          │
    │            ├─ 🌍 Language (EN/ES/FR/PT/ZH)│
    │            ├─ Notification preferences     │
    │            ├─ Become a provider option     │
    │            └─ Account deletion             │
    │                                              │
    └──────────────────────────────────────────────┘
```

---

## 💼 Service Provider Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVICE PROVIDER JOURNEY                          │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │Provider Dashboard│
    └────────┬─────────┘
             │
    ┌────────▼─────────┐
    │  Provider Actions│
    └────────┬─────────┘
             │
    ┌────────┴──────────────────────────────────────┐
    │                                                │
    │  ┌──────────────────────────────────────┐    │
    │  │  1. ONBOARDING PROCESS               │    │
    │  └──────────────────────────────────────┘    │
    │       │                                       │
    │       ├──► Provider Onboarding               │
    │       │    (/provider-onboarding)            │
    │       │    ├─ Select service types           │
    │       │    │  ├─ Dog Walker                  │
    │       │    │  ├─ Pet Sitter                  │
    │       │    │  ├─ Groomer                     │
    │       │    │  ├─ Veterinarian                │
    │       │    │  ├─ Trainer                     │
    │       │    │  ├─ Daycare                     │
    │       │    │  └─ Pet Hotel                   │
    │       │    │                                  │
    │       │    ├─ Set location & service area    │
    │       │    ├─ Set hourly rate                │
    │       │    ├─ Add bio & experience           │
    │       │    └─ Upload photos                  │
    │       │                                       │
    │       └──► Identity Verification             │
    │            (/identity-verification)          │
    │            ├─ ID upload (front/back)         │
    │            ├─ Selfie verification            │
    │            ├─ Admin approval required        │
    │            └─ Status tracking                │
    │                                                │
    │  ┌──────────────────────────────────────┐    │
    │  │  2. SERVICE MANAGEMENT               │    │
    │  └──────────────────────────────────────┘    │
    │       │                                       │
    │       ├──► Manage Services (/manage-services)│
    │       │    ├─ Add/Edit/Delete services       │
    │       │    ├─ Set service-specific prices    │
    │       │    ├─ Service descriptions           │
    │       │    └─ Enable/Disable services        │
    │       │                                       │
    │       ├──► Manage Offerings                  │
    │       │    (/manage-offerings)               │
    │       │    ├─ Operating hours                │
    │       │    │  ├─ Days of week               │
    │       │    │  └─ Opening/Closing times      │
    │       │    │                                  │
    │       │    ├─ Service photos                 │
    │       │    │  ├─ Upload images              │
    │       │    │  ├─ Reorder gallery            │
    │       │    │  └─ Delete photos              │
    │       │    │                                  │
    │       │    └─ Special Offerings              │
    │       │         ├─ Vet Services              │
    │       │         │  ├─ Emergency care        │
    │       │         │  ├─ Vaccinations          │
    │       │         │  └─ Dental care           │
    │       │         │                             │
    │       │         └─ Hotel Amenities           │
    │       │             ├─ Indoor play area      │
    │       │             ├─ Outdoor space         │
    │       │             ├─ Cameras/monitoring    │
    │       │             └─ Grooming included     │
    │       │                                       │
    │       └──► Public Profile (/provider/:id)    │
    │            ├─ View as customer sees it       │
    │            ├─ Reviews & ratings              │
    │            └─ Service showcase               │
    │                                                │
    │  ┌──────────────────────────────────────┐    │
    │  │  3. BOOKING MANAGEMENT               │    │
    │  └──────────────────────────────────────┘    │
    │       │                                       │
    │       ├──► View Incoming Requests            │
    │       │    (/bookings - provider view)       │
    │       │    ├─ Pending bookings               │
    │       │    ├─ Customer details               │
    │       │    ├─ Pet information                │
    │       │    ├─ 🆕 Multi-pet bookings         │
    │       │    └─ 🆕 Recurring series indicator  │
    │       │                                       │
    │       ├──► Accept/Decline Bookings           │
    │       │    ├─ Review booking details         │
    │       │    ├─ Check calendar availability    │
    │       │    ├─ Accept → status: accepted      │
    │       │    └─ Decline → notify customer      │
    │       │                                       │
    │       ├──► Active Service Tracking           │
    │       │    (/active-walk/:id)                │
    │       │    ├─ Start service                  │
    │       │    ├─ Share real-time GPS location   │
    │       │    ├─ Take & share photos            │
    │       │    ├─ Distance/time tracking         │
    │       │    └─ Complete service               │
    │       │                                       │
    │       └──► 🆕 Recurring Bookings             │
    │            ├─ View recurring series          │
    │            ├─ Auto-accept pattern option     │
    │            └─ Manage series schedule         │
    │                                                │
    │  ┌──────────────────────────────────────┐    │
    │  │  4. COMMUNICATION & PHOTOS           │    │
    │  └──────────────────────────────────────┘    │
    │       │                                       │
    │       ├──► Chat with Customers (/chat/:id)   │
    │       │    ├─ Real-time messaging            │
    │       │    ├─ Send service updates           │
    │       │    └─ Share pet photos               │
    │       │                                       │
    │       ├──► Photo Capture & Sharing           │
    │       │    ├─ Take photos during service     │
    │       │    ├─ Upload to chat                 │
    │       │    └─ Build service portfolio        │
    │       │                                       │
    │       └──► Notifications                     │
    │            ├─ New booking requests           │
    │            ├─ Customer messages               │
    │            ├─ Booking cancellations          │
    │            └─ Review notifications            │
    │                                                │
    │  ┌──────────────────────────────────────┐    │
    │  │  5. ANALYTICS & REVIEWS              │    │
    │  └──────────────────────────────────────┘    │
    │       │                                       │
    │       └──► Provider Dashboard Stats          │
    │            ├─ Total bookings                 │
    │            ├─ Revenue tracking               │
    │            ├─ Average rating                 │
    │            ├─ Customer reviews               │
    │            └─ Service performance            │
    │                                                │
    └────────────────────────────────────────────────┘
```

---

## 👨‍💼 Admin Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN DASHBOARD                              │
└─────────────────────────────────────────────────────────────────────┘

    ┌───────────────┐
    │     Admin     │
    │   Dashboard   │
    │   (/admin)    │
    └───────┬───────┘
            │
    ┌───────▼────────────────────────────────────┐
    │                                            │
    │  Platform Management                       │
    │                                            │
    │  ├─ User Management                        │
    │  │  ├─ View all users                     │
    │  │  ├─ Suspend/Ban users                  │
    │  │  └─ Role management                    │
    │  │                                         │
    │  ├─ Provider Verification                 │
    │  │  ├─ Review pending verifications       │
    │  │  ├─ View ID documents                  │
    │  │  ├─ Approve/Reject providers           │
    │  │  └─ Verification history               │
    │  │                                         │
    │  ├─ Booking Oversight                     │
    │  │  ├─ View all bookings                  │
    │  │  ├─ Resolve disputes                   │
    │  │  ├─ Refund management                  │
    │  │  └─ 🆕 Recurring series monitoring     │
    │  │                                         │
    │  ├─ Content Moderation                    │
    │  │  ├─ Review reports                     │
    │  │  ├─ Remove inappropriate content       │
    │  │  └─ Review management                  │
    │  │                                         │
    │  ├─ Analytics & Reports                   │
    │  │  ├─ Platform statistics                │
    │  │  ├─ Revenue reports                    │
    │  │  ├─ User growth metrics                │
    │  │  └─ Service utilization                │
    │  │                                         │
    │  └─ System Settings                       │
    │     ├─ Platform configuration             │
    │     ├─ Push notification management       │
    │     └─ Emergency controls                 │
    │                                            │
    └────────────────────────────────────────────┘
```

---

## 🔄 Data Flow & System Interactions

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SYSTEM ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   Frontend   │
    │  React + TS  │
    └──────┬───────┘
           │
           ├─────────────────────────────────┐
           │                                 │
    ┌──────▼──────┐                  ┌──────▼──────┐
    │   Supabase  │                  │   Leaflet   │
    │   Client    │                  │     Maps    │
    └──────┬──────┘                  └─────────────┘
           │
    ┌──────▼────────────────────────────────────┐
    │          Supabase Backend                 │
    ├───────────────────────────────────────────┤
    │                                           │
    │  🗄️  PostgreSQL Database                 │
    │  ├─ pet_masters (users)                  │
    │  ├─ profiles (user details)              │
    │  ├─ pets                                 │
    │  ├─ bookings                             │
    │  ├─ 🆕 recurring_booking_series          │
    │  ├─ booking_pets (multi-pet)             │
    │  ├─ provider_services                    │
    │  ├─ service_photos                       │
    │  ├─ service_hours                        │
    │  ├─ reviews                              │
    │  ├─ chat_messages                        │
    │  ├─ notifications                        │
    │  ├─ identity_verifications               │
    │  ├─ live_tracking                        │
    │  ├─ walk_photos                          │
    │  └─ RLS Policies (security)              │
    │                                           │
    │  🔐  Authentication                       │
    │  ├─ Email/Password auth                  │
    │  ├─ Session management                   │
    │  ├─ Role-based access control            │
    │  └─ Protected routes                     │
    │                                           │
    │  📦  Storage                              │
    │  ├─ pet-photos/                          │
    │  ├─ service-photos/                      │
    │  ├─ walk-photos/                         │
    │  ├─ verification-documents/              │
    │  └─ chat-attachments/                    │
    │                                           │
    │  ⚡ Edge Functions                        │
    │  └─ send-push-notification               │
    │     ├─ Expo Push Notifications           │
    │     └─ Real-time alerts                  │
    │                                           │
    │  🔔  Realtime Subscriptions              │
    │  ├─ Chat messages                        │
    │  ├─ Booking status updates               │
    │  ├─ Live tracking updates                │
    │  └─ Notifications                        │
    │                                           │
    └───────────────────────────────────────────┘
```

---

## 🔄 Recurring Bookings System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                   RECURRING BOOKINGS WORKFLOW                        │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │  User Creates    │
    │ Recurring Booking│
    └────────┬─────────┘
             │
    ┌────────▼─────────────────────────────────────┐
    │  Configure Series                            │
    │  ├─ Frequency: Daily/Weekly/Monthly          │
    │  ├─ Days of week (if weekly)                 │
    │  ├─ Time of day                              │
    │  ├─ Duration                                 │
    │  ├─ End condition (date or count)            │
    │  └─ Multi-pet selection                      │
    └────────┬─────────────────────────────────────┘
             │
    ┌────────▼─────────────────────────────────────┐
    │  System Generates Occurrences                │
    │  ├─ Calculate next 10 booking dates          │
    │  ├─ Respect end date/max occurrences         │
    │  ├─ Only generate up to 3 months ahead       │
    │  └─ Apply day-of-week filters (weekly)       │
    └────────┬─────────────────────────────────────┘
             │
    ┌────────▼─────────────────────────────────────┐
    │  Create Database Records                     │
    │  ├─ recurring_booking_series (1 record)      │
    │  ├─ bookings (10 records)                    │
    │  │  └─ Each linked to series_id             │
    │  └─ booking_pets (per pet × 10)              │
    └────────┬─────────────────────────────────────┘
             │
    ┌────────▼─────────────────────────────────────┐
    │  Notify Users                                │
    │  ├─ Owner: "Series created with X bookings"  │
    │  └─ Provider: "New recurring series request" │
    └────────┬─────────────────────────────────────┘
             │
    ┌────────▼─────────────────────────────────────┐
    │  Provider Accepts/Declines Each              │
    │  ├─ Can accept all in series                 │
    │  └─ Or handle individually                   │
    └────────┬─────────────────────────────────────┘
             │
    ┌────────▼─────────────────────────────────────┐
    │  Service Execution                           │
    │  ├─ Each booking progresses normally         │
    │  ├─ Accept → In Progress → Complete          │
    │  └─ Live tracking & photos                   │
    └────────┬─────────────────────────────────────┘
             │
    ┌────────▼─────────────────────────────────────┐
    │  Auto-Generation Trigger                     │
    │  ├─ When bookings are completed/cancelled    │
    │  ├─ Check: Do we have < 10 future bookings?  │
    │  └─ YES → Generate next occurrences          │
    └────────┬─────────────────────────────────────┘
             │
    ┌────────▼─────────────────────────────────────┐
    │  Series Management                           │
    │  ├─ View all series (/recurring-bookings)    │
    │  ├─ See statistics & next booking            │
    │  ├─ Cancel entire series (future only)       │
    │  └─ Series ends when conditions met          │
    └──────────────────────────────────────────────┘

    Legend:
    ✅ Active Series → Generating bookings
    ⏸️  Paused → No new bookings generated
    ❌ Cancelled → All future bookings cancelled
    ✔️  Completed → Reached end date/max count
```

---

## 🔐 Security & Data Protection

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SECURITY ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────┘

    ┌───────────────────────────────────────┐
    │  Row Level Security (RLS) Policies    │
    ├───────────────────────────────────────┤
    │                                       │
    │  Users can only:                      │
    │  ├─ View their own data               │
    │  ├─ Edit their own records            │
    │  ├─ Delete their own content          │
    │  └─ Access related bookings           │
    │                                       │
    │  Providers can additionally:          │
    │  ├─ View booking requests             │
    │  ├─ Update booking status             │
    │  └─ Access customer chat              │
    │                                       │
    │  Admins can:                          │
    │  ├─ View all records                  │
    │  ├─ Moderate content                  │
    │  └─ Manage verifications              │
    │                                       │
    └───────────────────────────────────────┘

    ┌───────────────────────────────────────┐
    │  Authentication & Authorization       │
    ├───────────────────────────────────────┤
    │                                       │
    │  ✓ JWT-based authentication           │
    │  ✓ Protected routes                   │
    │  ✓ Role-based access (RBAC)           │
    │  ✓ Session management                 │
    │  ✓ Secure password hashing            │
    │  ✓ Password reset flow                │
    │                                       │
    └───────────────────────────────────────┘

    ┌───────────────────────────────────────┐
    │  Data Privacy                         │
    ├───────────────────────────────────────┤
    │                                       │
    │  ✓ User data isolation                │
    │  ✓ Encrypted connections (HTTPS)      │
    │  ✓ Secure file storage                │
    │  ✓ GDPR-compliant                     │
    │  ✓ Account deletion support           │
    │                                       │
    └───────────────────────────────────────┘
```

---

## 🌍 Internationalization (i18n)

```
Supported Languages:
├─ 🇺🇸 English (EN)
├─ 🇪🇸 Spanish (ES)
├─ 🇫🇷 French (FR)
├─ 🇵🇹 Portuguese (PT)
└─ 🇨🇳 Chinese (ZH)

Features:
├─ Language switcher in all pages
├─ Persistent language preference
├─ Complete UI translation
└─ Dynamic content translation
```

---

## 📱 Progressive Web App (PWA)

```
PWA Features:
├─ Installable on mobile devices
├─ Offline support (service worker)
├─ Push notifications
├─ App-like experience
└─ Fast loading with caching
```

---

## 🎯 Key Features Summary

### 🐾 Pet Management
- Multiple pets per owner
- Detailed pet profiles with photos
- Health & behavior notes

### 🔍 Smart Search
- Location-based provider search
- Interactive map view
- Distance calculations
- Service type filtering
- Rating-based sorting

### 📅 Booking System
- Single & multi-pet bookings
- 🆕 Recurring bookings (daily/weekly/monthly)
- Smart cancellation with refunds
- Real-time status updates

### 📍 Live Tracking
- Real-time GPS location sharing
- Route visualization on map
- Distance & duration tracking
- Photo sharing during service

### 💬 Communication
- Real-time chat between users
- Photo sharing in chat
- Push notifications
- System notifications

### ⭐ Reviews & Ratings
- 5-star rating system
- Written reviews
- Average rating calculation
- Provider reputation building

### 🎨 Provider Customization
- Multiple service offerings
- Custom pricing per service
- Photo galleries
- Operating hours management
- Special amenities showcase

### 🔐 Trust & Safety
- Identity verification system
- Admin approval workflow
- Document upload & review
- Provider verification badges

### 📊 Analytics
- Booking history
- Revenue tracking
- Performance metrics
- Service statistics

---

## 🚀 Technical Stack

```
Frontend:
├─ React 18
├─ TypeScript
├─ React Router v6
├─ Leaflet Maps
└─ Vite Build Tool

Backend:
├─ Supabase (BaaS)
├─ PostgreSQL Database
├─ Row Level Security
├─ Edge Functions
└─ Realtime Subscriptions

Infrastructure:
├─ Netlify Hosting
├─ Supabase Cloud
├─ CDN for assets
└─ Push notification service
```

---

## 📈 Future Enhancements Roadmap

```
Phase 1 (Current):
✅ Core booking system
✅ Multi-pet support
✅ Live tracking
✅ Recurring bookings
✅ Identity verification

Phase 2 (Next):
🔲 Payment gateway integration (Stripe)
🔲 In-app calling
🔲 Calendar synchronization
🔲 Advanced search filters
🔲 Favorite providers

Phase 3 (Future):
🔲 AI-powered matching
🔲 Dynamic pricing
🔲 Loyalty program
🔲 Gift cards
🔲 Insurance integration
```

---

This comprehensive flow diagram covers all major user journeys, system interactions, and features of the DoggyWalk platform. The architecture is scalable, secure, and user-friendly, designed to handle both simple one-time bookings and complex recurring service arrangements.
