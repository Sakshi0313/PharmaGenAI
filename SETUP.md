# PharmaGenAI - Complete Setup Guide

Complete pharmacogenomics risk assessment platform with VCF analysis and AI-powered clinical explanations.

## 🎯 What's Included

### Frontend (React + TypeScript)
- Modern UI with shadcn/ui components
- VCF file upload with drag & drop
- Multi-drug analysis interface
- Interactive results visualization
- Patient history tracking
- Real-time analysis status

### Backend (Node.js + TypeScript)
- VCF file parsing (v4.2 standard)
- Pharmacogenomic variant analysis
- Genotype/phenotype determination
- CPIC guideline-based risk assessment
- OpenAI-powered clinical explanations
- RESTful API with validation

## 📋 Prerequisites

- Node.js 18+ and npm
- OpenAI API key (for LLM explanations)
- 5GB free disk space

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Navigate to project
cd PharmaGenAI-main

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Configure Backend

```bash
cd backend

# Create environment file
cp .env.example .env

# Edit .env and add your Gemini API key
# Required: GEMINI_API_KEY=AIzaSy...
# Optional: Adjust PORT, CORS_ORIGIN, etc.
```

**Minimum .env configuration:**
```env
PORT=3001
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
CORS_ORIGIN=http://localhost:8080
```

### 3. Start Backend Server

```bash
# From backend directory
npm run dev
```

You should see:
```
🚀 Server running on port 3001
📊 Environment: development
🔗 CORS enabled for: http://localhost:8080
✅ Gemini API key configured
```

### 4. Start Frontend

```bash
# From project root (new terminal)
npm run dev
```

Frontend will be available at: `http://localhost:8080`

### 5. Test the Application

1. Open `http://localhost:8080` in your browser
2. Navigate to Dashboard
3. Upload the sample VCF file: `backend/test-data/sample.vcf`
4. Select drugs: Codeine, Warfarin, Clopidogrel
5. Click "Analyze Pharmacogenomic Risk"
6. View results with AI-generated explanations

## 📁 Project Structure

```
PharmaGenAI-main/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── data/              # Variant & rule databases
│   │   ├── middleware/        # Express middleware
│   │   ├── parsers/           # VCF parser
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utilities
│   │   └── server.ts          # Express server
│   ├── test-data/             # Sample VCF files
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── src/                        # Frontend React app
│   ├── components/            # UI components
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilities
│   ├── pages/                 # Page components
│   ├── services/              # API client
│   └── types/                 # TypeScript types
│
├── public/                     # Static assets
├── package.json
└── vite.config.ts
```

## 🧬 Supported Pharmacogenomics

### Genes Analyzed
- **CYP2D6** - Drug metabolism enzyme
- **CYP2C19** - Drug metabolism enzyme
- **CYP2C9** - Drug metabolism enzyme
- **SLCO1B1** - Drug transporter
- **TPMT** - Thiopurine metabolism
- **DPYD** - Fluoropyrimidine metabolism

### Supported Drugs
- **Codeine** - Pain management
- **Clopidogrel** - Antiplatelet therapy
- **Warfarin** - Anticoagulation
- **Simvastatin** - Cholesterol management
- **Azathioprine** - Immunosuppression
- **Fluorouracil** - Chemotherapy

### Risk Classifications
- **Safe** - Standard dosing recommended
- **Adjust Dosage** - Dose modification needed
- **Toxic** - High risk of adverse effects
- **Ineffective** - Reduced efficacy expected
- **Unknown** - Insufficient data

## 🔧 Configuration

### Frontend Environment Variables

Create `.env` in project root:

```env
VITE_API_URL=http://localhost:3001
```

### Backend Environment Variables

See `backend/.env.example` for all options:

```env
# Server
PORT=3001
NODE_ENV=development

# Google Gemini (Required for LLM explanations)
GEMINI_API_KEY=your-gemini-key-here
GEMINI_MODEL=gemini-1.5-flash

# CORS
CORS_ORIGIN=http://localhost:8080

# File Upload
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:3001/api/analysis/health

# Get supported drugs
curl http://localhost:3001/api/analysis/supported-drugs

# Analyze VCF file
curl -X POST http://localhost:3001/api/analysis/analyze \
  -F "vcfFile=@backend/test-data/sample.vcf" \
  -F "drugs=CODEINE,WARFARIN"
```

### Sample VCF File

Use `backend/test-data/sample.vcf` for testing. It contains:
- 10 pharmacogenomic variants
- Variants across all 6 supported genes
- Proper VCF v4.2 format
- Quality scores and genotypes

## 📊 API Documentation

### Analyze VCF

**POST** `/api/analysis/analyze`

```bash
curl -X POST http://localhost:3001/api/analysis/analyze \
  -F "vcfFile=@path/to/file.vcf" \
  -F "drugs=CODEINE,WARFARIN" \
  -F "patientId=PATIENT_001"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "patient_id": "PATIENT_001",
      "drug": "CODEINE",
      "risk_assessment": {
        "risk_label": "Adjust Dosage",
        "confidence_score": 0.87,
        "severity": "moderate"
      },
      "pharmacogenomic_profile": {
        "primary_gene": "CYP2D6",
        "diplotype": "*1/*4",
        "phenotype": "IM",
        "detected_variants": [...]
      },
      "clinical_recommendation": {
        "cpic_guideline_reference": "CPIC Guideline...",
        "recommended_action": "Reduce dose by 50%...",
        "alternative_drugs": ["Morphine", ...]
      },
      "llm_generated_explanation": {
        "summary": "...",
        "biological_mechanism": "...",
        "variant_interpretation": "...",
        "clinical_impact": "..."
      }
    }
  ]
}
```

See `backend/README.md` for complete API documentation.

## 🏗️ Production Deployment

### Backend

```bash
cd backend

# Build
npm run build

# Start production server
NODE_ENV=production npm start
```

### Frontend

```bash
# Build for production
npm run build

# Preview build
npm run preview

# Deploy dist/ folder to hosting service
```

### Environment Setup

1. Set production environment variables
2. Configure CORS for production domain
3. Set up SSL/TLS certificates
4. Configure rate limiting
5. Set up log rotation
6. Use process manager (PM2, systemd)

## 🔒 Security Considerations

- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation (Zod)
- ✅ File size limits
- ✅ Error sanitization
- ✅ No sensitive data in logs

## 🐛 Troubleshooting

### Backend won't start
- Check OpenAI API key is set
- Verify port 3001 is available
- Check Node.js version (18+)
- Review logs in `backend/logs/`

### Frontend can't connect to backend
- Verify backend is running on port 3001
- Check CORS_ORIGIN in backend .env
- Check VITE_API_URL in frontend .env
- Clear browser cache

### VCF parsing errors
- Ensure VCF is v4.2 format
- Check file has proper headers
- Verify file size < 5MB
- Use sample.vcf for testing

### LLM explanations not generating
- Verify GEMINI_API_KEY is valid
- Check Google AI Studio quota
- Review backend logs for errors
- Fallback explanations will be used if LLM fails

## 📚 Additional Resources

- [CPIC Guidelines](https://cpicpgx.org/)
- [PharmGKB Database](https://www.pharmgkb.org/)
- [VCF Format Specification](https://samtools.github.io/hts-specs/VCFv4.2.pdf)
- [Google Gemini API Documentation](https://ai.google.dev/docs)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues or questions:
1. Check troubleshooting section
2. Review backend logs
3. Test with sample VCF file
4. Check API health endpoint

---

**Built with:** React, TypeScript, Node.js, Express, Google Gemini, shadcn/ui, Tailwind CSS
