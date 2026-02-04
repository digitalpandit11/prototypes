# 💳 CREDIT MANAGEMENT & PARTIAL SESSION HANDLING
## Self-Paced Training Management System

---

## 📋 THE PROBLEM

### **Scenario:**
- Student has: **100 credits**
- 2-hour session requires: **200 credits** (100 credits/hour)
- Student books 2-hour session
- **Question:** How to handle when credits run out after 1 hour?

### **Business Challenges:**
1. ❌ **Cannot forcefully close Google Meet** via API
2. ❌ Mentor and student already in the meeting
3. ❌ Awkward to interrupt an ongoing learning session
4. ✅ Need fair system for both platform and students
5. ✅ Need to prevent credit abuse

---

## 🎯 SOLUTION OPTIONS

---

## **OPTION 1: PREVENT BOOKING (Recommended - Phase 1)**

### **How It Works:**
**Block booking if insufficient credits BEFORE session is created**

```javascript
// Booking validation
function canBookSession(studentCredits, requiredCredits) {
  if (studentCredits < requiredCredits) {
    return {
      allowed: false,
      message: "Insufficient credits. You have 100 credits but need 200.",
      suggestion: "Please add 100 more credits or book a 1-hour session (100 credits)."
    };
  }
  return { allowed: true };
}

// In student-booking.html
if (studentCredits < sessionCredits) {
  showError("You need 200 credits but only have 100 credits.");
  showOptions([
    { text: "Add 100 Credits", action: "redirect_to_payments" },
    { text: "Book 1-hour session instead", action: "change_duration" }
  ]);
}
```

### **User Flow:**
```
Student selects 2-hour session (200 credits needed)
     ↓
System checks: Student has 100 credits
     ↓
❌ BOOKING BLOCKED
     ↓
Show message: "Insufficient credits"
     ↓
Options presented:
  [Add 100 Credits] [Book 1-hour session]
```

### **Pros:**
- ✅ **Simple to implement**
- ✅ **No technical complexity**
- ✅ **Clear communication upfront**
- ✅ **No awkward mid-session interruptions**
- ✅ **No API limitations**

### **Cons:**
- ❌ Less flexible for students
- ❌ Might lose bookings (students leave without adding credits)
- ❌ Cannot do "pay what you can afford" models

### **Best For:**
- **Phase 1** - MVP launch
- **Simple business model**
- **Clear pricing**

---

## **OPTION 2: RESERVE CREDITS + REFUND UNUSED (Flexible)**

### **How It Works:**
**Reserve full amount, deduct hourly, refund unused portion**

```javascript
// Booking process
function bookSessionWithReservation(studentId, sessionDuration, creditsPerHour) {
  const requiredCredits = sessionDuration * creditsPerHour;
  const studentCredits = getStudentCredits(studentId);

  if (studentCredits < requiredCredits) {
    // Calculate maximum session they can afford
    const maxHours = Math.floor(studentCredits / creditsPerHour);

    return {
      allowed: false,
      maxAffordable: maxHours,
      message: `You have ${studentCredits} credits. You can book up to ${maxHours} hours.`,
      options: [
        { action: "add_credits", label: "Add Credits" },
        { action: "book_partial", duration: maxHours, label: `Book ${maxHours}-hour session` }
      ]
    };
  }

  // Reserve credits (freeze, don't deduct yet)
  reserveCredits(studentId, requiredCredits, sessionId);

  return { allowed: true, reserved: requiredCredits };
}

// After session ends
function finalizeSession(sessionId) {
  const session = getSession(sessionId);
  const actualDuration = calculateActualDuration(session);
  const actualCredits = actualDuration * session.creditsPerHour;
  const reservedCredits = session.reservedCredits;

  // Deduct actual usage
  deductCredits(session.studentId, actualCredits);

  // Refund unused
  const refund = reservedCredits - actualCredits;
  if (refund > 0) {
    refundCredits(session.studentId, refund);
    sendRefundNotification(session.studentId, refund);
  }

  // Release reservation
  releaseReservation(sessionId);
}
```

### **Database Schema:**
```sql
-- Sessions table
CREATE TABLE sessions (
  id INT PRIMARY KEY,
  student_id INT,
  mentor_id INT,
  scheduled_duration INT, -- 2 hours
  actual_duration INT, -- calculated after session
  credits_per_hour INT, -- 100
  reserved_credits INT, -- 200 (frozen at booking)
  actual_credits_used INT, -- calculated after session
  refunded_credits INT, -- difference if session was shorter
  status ENUM('scheduled', 'ongoing', 'completed', 'cancelled')
);

-- Credit transactions
CREATE TABLE credit_transactions (
  id INT PRIMARY KEY,
  student_id INT,
  session_id INT,
  type ENUM('reservation', 'deduction', 'refund', 'purchase'),
  amount INT,
  balance_after INT,
  created_at TIMESTAMP
);
```

### **User Flow:**
```
Student books 2-hour session (200 credits needed)
     ↓
System RESERVES 200 credits (frozen, not deducted)
     ↓
Session happens (actual duration: 1.5 hours)
     ↓
System calculates: 1.5 hours × 100 = 150 credits
     ↓
Deduct 150 credits, Refund 50 credits
     ↓
Email: "Your session used 150 credits. 50 credits refunded."
```

### **Pros:**
- ✅ **Fair to students** (pay for what you use)
- ✅ **Encourages bookings** (flexible)
- ✅ **Handles early/late endings**
- ✅ **Good for irregular session lengths**

### **Cons:**
- ❌ More complex implementation
- ❌ Need to track actual session duration accurately
- ❌ Refund processing overhead
- ❌ Potential disputes ("session wasn't 2 hours!")

### **Best For:**
- **Phase 2** - Enhanced experience
- **Customer-friendly approach**
- **Variable session lengths**

---

## **OPTION 3: HOURLY BLOCKS (Safest)**

### **How It Works:**
**Only book sessions in blocks student can afford**

```javascript
// Booking UI
function displayBookingOptions(studentCredits, creditsPerHour) {
  const maxHours = Math.floor(studentCredits / creditsPerHour);

  const options = [];
  for (let hours = 1; hours <= maxHours && hours <= 4; hours++) {
    options.push({
      duration: hours,
      credits: hours * creditsPerHour,
      label: `${hours} hour${hours > 1 ? 's' : ''} - ${hours * creditsPerHour} credits`
    });
  }

  return options;
}

// Example for student with 100 credits:
// Available options:
// [1 hour - 100 credits]
// (2, 3, 4 hour options are disabled/hidden)
```

### **UI Implementation:**
```html
<!-- student-booking.html -->
<div class="duration-selector">
  <h3>Select Session Duration</h3>
  <div class="duration-options">
    <!-- Student has 100 credits -->

    <div class="duration-option available" data-hours="1">
      <div class="duration-time">1 Hour</div>
      <div class="duration-cost">100 Credits</div>
      <button class="btn btn-primary">Book Now</button>
    </div>

    <div class="duration-option disabled" data-hours="2">
      <div class="duration-time">2 Hours</div>
      <div class="duration-cost">200 Credits</div>
      <div class="insufficient-badge">Need 100 more credits</div>
      <button class="btn btn-secondary" disabled>Insufficient Credits</button>
    </div>

    <div class="duration-option disabled" data-hours="3">
      <div class="duration-time">3 Hours</div>
      <div class="duration-cost">300 Credits</div>
      <div class="insufficient-badge">Need 200 more credits</div>
      <button class="btn btn-secondary" disabled>Insufficient Credits</button>
    </div>
  </div>

  <div class="credit-notice">
    💡 You have 100 credits. <a href="payments-purchases.html">Add more credits</a>
  </div>
</div>
```

### **Pros:**
- ✅ **Crystal clear** to students
- ✅ **No surprises**
- ✅ **No refund complexity**
- ✅ **Easy to implement**
- ✅ **No session interruption issues**

### **Cons:**
- ❌ Rigid (less flexible)
- ❌ Students must plan ahead
- ❌ May miss booking opportunities

### **Best For:**
- **Phase 1** - Simple and safe
- **Predictable pricing**
- **Clear expectations**

---

## **OPTION 4: ALLOW DEFICIT + DEBT COLLECTION (Advanced)**

### **How It Works:**
**Allow booking with insufficient credits, track debt**

```javascript
// Allow booking with negative balance
function bookSessionWithCredit(studentId, requiredCredits) {
  const currentCredits = getStudentCredits(studentId);
  const deficit = requiredCredits - currentCredits;

  if (deficit > 0) {
    // Create debt record
    createDebtRecord(studentId, deficit);

    // Allow booking but mark as "on credit"
    const session = createSession({
      studentId,
      requiredCredits,
      onCredit: true,
      debtAmount: deficit
    });

    // Send notification
    sendEmail(studentId, {
      subject: "Session booked on credit",
      body: `Your session is confirmed. You have a deficit of ${deficit} credits.
             Please add credits before your next booking.`
    });

    return { allowed: true, debtIncurred: deficit };
  }

  return { allowed: true, debtIncurred: 0 };
}

// Enforcement
function canBookNewSession(studentId) {
  const debt = getStudentDebt(studentId);

  if (debt > 0) {
    return {
      allowed: false,
      message: `You have an outstanding balance of ${debt} credits.
                Please clear this before booking new sessions.`,
      action: "add_credits"
    };
  }

  return { allowed: true };
}
```

### **Business Logic:**
```
Student with 100 credits books 2-hour session (200 credits)
     ↓
System allows booking
     ↓
Creates debt record: -100 credits
     ↓
Student balance: -100 credits
     ↓
Session happens normally
     ↓
Next booking attempt: BLOCKED until debt cleared
     ↓
Student must add 100+ credits before next booking
```

### **Pros:**
- ✅ **Customer friendly** (don't lose bookings)
- ✅ **Increases conversion** (remove friction)
- ✅ **Flexible**
- ✅ **Can implement grace period**

### **Cons:**
- ❌ **Risk of non-payment**
- ❌ **Complex debt tracking**
- ❌ **May need collection process**
- ❌ **Potential abuse**

### **Best For:**
- **Phase 3** - Mature platform
- **Trusted student base**
- **Subscription models**

---

## **OPTION 5: CANNOT CLOSE MEETING EARLY (Technical Reality Check)**

### **Why You CANNOT Auto-Close Google Meet:**

#### **Google Meet API Limitations:**
```javascript
// ❌ THIS DOES NOT EXIST
googleMeet.endMeeting(meetingId); // NO SUCH API

// ❌ CANNOT DO THIS
googleMeet.kickParticipant(userId); // NO SUCH API

// ❌ CANNOT DO THIS
googleMeet.setTimeLimit(meetingId, 60); // NO SUCH API
```

**Technical Reality:**
- ✅ Google Calendar API can CREATE meetings
- ❌ NO API to control active meetings
- ❌ NO API to end meetings
- ❌ NO API to remove participants
- ❌ Only organizer can manually end meeting

### **Workaround Attempts (All Have Issues):**

#### **Attempt 1: Delete Calendar Event**
```javascript
// Delete the calendar event
await calendar.events.delete({
  calendarId: 'primary',
  eventId: sessionEventId
});
```
**Problem:** Meeting continues! Deleting event doesn't close active meeting.

#### **Attempt 2: Send Notification to Mentor**
```javascript
// After 1 hour, send alert to mentor
setTimeout(() => {
  sendSMS(mentorPhone, "Student credits expired. Please end session.");
  sendEmail(mentorEmail, "Credit limit reached notification");
}, 60 * 60 * 1000); // 1 hour
```
**Problem:** Relies on mentor cooperation. Not automated.

#### **Attempt 3: Display Warning in UI**
```javascript
// Show countdown in student portal
if (sessionTimeElapsed >= affordableTime) {
  showWarning("Your credits have been exhausted. Session will be marked as unpaid.");
}
```
**Problem:** Student still in meeting. Doesn't stop session.

---

## **OPTION 6: HYBRID APPROACH (Best Practice)**

### **Combine Multiple Strategies:**

#### **Strategy 1: Pre-Booking Prevention (Primary)**
```javascript
// STRICT: Don't allow booking if insufficient
if (studentCredits < requiredCredits) {
  const shortfall = requiredCredits - studentCredits;
  showError(`You need ${shortfall} more credits to book this session.`);
  showOptions([
    "Add Credits Now",
    "Book Shorter Session"
  ]);
  return false;
}
```

#### **Strategy 2: Grace Period (Backup)**
```javascript
// If somehow student books with insufficient credits
// (e.g., credits expired between booking and session)
const GRACE_CREDITS = 50; // 30-minute buffer

if (studentCredits < requiredCredits) {
  const deficit = requiredCredits - studentCredits;

  if (deficit <= GRACE_CREDITS) {
    // Allow session, create debt
    allowSessionWithDebt(studentId, deficit);
    notifyDebt(studentId, deficit);
  } else {
    // Too large deficit - cancel session
    cancelSession(sessionId);
    notifyInsufficientCredits(studentId);
    refundBookingFee(studentId);
  }
}
```

#### **Strategy 3: Real-time Monitoring**
```javascript
// Monitor session progress
setInterval(async () => {
  const session = await getActiveSession(sessionId);
  const elapsed = getElapsedTime(session);
  const creditsUsed = (elapsed / 60) * session.creditsPerHour;
  const creditsRemaining = session.reservedCredits - creditsUsed;

  // Alert when getting low
  if (creditsRemaining <= 10 && !session.alertSent) {
    await sendAlert(session.studentId,
      "You have 10 minutes of credits remaining. Session will end soon."
    );
    await sendAlert(session.mentorId,
      "Student credits running low. Please wrap up session."
    );
    session.alertSent = true;
  }

  // Mark for review after credit exhaustion
  if (creditsRemaining <= 0) {
    session.status = 'over_limit';
    session.overtimeMinutes = Math.abs(creditsRemaining);
    // Cannot close meeting, but track overage
  }
}, 5 * 60 * 1000); // Check every 5 minutes
```

#### **Strategy 4: Post-Session Reconciliation**
```javascript
// After session ends
async function reconcileSession(sessionId) {
  const session = await getSession(sessionId);
  const actualDuration = session.endTime - session.startTime;
  const actualCredits = (actualDuration / 60) * session.creditsPerHour;

  if (actualCredits > session.reservedCredits) {
    // Overtime occurred
    const overtime = actualCredits - session.reservedCredits;

    // Options:
    // A. Deduct from student balance (may go negative)
    deductCredits(session.studentId, overtime);

    // B. Create debt record
    createDebt(session.studentId, overtime);

    // C. Waive if small amount (goodwill)
    if (overtime <= 5) { // 5 minutes grace
      // Waive
      logGoodwillWaiver(sessionId, overtime);
    } else {
      // Charge
      deductCredits(session.studentId, overtime);
    }

    // Notify student
    sendEmail(session.studentId, {
      subject: "Session exceeded credit allocation",
      body: `Your session ran ${overtime} credits over.
             ${overtime <= 5 ? "We've waived this as a courtesy." :
                              "This has been deducted from your balance."}`
    });
  } else if (actualCredits < session.reservedCredits) {
    // Session was shorter - refund
    const refund = session.reservedCredits - actualCredits;
    refundCredits(session.studentId, refund);
  }
}
```

---

## 🎯 RECOMMENDED IMPLEMENTATION

### **PHASE 1 (MVP): Simple Prevention**

```javascript
// Strict validation at booking time
function validateBooking(studentId, sessionDuration, creditsPerHour) {
  const requiredCredits = sessionDuration * creditsPerHour;
  const studentCredits = getStudentCredits(studentId);

  // HARD STOP if insufficient
  if (studentCredits < requiredCredits) {
    return {
      success: false,
      error: "INSUFFICIENT_CREDITS",
      message: `You need ${requiredCredits} credits but have ${studentCredits}.`,
      shortfall: requiredCredits - studentCredits,
      actions: [
        { type: "add_credits", amount: requiredCredits - studentCredits },
        { type: "reduce_duration", maxHours: Math.floor(studentCredits / creditsPerHour) }
      ]
    };
  }

  return { success: true };
}
```

**UI Flow:**
```
Student Dashboard → Book Session → Select 2-hour session
     ↓
Check credits: 100 available, 200 needed
     ↓
Show error modal:
  "⚠️ Insufficient Credits
   You need 200 credits but have 100 credits.

   Options:
   [Add 100 Credits]  [Book 1-hour Session Instead]
   [Cancel]"
```

### **PHASE 2 (Enhanced): Reserve + Refund**

```javascript
// At booking
const reserved = reserveCredits(studentId, 200); // Lock 200 credits

// During session
monitorSession(sessionId); // Track time, send alerts at 80%, 90%, 100%

// After session
const actual = calculateActualCredits(sessionId);
deductCredits(studentId, actual);
refundCredits(studentId, 200 - actual);
```

### **PHASE 3 (Advanced): Real-time Tracking + Debt**

```javascript
// Allow small deficit with grace period
const MAX_GRACE_DEFICIT = 50; // 30 minutes buffer

if (deficit <= MAX_GRACE_DEFICIT) {
  allowWithDebt(studentId, deficit);
  blockFutureBookings(); // Until debt cleared
} else {
  preventBooking();
}
```

---

## 📊 COMPARISON TABLE

| Approach | Complexity | Student Experience | Risk | Recommended Phase |
|----------|------------|-------------------|------|------------------|
| **Prevent Booking** | Low ⭐ | Fair | None | Phase 1 ✅ |
| **Reserve + Refund** | Medium ⭐⭐ | Good | Low | Phase 2 ✅ |
| **Hourly Blocks** | Low ⭐ | Fair | None | Phase 1 ✅ |
| **Allow Deficit** | High ⭐⭐⭐ | Excellent | High | Phase 3 |
| **Cannot Close** | N/A | N/A | N/A | Not Possible ❌ |
| **Hybrid** | High ⭐⭐⭐ | Excellent | Low | Phase 2-3 ✅ |

---

## 💡 FINAL RECOMMENDATION

### **FOR YOUR SCENARIO:**

**Student has 100 credits, 2-hour session needs 200 credits**

#### **Phase 1 Solution (Launch in 2 weeks):**
```
❌ DO NOT ALLOW BOOKING
✅ Show: "You have 100 credits. Need 100 more."
✅ Options:
   - Add 100 credits (redirect to payment)
   - Book 1-hour session instead (100 credits)
   - Cancel
```

**Why:**
- Simple to code (1-2 hours work)
- No technical complexity
- Clear to students
- No risk to business
- No Google Meet API limitations to worry about

#### **Phase 2 Enhancement (Month 3-4):**
```
✅ Reserve 200 credits at booking
✅ Track actual session duration
✅ Deduct actual usage
✅ Refund if session shorter
✅ 5-minute grace period for overtime
```

**Why:**
- Better UX (flexible)
- Fair to customers
- Handles real-world scenarios (sessions run over/under)

---

## 📝 CODE EXAMPLE FOR PHASE 1

```javascript
// student-booking.html - Frontend

async function handleSessionBooking(duration, creditsPerHour) {
  const requiredCredits = duration * creditsPerHour;

  // Get student credits
  const response = await fetch('/api/student/credits');
  const { credits } = await response.json();

  // Validate
  if (credits < requiredCredits) {
    const shortfall = requiredCredits - credits;
    const maxAffordable = Math.floor(credits / creditsPerHour);

    // Show modal
    showModal({
      title: "⚠️ Insufficient Credits",
      message: `
        You need ${requiredCredits} credits but have ${credits} credits.
        Shortfall: ${shortfall} credits
      `,
      buttons: [
        {
          text: `Add ${shortfall} Credits`,
          action: () => window.location.href = 'payments-purchases.html'
        },
        {
          text: `Book ${maxAffordable}-hour session instead`,
          action: () => updateDuration(maxAffordable)
        },
        {
          text: 'Cancel',
          action: () => closeModal()
        }
      ]
    });

    return false;
  }

  // Proceed with booking
  return true;
}
```

```javascript
// Backend - API endpoint

app.post('/api/sessions/book', async (req, res) => {
  const { studentId, duration, creditsPerHour } = req.body;

  const requiredCredits = duration * creditsPerHour;
  const student = await Student.findById(studentId);

  // HARD VALIDATION
  if (student.credits < requiredCredits) {
    return res.status(400).json({
      error: 'INSUFFICIENT_CREDITS',
      message: 'Not enough credits to book this session',
      required: requiredCredits,
      available: student.credits,
      shortfall: requiredCredits - student.credits
    });
  }

  // Deduct credits immediately
  student.credits -= requiredCredits;
  await student.save();

  // Create session
  const session = await createSession({
    studentId,
    duration,
    creditsCharged: requiredCredits
  });

  res.json({ success: true, session });
});
```

---

## ✅ ACTION ITEMS

**For Phase 1 (This Week):**
- [ ] Add credit validation before booking
- [ ] Show clear error messages
- [ ] Offer "Add Credits" option
- [ ] Suggest shorter session duration
- [ ] Test booking flow with insufficient credits

**For Phase 2 (Month 3):**
- [ ] Implement credit reservation system
- [ ] Track actual session duration
- [ ] Add refund mechanism
- [ ] Send low-credit alerts during session
- [ ] Post-session reconciliation

**Do NOT Attempt:**
- [ ] ❌ Auto-closing Google Meet meetings
- [ ] ❌ Kicking users from meetings
- [ ] ❌ Time-limiting active meetings

**Bottom Line:**
You cannot close a Google Meet meeting via API. Your best approach is to prevent insufficient-credit bookings upfront and handle edge cases gracefully with refunds/grace periods.

