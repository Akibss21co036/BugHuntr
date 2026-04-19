# BugHuntr

BugHuntr is a comprehensive platform designed to connect security researchers, developers, and companies in a collaborative bug bounty ecosystem. It provides tools for companies to host bug hunts, and for hunters to find vulnerabilities, submit reports, and get rewarded for their findings.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://bughuntr.vercel.app/)

## ✨ Features

-   **User Authentication:** Secure sign-up and login for researchers and company representatives.
-   **Company & Researcher Profiles:** Dedicated profiles to showcase statistics, achievements, and activity.
-   **Bug Hunt Marketplace:** Browse and participate in active bug bounty programs.
-   **Secure Bug Submission:** A structured process for submitting vulnerability reports with details and evidence.
-   **Leaderboard & Rankings:** Gamified leaderboards to recognize top security researchers.
-   **Community Collaboration:** Real-time bug-thread collaboration with channels, comments, solutions, and reputation.
-   **Dashboard:** Personalized dashboards for users to track their submissions, rewards, and stats.
-   **AI Assistant:** An integrated chatbot to help users navigate the platform.

## 🛠️ Tech Stack

-   **Frontend:** Next.js (React), TypeScript, Tailwind CSS
-   **Backend:**
    -   Next.js API Routes (Node.js)
    -   Python (Flask) for document verification services.
-   **Database & Services:** Firebase (Authentication, Firestore, Storage)
-   **UI Components:** shadcn/ui, Radix UI

## 🚀 Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [Python](https://www.python.org/) (v3.8 or later)
-   [pnpm](https://pnpm.io/installation)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/BugHuntr.git
cd BugHuntr
```

### 2. Frontend Setup (Next.js)

```bash
# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

### 3. Backend Setup (Python)

The Python backend handles specific services like document verification.

#### Firebase Credentials

1.  Go to your Firebase Console -> Project Settings -> Service Accounts.
2.  Click "Generate new private key" and save the JSON file in the project root.
3.  **Important:** Add the name of this credentials file to your `.gitignore` to prevent it from being committed.

#### Environment Variables

Create a `.env` file in the root directory and add the path to your Firebase credentials. See `SETUP.md` for more details.

```.env
FIREBASE_CREDENTIALS_PATH=./path-to-your-firebase-credentials.json
```

#### Installation & Running

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the document verification service
python Doc-Verification.py
```

The Python service will run on `http://localhost:8000`.

## 📜 Available Scripts

The following scripts are available in the `package.json`:

-   `pnpm dev`: Starts the Next.js development server.
-   `pnpm build`: Builds the application for production.
-   `pnpm start`: Starts a production server.
-   `pnpm lint`: Runs the Next.js linter.

## 📂 Project Structure

```
.
├── app/                  # Next.js 13 app router pages and API routes
├── components/           # Shared React components
├── lib/                  # Helper functions and utilities
├── public/               # Static assets (images, fonts, etc.)
├── styles/               # Global styles
├── requirements.txt      # Python dependencies
├── Doc-Verification.py   # Python Flask service for document verification
└── ...
```