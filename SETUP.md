# BugHuntr Setup Guide

## Firebase Credentials Setup

### For the Flask Document Verification Service

1. **Download Firebase Admin SDK credentials:**
   - Go to your Firebase Console
   - Navigate to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file securely (DO NOT commit to Git)

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Set `FIREBASE_CREDENTIALS_PATH` to the path of your downloaded JSON file
   - Example: `FIREBASE_CREDENTIALS_PATH=./firebase-admin-credentials.json`

3. **Security Notes:**
   - Never commit Firebase credentials to Git
   - Keep the credentials file in a secure location
   - Add the credentials file to `.gitignore`

## Required Environment Variables

```bash
# Firebase Admin SDK (for Python Flask app)
FIREBASE_CREDENTIALS_PATH=./path/to/your/firebase-credentials.json

# TheCompaniesAPI (for document verification)
THECOMPANIESAPI_KEY=your-companies-api-key
```

## Running the Document Verification Service

```bash
# Install Python dependencies
pip install flask flask-cors python-dotenv paddleocr pdf2image python-docx requests bcrypt firebase-admin pillow paddlepaddle

# Run the Flask app
python Doc-Verification.py
```

The service will be available at `http://localhost:8000`

## Web App: Bug Anchoring + Pinata Upload

Create or update your `.env.local` with the following values (do not commit secrets):

```bash
# Pinata (JWT preferred)
PINATA_JWT=your-pinata-jwt

# Blockchain (RPC + signer required to send the transaction)
BLOCKCHAIN_RPC_URL=https://rpc.example
BLOCKCHAIN_PRIVATE_KEY=your-private-key
# Defaults to the provided address if not set
BUG_CONTRACT_ADDRESS=0x7EF2e0048f5bAeDe046f6BF797943daF4ED8CB47
```

- `BLOCKCHAIN_PRIVATE_KEY` must control an account funded for gas on the chosen network.
- The target contract must expose `storeBug(string bugId,string reporter,string ipfsCid)`.