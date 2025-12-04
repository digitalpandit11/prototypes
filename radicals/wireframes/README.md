# Self-Paced Training Management System - Wireframe Prototype

## Overview
This is a comprehensive HTML-based wireframe prototype for the **Self-Paced Training Management System** designed for Radical - a computer programming coaching center.

## Key Features

### 1. **Google Meet Integration**
- Automatic meeting link generation for all 1-to-1 sessions
- Meeting credentials sent via email and SMS to both students and mentors
- Auto-recording of all Google Meet sessions
- Recorded sessions stored on server for future access
- Students can watch recordings anytime from their dashboard

### 2. **Credit-Based System**
- Students purchase credits for booking sessions
- Flexible credit packages
- Real-time balance tracking
- Transaction history

### 3. **Multi-Role Access**
- **Students**: Book sessions, watch recordings, track progress
- **Mentors**: Manage availability, conduct sessions, view earnings
- **Admin/Super Admin**: Complete system management
- **Corporate/College**: Bulk enrollment and reporting

### 4. **Session Management**
- Easy booking with calendar interface
- Automatic scheduling and reminders
- Session history with status tracking
- Recording access and download

## Wireframe Navigation

### Getting Started
Open `index.html` in your browser to access the main navigation page.

## Portal Structure

### 📚 Student Portal (8 pages)
1. **student-login.html** - Student authentication
2. **student-dashboard.html** - Main dashboard with credits, upcoming courses
3. **student-mentors.html** - Browse and filter available mentors
4. **student-courses.html** - Browse courses and workshops
5. **student-booking.html** - Book 1-to-1 sessions with calendar integration
6. **student-checkout.html** - Payment and booking confirmation
7. **student-sessions.html** - Session history (upcoming, active, completed, cancelled)
8. **student-recordings.html** - Access recorded Google Meet sessions

### 👨‍🏫 Mentor Portal (4 pages)
1. **mentor-login.html** - Mentor authentication
2. **mentor-dashboard.html** - Mentor overview, earnings, ratings
3. **mentor-availability.html** - Set available time slots
4. **mentor-sessions.html** - Manage booked sessions and recordings

### 🔐 Admin Portal (6 pages)
1. **admin-login.html** - Super admin authentication
2. **admin-dashboard.html** - System analytics and overview
3. **admin-students.html** - Student management
4. **admin-mentors.html** - Mentor management
5. **admin-payments.html** - Billing and transactions
6. **admin-meet-settings.html** - Google Meet API configuration

### 🏢 Corporate Portal (2 pages)
1. **corporate-login.html** - Corporate client authentication
2. **corporate-dashboard.html** - Bulk enrollment and reporting

## Technical Integration Points

### APIs Required (To be provided by Radical)
1. **Calendly API** - For appointment scheduling
2. **Email API** - For email notifications
3. **WhatsApp API** - For WhatsApp notifications
4. **Google Meet API** - For video conferencing and recording

### Google Meet Integration Workflow
1. Student books a session → System creates Google Meet link
2. 30 minutes before session → Meeting link sent to student & mentor
3. During session → Automatic recording enabled
4. After session → Recording processed and stored
5. Within 24 hours → Recording available in student dashboard
6. Lifetime access to recording for student

## Key Workflows Demonstrated

### Booking Flow
1. Student browses mentors or courses
2. Selects mentor and views available slots
3. Books session with topic and duration
4. Confirms with credits or payment
5. Receives Google Meet link via email/SMS

### Session Flow
1. Both parties join via Google Meet link
2. Session auto-recorded
3. After completion, recording uploaded to server
4. Student can access from "Recorded Sessions"
5. Download or stream anytime

## Design Features

### Responsive Layout
- Clean, modern interface
- Gradient color schemes for different roles:
  - **Student**: Purple gradient (#667eea to #764ba2)
  - **Mentor**: Blue gradient (#4facfe to #00f2fe)
  - **Admin**: Pink gradient (#f093fb to #f5576c)
  - **Corporate**: Green gradient (#43e97b to #38f9d7)

### User Experience
- Intuitive navigation
- Clear call-to-actions
- Status badges for tracking
- Interactive elements (hover effects)
- Modal overlays for video playback

## Pricing Structure (From Client Doc)

### Module Breakdown
1. **Student Master, Mentor Master, Session Master**
2. **Calendly/Appointment Integration**
3. **Mentor Dashboard**

**Note**: Calendly API, Email API & WhatsApp API to be provided by Radical

## How to Present to Client

### Setup
1. Extract all files to a folder
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge)
3. Navigate through different portals

### Demo Flow Suggestion
1. Start with **index.html** - Show all available portals
2. **Student Journey**:
   - Login → Dashboard → Browse Mentors → Book Session → Checkout → View Sessions → Watch Recording
3. **Mentor Journey**:
   - Login → Dashboard → Set Availability → View Sessions
4. **Admin Journey**:
   - Login → Dashboard → Manage Students/Mentors → Configure Google Meet Settings
5. **Corporate Journey**:
   - Login → Dashboard → View Employee Progress

### Key Selling Points to Highlight
✅ **Google Meet Integration** - Fully automated meeting creation and recording
✅ **Credit System** - Flexible payment model
✅ **Session Recordings** - Stored and accessible anytime
✅ **Multi-tenant** - Supports students, mentors, corporate clients
✅ **Scalable** - Can handle multiple concurrent sessions
✅ **Real-time Tracking** - Session status, credits, progress

## Next Steps

### After Approval
1. **Database Design** - Design schema for users, sessions, credits, recordings
2. **Backend Development** - API development with chosen stack
3. **Frontend Development** - Convert wireframes to actual application
4. **API Integrations** - Integrate Google Meet, Calendly, Email, WhatsApp
5. **Testing** - Unit, integration, and user acceptance testing
6. **Deployment** - Setup hosting and deployment pipeline

### Technology Stack Recommendations
- **Frontend**: React.js / Vue.js / Angular
- **Backend**: Node.js (Express) / Python (Django/Flask) / PHP (Laravel)
- **Database**: PostgreSQL / MySQL / MongoDB
- **Storage**: AWS S3 / Google Cloud Storage (for recordings)
- **Video**: Google Meet API
- **Scheduling**: Calendly API / Custom calendar
- **Notifications**: SendGrid (Email) / Twilio (SMS/WhatsApp)

## File Structure
```
wireframes/
├── index.html                      # Main navigation page
├── README.md                       # This file
├── student-login.html
├── student-dashboard.html
├── student-mentors.html
├── student-courses.html
├── student-booking.html
├── student-checkout.html
├── student-sessions.html
├── student-recordings.html
├── mentor-login.html
├── mentor-dashboard.html
├── mentor-availability.html
├── mentor-sessions.html
├── admin-login.html
├── admin-dashboard.html
├── admin-students.html
├── admin-mentors.html
├── admin-payments.html
├── admin-meet-settings.html
├── corporate-login.html
└── corporate-dashboard.html
```

## Notes
- These are static HTML wireframes for concept demonstration
- No actual API integrations are implemented (placeholders only)
- All data shown is mock/sample data
- Interactive elements are simulated with basic JavaScript
- Actual application will require proper backend and database

## Support
For questions about this prototype, please contact the development team.

---
**Generated for**: Radical Training Center
**Date**: December 2025
**Purpose**: Project Bid Presentation
