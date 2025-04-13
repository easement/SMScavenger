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
   User receives a congratulatory message indicating they've finished the hunt.

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
5. Point your Twilio number's webhook to your server
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

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- A Twilio account with:
  - Account SID
  - Auth Token
  - Phone Number

## Setup

1. Clone the repository:
```bash
git clone https://github.com/easement/SMScavenger.git
cd SMScavenger
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
DB_PATH=./data/game.db
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
ADMIN_API_KEY=your_admin_api_key
```

5. Create the data directory:
```bash
mkdir -p data
```

## Development

Start the development server with hot reload:
```bash
npm run dev
```

The server will run on `http://localhost:3000` by default.

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Production Build

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Endpoints

### Admin API
All admin endpoints require the `x-api-key` header with your `ADMIN_API_KEY`.

- `GET /admin/clues` - List all clues
- `POST /admin/clues` - Create a new clue
- `GET /admin/sessions` - List all active sessions
- `GET /admin/stats` - Get game statistics

### Webhook
- `POST /webhook` - Twilio SMS webhook endpoint

## Local Development with Twilio

1. Install ngrok:
```bash
npm install -g ngrok
```

2. Start your development server:
```bash
npm run dev
```

3. In a new terminal, start ngrok:
```bash
ngrok http 3000
```

4. Update your Twilio webhook URL to your ngrok URL:
```
https://your-ngrok-url/webhook
```

5. Update your `BASE_URL` in `.env` to match your ngrok URL.

## Code Quality

Run linting:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

Format code:
```bash
npm run format
```

## Load Testing

Run load tests:
```bash
npm run test:load
```

Run load tests for specific environment:
```bash
npm run test:load:dev  # Development
npm run test:load:prod # Production
```

Generate load test report:
```bash
npm run test:load:report
```
