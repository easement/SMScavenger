# 📱 Scavenger Hunt App

A lightweight, text-based scavenger hunt game using Twilio. Players receive clues one at a time via SMS, submit answers, and receive immediate feedback. The app supports hints, enforces clue order, and offers an on-demand, low-friction game experience—no sign-up required.

---

## 🎯 Features

- 📩 **Text-Based Gameplay** (via Twilio SMS)
- 🧩 **Clue Types**: Text, images, and riddles
- 🔐 **No Accounts Required**: Play using just a phone number
- 🕰️ **On-Demand**: No time limits or reminders
- ❓ **Hints**: One hint per clue, available after two incorrect attempts
- ✅ **Immediate Feedback**: Know instantly if you're right or wrong
- 🧵 **Sequential Clues**: Must solve each clue before proceeding
- 🎉 **Completion Confirmation**: Final message upon game finish

---

## 🧠 Game Flow

1. **Start Game**  
   User texts a keyword (e.g., `START`) to a Twilio number.

2. **Receive Clue**  
   System sends the first clue via SMS (text, image, or riddle).

3. **Submit Answer**  
   User replies with their answer.

4. **Evaluate Response**  
   - ✅ If correct: Send confirmation and next clue.
   - ❌ If incorrect:
     - After 2 incorrect answers, prompt user:  
       - Reply `1` for a hint  
       - Reply `2` to keep trying
     - Only one hint per clue is allowed.

5. **Repeat** until final clue is answered correctly.

6. **Game Completion**  
   User receives a congratulatory message indicating they’ve finished the hunt.

---

## 📦 Architecture Overview

- **Platform**: Node.js or Python (Express or Flask)
- **Messaging**: Twilio SMS API
- **Database**: Firebase or MongoDB
- **Session ID**: Player phone number

### Data Models

#### `Clue`
```json
{
  "id": 1,
  "type": "text | image | riddle",
  "content": "Clue text or URL",
  "answer": "correct_answer",
  "hint": "hint text"
}
```

#### `PlayerSession`
```json
{
  "phone_number": "+15555555555",
  "current_clue_index": 2,
  "incorrect_attempts": 1,
  "hint_used": false
}
```

---

## 🚨 Error Handling

- 🧪 **Invalid Inputs**: Inform user and ask them to try again.
- 🧠 **Premature Hint Requests**: Explain that hints unlock after two wrong tries.
- 📡 **Message Failures**: Log and retry via Twilio.
- 💤 **Inactivity**: No automated reminders (fully on-demand experience).

---

## 🧪 Testing Plan

### Unit Tests
- Answer checking
- Hint eligibility logic
- Twilio messaging logic
- Sequential clue enforcement

### Integration Tests
- Full game simulation
- Edge case handling (e.g., out-of-order replies, unexpected inputs)

### Load Testing
- Simulate multiple concurrent sessions
- Stress test Twilio webhook processing

### UAT (User Acceptance Testing)
- Real player feedback on clarity, fun, and flow
- Adjust difficulty and wording of clues/hints

---

## 🚀 Getting Started

1. Clone the repo
2. Set up your environment:
   - Twilio credentials
   - Database connection
3. Deploy the webhook
4. Add clues to your database
5. Point your Twilio number’s webhook to your server
6. Text `START` to begin!

---

## 🔐 Security Notes

- No sensitive data is stored
- Use HTTPS endpoints for webhooks
- Secure API keys using environment variables

---

## 🛠️ Tech Stack

- [Twilio SMS](https://www.twilio.com/sms)
- [Node.js](https://nodejs.org/) / [Flask](https://flask.palletsprojects.com/)
- [MongoDB](https://www.mongodb.com/) / [Firebase](https://firebase.google.com/)

---

## 📬 Contact

Have questions or want to contribute? Open an issue or contact the creator!
