# TraceMail Analyzer - Backend

Backend service for processing and analyzing emails via IMAP or manual raw header submission.  
Built with **NestJS, MongoDB, IMAP, Mailparser**.

---

## 🔧 Setup

### 1. Clone & Install
```bash
git clone <backend-repo-url>
cd backend
npm install
```

### 2. Environment Variables
Create .env file in root:
```bash
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/emaildb
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=analyze.tracemail@gmail.com
IMAP_PASS=<app-password>
TEST_SUBJECT_TOKEN=[CHECK_EMAIL]
PORT=3000
```

### 3. Run
```bash
npm run start:dev
```

---

## 📡 API Routes
```bash
GET /api/emails
```
List all processed emails.

```bash
GET /api/emails/:id
```
Get details of a specific email (ESP info, receiving chain, raw headers).

```bash
POST /api/manual
```
Submit raw email headers for analysis.
```bash
{
  "rawHeader": "Paste full raw header string here..."
}
```

---

## ⚙️ How It Works

- **IMAP Worker:** polls inbox for unseen emails containing the `TEST_SUBJECT_TOKEN` in subject.
- **Parser:** extracts ESP, DKIM/SPF/DMARC, receiving chain from headers.
- **Storage:** saves results to MongoDB for frontend to consume.
