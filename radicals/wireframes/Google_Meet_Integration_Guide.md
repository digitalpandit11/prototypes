# 🎥 GOOGLE MEET INTEGRATION - COMPLETE GUIDE
## Self-Paced Training Management System

---

## 📋 TABLE OF CONTENTS
1. [Overview](#overview)
2. [Google Meet APIs Available](#google-meet-apis)
3. [Complete Workflow](#complete-workflow)
4. [Technical Implementation](#technical-implementation)
5. [Costs & Dependencies](#costs-dependencies)
6. [Limitations & Challenges](#limitations)
7. [Alternative Solutions](#alternatives)
8. [Recommended Approach](#recommendation)

---

## 🎯 OVERVIEW {#overview}

### What You Need Google Meet For:
1. ✅ **Automatic Meeting Scheduling** - Create meetings when student books
2. ✅ **Email Invitations** - Send meeting links to student & mentor
3. ✅ **Calendar Integration** - Add to Google Calendar automatically
4. ✅ **Recording Capture** - Record sessions for later viewing
5. ✅ **Recording Storage** - Store recordings for student access
6. ✅ **Recording Streaming** - Allow students to watch recordings

---

## 🔧 GOOGLE MEET APIs AVAILABLE {#google-meet-apis}

### ❌ BAD NEWS: Google Meet Has NO Direct API
**Reality Check:**
- Google does NOT provide a dedicated "Google Meet API"
- You CANNOT create meetings via a simple REST API call
- Google Meet is integrated through **Google Calendar API**

### ✅ WHAT'S ACTUALLY AVAILABLE:

#### **1. Google Calendar API** (Primary Method)
**What it does:**
- Creates calendar events with Google Meet links attached
- Automatically generates Meet links when you create events
- Manages attendees and sends invitations

**API Endpoint Example:**
```javascript
POST https://www.googleapis.com/calendar/v3/calendars/primary/events

{
  "summary": "Python Training Session - John Doe",
  "start": {
    "dateTime": "2024-12-20T10:00:00+05:30",
    "timeZone": "Asia/Kolkata"
  },
  "end": {
    "dateTime": "2024-12-20T12:00:00+05:30",
    "timeZone": "Asia/Kolkata"
  },
  "attendees": [
    {"email": "student@example.com"},
    {"email": "mentor@example.com"}
  ],
  "conferenceData": {
    "createRequest": {
      "requestId": "sample123",
      "conferenceSolutionKey": {
        "type": "hangoutsMeet"
      }
    }
  }
}
```

**Response includes:**
- `hangoutLink`: The Google Meet join URL
- `conferenceData`: Meeting details
- Event ID for later reference

#### **2. Google Drive API** (For Recordings)
**What it does:**
- Access recordings stored in Google Drive
- Download recordings
- Manage permissions
- Get streaming URLs

**Important:** Recordings are automatically saved to the meeting organizer's Google Drive

#### **3. Google Workspace Admin SDK** (Enterprise Only)
**What it does:**
- Manage organization settings
- Control recording policies
- User management

**Limitation:** Requires Google Workspace Enterprise plan

---

## 🔄 COMPLETE WORKFLOW {#complete-workflow}

### **WORKFLOW 1: MEETING SCHEDULING**

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Student Books Session on Your Platform            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Your Backend Server                                │
│  ─────────────────────────────────────────────────────────  │
│  1. Verify payment/credits                                  │
│  2. Save booking to database                                │
│  3. Call Google Calendar API with:                          │
│     - Date/Time                                             │
│     - Student email                                         │
│     - Mentor email                                          │
│     - Session title                                         │
│     - conferenceData request (creates Meet link)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Google Calendar API Response                       │
│  ─────────────────────────────────────────────────────────  │
│  Returns:                                                   │
│  - Event ID: "abc123xyz"                                    │
│  - Meet Link: "https://meet.google.com/abc-defg-hij"       │
│  - Calendar Event URL                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Your Backend Updates Database                      │
│  ─────────────────────────────────────────────────────────  │
│  Sessions Table:                                            │
│  - session_id: 1001                                         │
│  - google_event_id: "abc123xyz"                             │
│  - meet_link: "https://meet.google.com/abc-defg-hij"       │
│  - status: "scheduled"                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Automated Communications                           │
│  ─────────────────────────────────────────────────────────  │
│  A. Google Automatically Sends:                             │
│     - Calendar invitation to student@example.com            │
│     - Calendar invitation to mentor@example.com             │
│     - Email with "Join with Google Meet" button             │
│                                                             │
│  B. Your Platform Sends (Optional):                         │
│     - Custom confirmation email via SendGrid/AWS SES        │
│     - SMS reminder via Twilio                               │
│     - WhatsApp notification via Twilio API                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: Student & Mentor Access                            │
│  ─────────────────────────────────────────────────────────  │
│  - Link appears in student-sessions.html                    │
│  - Click "Join Session" → Opens Google Meet                 │
│  - Both can join from Google Calendar or your platform      │
└─────────────────────────────────────────────────────────────┘
```

---

### **WORKFLOW 2: RECORDING CAPTURE & STORAGE**

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Mentor Starts Recording During Session            │
│  ─────────────────────────────────────────────────────────  │
│  - Mentor clicks "Record meeting" in Google Meet            │
│  - Google Meet starts recording                             │
│  - Recording consent notification shown to all              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Session Ends - Google Processes Recording          │
│  ─────────────────────────────────────────────────────────  │
│  - Recording uploaded to organizer's Google Drive           │
│  - Saved in: "Meet Recordings" folder                       │
│  - Format: MP4 video file                                   │
│  - Processing time: 5-60 minutes (depends on length)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Email Notification (From Google)                   │
│  ─────────────────────────────────────────────────────────  │
│  Google sends email to:                                     │
│  - Meeting organizer (mentor)                               │
│  - Subject: "Recording from [Meeting Name] is ready"        │
│  - Contains: Google Drive link to recording                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Capture Recording Link (2 Options)                 │
│  ─────────────────────────────────────────────────────────  │
│  OPTION A - Manual (Phase 1):                               │
│  - Admin copies link from Google Drive                      │
│  - Pastes into admin-recordings.html                        │
│  - Saves to database                                        │
│                                                             │
│  OPTION B - Automated (Phase 2):                            │
│  - Use Google Drive API webhook                             │
│  - Detect new files in "Meet Recordings" folder            │
│  - Automatically extract file ID                            │
│  - Store in database with session ID                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Store Recording Metadata in Database               │
│  ─────────────────────────────────────────────────────────  │
│  Recordings Table:                                          │
│  - recording_id: 5001                                       │
│  - session_id: 1001                                         │
│  - google_drive_file_id: "1a2b3c4d5e6f"                     │
│  - drive_link: "https://drive.google.com/file/d/..."       │
│  - duration: "1h 45m"                                       │
│  - file_size: "850 MB"                                      │
│  - status: "available"                                      │
│  - created_at: "2024-12-20 14:30:00"                        │
└─────────────────────────────────────────────────────────────┘
```

---

### **WORKFLOW 3: RECORDING STREAMING TO STUDENTS**

```
┌─────────────────────────────────────────────────────────────┐
│  METHOD 1: Direct Google Drive Link (Simple)                │
│  ─────────────────────────────────────────────────────────  │
│  STEP 1: Make Recording Public/Anyone with Link             │
│  - Use Google Drive API or manual setting                   │
│  - Set permission to "Anyone with link can view"            │
│                                                             │
│  STEP 2: Generate Embeddable Link                           │
│  Original: https://drive.google.com/file/d/FILE_ID/view     │
│  Embed:    https://drive.google.com/file/d/FILE_ID/preview  │
│                                                             │
│  STEP 3: Student Views on Your Platform                     │
│  In student-recordings.html:                                │
│  <iframe src="https://drive.google.com/file/d/FILE_ID/      │
│          preview" width="100%" height="480"></iframe>       │
│                                                             │
│  PROS: ✅ Simple, ✅ Free, ✅ Google handles streaming       │
│  CONS: ❌ Google branding, ❌ Less control                   │
└─────────────────────────────────────────────────────────────┘
                            OR
┌─────────────────────────────────────────────────────────────┐
│  METHOD 2: Download & Re-host (Better Control)              │
│  ─────────────────────────────────────────────────────────  │
│  STEP 1: Download from Google Drive via API                 │
│  GET https://www.googleapis.com/drive/v3/files/FILE_ID?     │
│      alt=media                                              │
│                                                             │
│  STEP 2: Upload to Your Video Platform                      │
│  Options:                                                   │
│  A. AWS S3 + CloudFront (CDN)                               │
│  B. Vimeo API                                               │
│  C. YouTube (Private/Unlisted)                              │
│  D. Bunny.net (Affordable CDN)                              │
│                                                             │
│  STEP 3: Stream from Your Platform                          │
│  Use HTML5 video player or embed player                     │
│                                                             │
│  PROS: ✅ Full control, ✅ Custom branding, ✅ Analytics     │
│  CONS: ❌ Storage costs, ❌ Bandwidth costs                  │
└─────────────────────────────────────────────────────────────┘
                            OR
┌─────────────────────────────────────────────────────────────┐
│  METHOD 3: Hybrid Approach (Recommended)                    │
│  ─────────────────────────────────────────────────────────  │
│  - Keep master copy in Google Drive (free storage)          │
│  - Generate temporary streaming link via Drive API          │
│  - Use your custom video player UI                          │
│  - Track views in your database                             │
│                                                             │
│  Code Example:                                              │
│  1. Get file metadata via Drive API                         │
│  2. Generate time-limited download link                     │
│  3. Stream via your player with custom controls             │
│                                                             │
│  PROS: ✅ Free storage, ✅ Custom UI, ✅ Access control      │
│  CONS: ⚠️ More complex implementation                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 TECHNICAL IMPLEMENTATION {#technical-implementation}

### **1. SETUP REQUIREMENTS**

#### A. Google Cloud Project Setup
```
Step 1: Create Google Cloud Project
- Go to: https://console.cloud.google.com/
- Create new project: "Training-Platform-Prod"
- Enable billing (required for API access)

Step 2: Enable Required APIs
- Google Calendar API
- Google Drive API
- Gmail API (for custom emails - optional)

Step 3: Create OAuth 2.0 Credentials
- Create OAuth client ID
- Type: Web application
- Authorized redirect URIs: https://yourplatform.com/auth/google/callback
- Download credentials JSON file

Step 4: Create Service Account (For Backend Operations)
- Create service account
- Grant domain-wide delegation
- Download service account key JSON
```

#### B. Authentication Flow
```javascript
// Backend: Node.js Example
const { google } = require('googleapis');
const calendar = google.calendar('v3');

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Set credentials (from database after user auth)
oauth2Client.setCredentials({
  access_token: 'stored_access_token',
  refresh_token: 'stored_refresh_token'
});

// Create calendar event with Meet link
async function createMeetingSession(sessionData) {
  const event = {
    summary: `${sessionData.courseName} - ${sessionData.studentName}`,
    description: `Training session for ${sessionData.courseName}`,
    start: {
      dateTime: sessionData.startTime, // '2024-12-20T10:00:00+05:30'
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: sessionData.endTime,
      timeZone: 'Asia/Kolkata',
    },
    attendees: [
      { email: sessionData.studentEmail },
      { email: sessionData.mentorEmail },
    ],
    conferenceData: {
      createRequest: {
        requestId: `session-${sessionData.sessionId}-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 30 },      // 30 min before
      ],
    },
  };

  const response = await calendar.events.insert({
    auth: oauth2Client,
    calendarId: 'primary',
    conferenceDataVersion: 1,
    sendUpdates: 'all', // Sends email to all attendees
    resource: event,
  });

  return {
    eventId: response.data.id,
    meetLink: response.data.hangoutLink,
    htmlLink: response.data.htmlLink,
  };
}
```

### **2. RECORDING MANAGEMENT**

#### A. Detect Recording Upload (Webhook)
```javascript
// Setup Google Drive API Push Notification
const drive = google.drive('v3');

async function setupRecordingWatcher() {
  // Watch the "Meet Recordings" folder
  const response = await drive.files.watch({
    auth: oauth2Client,
    fileId: 'MEET_RECORDINGS_FOLDER_ID',
    requestBody: {
      id: 'unique-channel-id',
      type: 'web_hook',
      address: 'https://yourplatform.com/webhooks/drive',
      expiration: Date.now() + 86400000, // 24 hours
    },
  });

  // Renew webhook every 24 hours via cron job
}

// Webhook endpoint
app.post('/webhooks/drive', async (req, res) => {
  // Triggered when new file added to folder
  const changes = await drive.changes.list({
    auth: oauth2Client,
    pageToken: req.body.pageToken,
  });

  for (const change of changes.data.changes) {
    if (change.file.mimeType === 'video/mp4') {
      // New recording detected
      await saveRecordingToDatabase({
        fileId: change.file.id,
        fileName: change.file.name,
        size: change.file.size,
        createdTime: change.file.createdTime,
      });
    }
  }

  res.sendStatus(200);
});
```

#### B. Generate Streaming Link
```javascript
async function getRecordingStreamUrl(fileId) {
  // Get file metadata
  const file = await drive.files.get({
    auth: oauth2Client,
    fileId: fileId,
    fields: 'webViewLink,webContentLink,thumbnailLink',
  });

  // Make file accessible
  await drive.permissions.create({
    auth: oauth2Client,
    fileId: fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone', // or 'user' for specific users
    },
  });

  // Return embeddable URL
  return {
    viewUrl: file.data.webViewLink,
    downloadUrl: file.data.webContentLink,
    embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    thumbnail: file.data.thumbnailLink,
  };
}
```

#### C. Download Recording
```javascript
async function downloadRecording(fileId, destinationPath) {
  const dest = fs.createWriteStream(destinationPath);

  const response = await drive.files.get(
    {
      auth: oauth2Client,
      fileId: fileId,
      alt: 'media',
    },
    { responseType: 'stream' }
  );

  return new Promise((resolve, reject) => {
    response.data
      .on('end', () => resolve())
      .on('error', err => reject(err))
      .pipe(dest);
  });
}
```

---

## 💰 COSTS & DEPENDENCIES {#costs-dependencies}

### **GOOGLE WORKSPACE COSTS**

| Plan | Price (per user/month) | Features | Recording Capability |
|------|----------------------|----------|---------------------|
| **Free Gmail** | $0 | - 60-min limit<br>- 100 participants | ❌ NO RECORDING |
| **Workspace Individual** | ₹600 (~$7.20) | - 24-hour limit<br>- 100 participants | ❌ NO RECORDING |
| **Business Starter** | ₹672 (~$8) | - 24-hour limit<br>- 100 participants<br>- 30GB storage/user | ✅ RECORDING (saved to Drive) |
| **Business Standard** | ₹1,344 (~$16) | - 24-hour limit<br>- 150 participants<br>- 2TB storage/user | ✅ RECORDING + Attendance tracking |
| **Business Plus** | ₹2,040 (~$24) | - 24-hour limit<br>- 500 participants<br>- 5TB storage/user | ✅ RECORDING + Advanced features |
| **Enterprise** | Custom | - 24-hour limit<br>- 500 participants<br>- Unlimited storage | ✅ ALL FEATURES + API access |

### **⚠️ CRITICAL REQUIREMENT FOR YOUR USE CASE:**

**Minimum Required: Google Workspace Business Starter ($8/month per mentor)**

**Why:**
- Free Gmail accounts CANNOT record meetings
- Recording is ESSENTIAL for your business model
- Each mentor needs their own Google Workspace account

**Cost Calculation Example:**
- 10 mentors × $8/month = $80/month = $960/year
- 20 mentors × $8/month = $160/month = $1,920/year

---

### **ADDITIONAL COSTS**

#### 1. Google Cloud Platform (API Usage)
```
Google Calendar API: FREE
- 1,000,000 requests/day free quota
- You'll never hit this limit

Google Drive API: FREE
- 1,000,000,000 queries/day free
- 10,000 requests per 100 seconds per user

Storage in Google Drive:
- Included in Workspace plan (30GB-5TB per user)
- Additional: ₹130/month per 100GB if needed
```

#### 2. Video Hosting (If Not Using Google Drive)

| Service | Cost | Bandwidth | Storage | Notes |
|---------|------|-----------|---------|-------|
| **Google Drive** (Included) | $0 extra | Unlimited | 30GB-5TB | Part of Workspace |
| **AWS S3 + CloudFront** | $0.023/GB storage<br>$0.085/GB transfer | Pay per use | Unlimited | Professional solution |
| **Bunny.net CDN** | $0.01/GB storage<br>$0.01/GB bandwidth | Cheaper than AWS | Unlimited | Budget-friendly |
| **Vimeo** | $20-$75/month | Limited | 250GB-7TB | Easy to use |
| **YouTube Private** | Free | Unlimited | Unlimited | Free but limited control |

**Example Calculation (100 sessions/month):**
- Average recording: 1.5 hours = ~800MB
- 100 sessions = 80GB/month
- Storage: 80GB × $0.02 = $1.60/month
- Bandwidth (viewed 2x): 160GB × $0.085 = $13.60/month
- **Total: ~$15/month** if using AWS

**vs Google Drive: $0 extra** (included in Workspace)

#### 3. Email/SMS Notifications (Optional)

| Service | Purpose | Cost |
|---------|---------|------|
| **SendGrid** | Email | $15/month (40k emails) |
| **AWS SES** | Email | $0.10 per 1000 emails |
| **Twilio** | SMS | ₹0.50 per SMS |
| **WhatsApp Business API** | WhatsApp | ₹0.30-0.60 per message |

---

### **TOTAL MONTHLY COST ESTIMATE**

#### Minimum Viable Setup (Phase 1):
```
- Google Workspace Business Starter (5 mentors): $40/month
- Google Cloud (APIs): $0 (free tier)
- Email (AWS SES for 5000 emails): $0.50/month
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: ~$41/month (~₹3,400/month)
```

#### Production Setup (Phase 2):
```
- Google Workspace Business Standard (10 mentors): $160/month
- Google Cloud (APIs): $0 (free tier)
- Email (SendGrid 40k): $15/month
- SMS (Twilio 1000 SMS): ₹500/month (~$6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: ~$181/month (~₹15,000/month)
```

#### Scale Setup (Phase 3 - 50 mentors):
```
- Google Workspace Business Standard (50 mentors): $800/month
- Video CDN (if needed): $15/month
- Email (SendGrid): $15/month
- SMS (Twilio): $30/month
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: ~$860/month (~₹71,000/month)
```

---

## ⚠️ LIMITATIONS & CHALLENGES {#limitations}

### **GOOGLE MEET LIMITATIONS**

1. **No Direct Recording Control via API**
   - ❌ Cannot start/stop recording programmatically
   - ✅ Mentor must manually click "Record" in the meeting
   - **Impact:** Cannot guarantee all sessions are recorded

2. **Recording Processing Delay**
   - Takes 5-60 minutes after meeting ends
   - No way to get instant recording
   - **Impact:** Students must wait before accessing recording

3. **Recording Storage**
   - Recordings go to organizer's Drive (mentor's account)
   - Cannot auto-save to admin's Drive
   - **Impact:** Need to manage access across multiple accounts

4. **No Automatic Transcription** (Free/Starter Plans)
   - Business Plus or Enterprise needed for transcripts
   - **Impact:** Cannot offer searchable transcripts in Phase 1

5. **No Analytics via API**
   - Cannot get attendance data programmatically
   - Cannot track who joined/left
   - **Impact:** Must rely on manual reporting

6. **Meeting Limits**
   - Business Starter: 100 participants
   - **Impact:** Cannot run large workshops initially

7. **Domain Verification Required**
   - For production, need to verify domain ownership
   - Takes 1-3 days
   - **Impact:** Delays in setup

### **GOOGLE DRIVE LIMITATIONS**

1. **Download Quota**
   - If video is popular, may hit download limits
   - Google may temporarily block downloads
   - **Impact:** Students cannot access during high traffic

2. **Streaming Quality**
   - Google chooses quality automatically
   - No control over bitrate
   - **Impact:** May not play well on slow connections

3. **Embed Restrictions**
   - Some browsers block Drive embeds
   - Corporate firewalls may block
   - **Impact:** Students may not see video

---

## 🔄 ALTERNATIVE SOLUTIONS {#alternatives}

### **OPTION 1: Zoom + Cloud Recording**

**Pros:**
- ✅ Built-in recording API
- ✅ Automatic cloud recording
- ✅ Better recording control
- ✅ Attendance tracking API
- ✅ Transcription available

**Cons:**
- ❌ More expensive ($150/year per host for Pro)
- ❌ 40-minute limit on free accounts
- ❌ Separate platform to manage

**Cost:**
- Zoom Pro: $150/year per mentor
- 10 mentors = $1,500/year vs Google $960/year

**API Availability:**
- Excellent REST API for everything
- Webhooks for recording ready events

### **OPTION 2: Microsoft Teams + OneDrive**

**Pros:**
- ✅ Similar to Google Meet workflow
- ✅ Automatic recording
- ✅ OneDrive storage included
- ✅ Good API support

**Cons:**
- ❌ Requires Microsoft 365 subscription
- ❌ $12-20/month per user
- ❌ Less familiar in India market

**Cost:**
- More expensive than Google Workspace

### **OPTION 3: Jitsi Meet (Self-Hosted)**

**Pros:**
- ✅ Completely FREE and open-source
- ✅ Full control over everything
- ✅ Can integrate with your own recording solution
- ✅ No per-user costs
- ✅ Can customize branding

**Cons:**
- ❌ Requires server setup and maintenance
- ❌ You handle all infrastructure
- ❌ Recording requires Jibri setup (complex)
- ❌ Bandwidth costs on you
- ❌ Less reliable than Google

**Cost:**
- Server: $20-50/month (DigitalOcean/AWS)
- Storage: Separate S3 costs
- DevOps time: Significant

### **OPTION 4: Daily.co (Developer-Friendly)**

**Pros:**
- ✅ Excellent API
- ✅ Built for embedding in apps
- ✅ Cloud recording included
- ✅ Webhooks for all events
- ✅ Free tier: 10,000 minutes/month

**Cons:**
- ❌ Paid plans needed for scale
- ❌ $99-299/month for unlimited

**Cost:**
- Free: 10,000 min/month (~167 hours)
- Scale: $99/month for 50,000 minutes

---

## ✅ RECOMMENDED APPROACH {#recommendation}

### **PHASE 1 (MVP): Google Meet + Manual Process**

**Why:**
- ✅ Lowest cost to start
- ✅ Familiar to users in India
- ✅ Reliable infrastructure
- ✅ No server maintenance

**Setup:**
1. Get Google Workspace Business Starter for mentors
2. Use Calendar API to create meetings
3. Mentor manually starts recording
4. Admin manually adds recording links to platform
5. Stream via Google Drive embed

**Limitations Accepted:**
- Manual recording management
- No automatic transcription
- Basic analytics only

**Monthly Cost:** ~₹3,400 ($40) for 5 mentors

---

### **PHASE 2 (Enhanced): Google Meet + Automation**

**Upgrade:**
1. Implement Drive API webhooks
2. Auto-detect new recordings
3. Auto-publish to student portal
4. Add download option
5. Track view analytics in your DB

**Additional Features:**
- Email notifications when recording ready
- Recording thumbnails
- Duration display
- Search functionality

**Monthly Cost:** ~₹15,000 ($181) for 10 mentors

---

### **PHASE 3 (Scale): Hybrid Approach**

**Strategy:**
1. Keep Google Meet for live sessions
2. Download recordings via API
3. Re-upload to Bunny.net CDN for streaming
4. Keep master in Google Drive as backup

**Why Hybrid:**
- ✅ Better streaming performance
- ✅ Full control over player
- ✅ Analytics on video engagement
- ✅ Can offer different qualities
- ✅ Better for high traffic

**OR Consider Zoom if:**
- Need better recording automation
- Want attendance APIs
- Willing to pay premium

**Monthly Cost:** ~₹71,000 ($860) for 50 mentors + CDN

---

## 🎯 FINAL RECOMMENDATION

### **START WITH GOOGLE MEET BECAUSE:**

1. **Cost-Effective:** $8/mentor vs $15/mentor (Zoom)
2. **User Familiarity:** Everyone in India knows Google Meet
3. **Calendar Integration:** Natural fit with scheduling
4. **Quick Setup:** Can be live in 2-3 days
5. **Scalable:** APIs available when you need automation

### **ACCEPT THESE LIMITATIONS IN PHASE 1:**
- Manual recording start (mentor clicks button)
- Manual recording link addition (admin copies from Drive)
- Basic streaming via Drive embed

### **PLAN FOR AUTOMATION IN PHASE 2:**
- Drive API webhooks
- Automatic recording detection
- Better video player

### **EVALUATE ALTERNATIVES AFTER 6 MONTHS:**
- If recording automation is critical → Switch to Zoom
- If cost is major concern → Explore Jitsi
- If need advanced features → Upgrade to Google Enterprise

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1 Setup (Week 1-2):
- [ ] Purchase Google Workspace Business Starter (5 accounts)
- [ ] Create Google Cloud project
- [ ] Enable Calendar API and Drive API
- [ ] Set up OAuth 2.0 credentials
- [ ] Implement meeting creation via Calendar API
- [ ] Test meeting links in student-sessions.html
- [ ] Document recording process for mentors
- [ ] Create admin interface for adding recording links
- [ ] Test Drive embed in student-recordings.html

### Phase 2 Enhancements (Month 3-4):
- [ ] Implement Drive API webhook
- [ ] Auto-detect recordings
- [ ] Email notifications for recording ready
- [ ] View tracking in database
- [ ] Download option for students
- [ ] Search/filter recordings

### Phase 3 Optimization (Month 6+):
- [ ] Evaluate CDN for video delivery
- [ ] Implement transcoding if needed
- [ ] Add video analytics
- [ ] Consider Zoom migration if ROI positive

---

**BOTTOM LINE:**
Start with Google Meet + manual process = Low risk, low cost, quick launch.
Automate gradually as revenue grows.
Switch platforms only if data shows clear ROI.

