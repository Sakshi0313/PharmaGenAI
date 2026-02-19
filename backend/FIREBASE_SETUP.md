# Firebase Setup Guide

Your Firebase project is already configured! Here's how to complete the backend setup.

## Firebase Project Details
- **Project ID:** pharmagenai-3dc26
- **Auth Domain:** pharmagenai-3dc26.firebaseapp.com

## Getting Firebase Admin SDK Credentials

### Step 1: Go to Firebase Console
1. Visit https://console.firebase.google.com/
2. Select your project: **pharmagenai-3dc26**

### Step 2: Generate Service Account Key
1. Click the **gear icon** (⚙️) next to "Project Overview"
2. Select **Project settings**
3. Go to the **Service accounts** tab
4. Click **Generate new private key**
5. Click **Generate key** in the confirmation dialog
6. A JSON file will be downloaded (e.g., `pharmagenai-3dc26-firebase-adminsdk-xxxxx.json`)

### Step 3: Configure Backend

**Option A: Use Service Account File (Recommended)**

1. Save the downloaded JSON file to `backend/` directory
2. Rename it to `firebase-service-account.json`
3. Update `.env`:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

**Option B: Use Individual Credentials**

1. Open the downloaded JSON file
2. Copy the values to `.env`:
```env
FIREBASE_PROJECT_ID=pharmagenai-3dc26
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@pharmagenai-3dc26.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Step 4: Enable Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (or test mode for development)
4. Select a location (e.g., us-central)
5. Click **Enable**

### Step 5: Set Firestore Rules (Optional)

For development, you can use these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /analyses/{document=**} {
      allow read, write: if true; // Change this for production!
    }
  }
}
```

For production, implement proper authentication rules.

## Firestore Collections

The backend will automatically create these collections:

### `analyses` Collection
Stores all pharmacogenomic analysis results.

**Document Structure:**
```json
{
  "patient_id": "PATIENT_001",
  "drug": "CODEINE",
  "timestamp": "2026-02-19T10:30:00Z",
  "risk_assessment": {
    "risk_label": "Adjust Dosage",
    "confidence_score": 0.87,
    "severity": "moderate"
  },
  "pharmacogenomic_profile": { ... },
  "clinical_recommendation": { ... },
  "llm_generated_explanation": { ... },
  "quality_metrics": { ... },
  "created_at": "2026-02-19T10:30:00Z",
  "updated_at": "2026-02-19T10:30:00Z"
}
```

## Testing Firebase Connection

After configuration, test the connection:

```bash
cd backend
npm run dev
```

You should see:
```
✅ Firebase initialized successfully
```

If you see warnings about Firebase not being configured, check your `.env` file.

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `firebase-service-account.json` to Git
- Never commit `.env` with real credentials
- The service account key has admin access - keep it secure
- Use environment variables in production
- Implement proper Firestore security rules before going live

## Troubleshooting

### "Firebase credentials not configured"
- Check that `.env` file exists in `backend/` directory
- Verify credentials are correct
- Make sure there are no extra spaces in `.env`

### "Permission denied" errors
- Check Firestore security rules
- Verify service account has proper permissions
- Ensure Firestore is enabled in Firebase Console

### "Invalid private key"
- Make sure private key includes `\n` characters
- Wrap private key in quotes in `.env`
- Use double quotes, not single quotes

## Frontend Configuration

The frontend is already configured with your Firebase credentials in:
`src/config/firebase.ts`

No additional setup needed for the frontend!

## What's Working Now

✅ **Backend:**
- Real VCF file parsing
- Pharmacogenomic variant analysis
- Genotype/phenotype determination
- Risk assessment (CPIC guidelines)
- LLM explanations (Google Gemini)
- Firebase storage (once configured)

✅ **Frontend:**
- VCF file upload
- Multi-drug selection
- Real-time analysis
- Results visualization
- Firebase integration ready

## Next Steps

1. Get Firebase Admin SDK credentials (follow steps above)
2. Configure `.env` with credentials
3. Restart backend server
4. Test with sample VCF file
5. View results in Firebase Console

Your application will work without Firebase (results won't be saved), but with Firebase you get:
- Persistent patient history
- Analysis result storage
- Statistics and analytics
- Multi-user support (future)
