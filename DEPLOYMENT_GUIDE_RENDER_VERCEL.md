# 🚀 Complete Deployment Guide: Render + Vercel

This guide will walk you through deploying your Gurukul Learning Platform with:
- **Backend**: Deployed on Render (with MongoDB Atlas & Redis Cloud)
- **Frontend**: Deployed on Vercel

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Accounts**: 
   - [Render Account](https://render.com) (Free tier available)
   - [Vercel Account](https://vercel.com) (Free tier available)
   - [MongoDB Atlas Account](https://cloud.mongodb.com) (Free tier available)
   - [Redis Cloud Account](https://redis.com/redis-enterprise-cloud/) (Free tier available)

## 🗄️ Phase 1: Set Up External Databases

### MongoDB Atlas Setup

1. **Create MongoDB Atlas Cluster**:
   ```bash
   # Go to https://cloud.mongodb.com
   # Click "Build a Database" → "Shared" (Free)
   # Choose AWS, Region: us-east-1
   # Cluster Name: gurukul-cluster
   ```

2. **Configure Database Access**:
   ```bash
   # Database Access → Add New Database User
   # Username: gurukul_user
   # Password: [Generate secure password]
   # Database User Privileges: Read and write to any database
   ```

3. **Configure Network Access**:
   ```bash
   # Network Access → Add IP Address
   # Add: 0.0.0.0/0 (Allow access from anywhere)
   # Note: For production, restrict to specific IPs
   ```

4. **Get Connection String**:
   ```bash
   # Clusters → Connect → Connect your application
   # Copy connection string (looks like):
   # mongodb+srv://gurukul_user:<password>@gurukul-cluster.xxxxx.mongodb.net/gurukul?retryWrites=true&w=majority
   ```

### Redis Cloud Setup

1. **Create Redis Database**:
   ```bash
   # Go to https://redis.com/redis-enterprise-cloud/
   # Create account → New subscription
   # Choose "Fixed" plan (Free 30MB)
   # Cloud: AWS, Region: us-east-1
   ```

2. **Get Redis Connection Details**:
   ```bash
   # Database → Configuration
   # Copy: Endpoint, Port, Password
   # Connection string format:
   # redis://default:<password>@<endpoint>:<port>
   ```

## 🖥️ Phase 2: Deploy Backend to Render

### Step 1: Prepare Repository

1. **Ensure files are in place**:
   ```bash
   # Check these files exist:
   Backend/main.py                    # ✅ Created
   Backend/requirements-production.txt # ✅ Created
   Backend/Dockerfile.render          # ✅ Created
   render.yaml                        # ✅ Created
   ```

2. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

### Step 2: Deploy on Render

1. **Connect Repository**:
   ```bash
   # Go to https://render.com
   # Dashboard → New → Web Service
   # Connect your GitHub repository
   # Select your repository
   ```

2. **Configure Service**:
   ```bash
   # Name: gurukul-backend
   # Environment: Python 3
   # Region: Oregon (US West)
   # Branch: main
   # Root Directory: Backend
   # Build Command: pip install -r requirements-production.txt
   # Start Command: python main.py
   ```

3. **Set Environment Variables**:
   ```bash
   # In Render dashboard → Environment
   # Add these variables:
   
   PORT=10000
   HOST=0.0.0.0
   ENVIRONMENT=production
   DEBUG=false
   
   # Database URLs (from Phase 1)
   MONGODB_URL=mongodb+srv://gurukul_user:<password>@gurukul-cluster.xxxxx.mongodb.net/gurukul?retryWrites=true&w=majority
   REDIS_URL=redis://default:<password>@<endpoint>:<port>
   
   # API Keys (get from respective providers)
   GROQ_API_KEY=your_groq_api_key
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_API_KEY=your_google_api_key
   ```

4. **Deploy**:
   ```bash
   # Click "Create Web Service"
   # Wait for deployment (5-10 minutes)
   # Note your backend URL: https://gurukul-backend-xxxx.onrender.com
   ```

## 🌐 Phase 3: Deploy Frontend to Vercel

### Step 1: Prepare Frontend

1. **Update API URLs** (if needed):
   ```bash
   # The frontend is already configured with environment variables
   # We'll set these in Vercel dashboard
   ```

### Step 2: Deploy on Vercel

1. **Connect Repository**:
   ```bash
   # Go to https://vercel.com
   # Dashboard → New Project
   # Import from GitHub
   # Select your repository
   ```

2. **Configure Project**:
   ```bash
   # Project Name: gurukul-frontend
   # Framework Preset: Vite
   # Root Directory: new frontend
   # Build Command: npm run build (auto-detected)
   # Output Directory: dist (auto-detected)
   ```

3. **Set Environment Variables**:
   ```bash
   # In Vercel → Settings → Environment Variables
   # Add these (replace with your actual Render backend URL):
   
   VITE_BASE_API_URL=https://gurukul-backend-xxxx.onrender.com/api/v1/base
   VITE_CHAT_API_URL=https://gurukul-backend-xxxx.onrender.com/api/v1/base
   VITE_FINANCIAL_API_URL=https://gurukul-backend-xxxx.onrender.com/api/v1/financial
   VITE_MEMORY_API_URL=https://gurukul-backend-xxxx.onrender.com/api/v1/memory
   VITE_AKASH_API_URL=https://gurukul-backend-xxxx.onrender.com/api/v1/akash
   VITE_SUBJECT_API_URL=https://gurukul-backend-xxxx.onrender.com/api/v1/subjects
   VITE_KARTHIKEYA_API_URL=https://gurukul-backend-xxxx.onrender.com/api/v1/base
   VITE_TTS_API_URL=https://gurukul-backend-xxxx.onrender.com/api/v1/tts
   
   VITE_APP_NAME=Gurukul Learning Platform
   VITE_ENVIRONMENT=production
   ```

4. **Deploy**:
   ```bash
   # Click "Deploy"
   # Wait for deployment (2-5 minutes)
   # Note your frontend URL: https://gurukul-frontend-xxxx.vercel.app
   ```

## ✅ Phase 4: Verification & Testing

### Test Backend

1. **Health Check**:
   ```bash
   curl https://gurukul-backend-xxxx.onrender.com/health
   # Should return: {"status": "healthy", "message": "All services operational"}
   ```

2. **API Documentation**:
   ```bash
   # Visit: https://gurukul-backend-xxxx.onrender.com/docs
   # Should show FastAPI documentation
   ```

### Test Frontend

1. **Access Application**:
   ```bash
   # Visit: https://gurukul-frontend-xxxx.vercel.app
   # Should load the Gurukul Learning Platform
   ```

2. **Test API Connectivity**:
   ```bash
   # Open browser developer tools
   # Check Network tab for API calls
   # Verify no CORS errors
   ```

## 🔧 Troubleshooting

### Common Backend Issues

1. **Build Failures**:
   ```bash
   # Check Render logs for specific errors
   # Common fixes:
   # - Update requirements-production.txt
   # - Check Python version compatibility
   # - Verify file paths in main.py
   ```

2. **Database Connection Issues**:
   ```bash
   # Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
   # Check connection string format
   # Ensure database user has correct permissions
   ```

### Common Frontend Issues

1. **Build Failures**:
   ```bash
   # Check Vercel build logs
   # Common fixes:
   # - Update Node.js version in Vercel settings
   # - Check package.json dependencies
   # - Verify environment variables
   ```

2. **API Connection Issues**:
   ```bash
   # Verify backend URL is correct in environment variables
   # Check CORS configuration in backend
   # Ensure backend is running and accessible
   ```

## 📊 Monitoring & Maintenance

### Render Monitoring
- Check service logs in Render dashboard
- Monitor resource usage
- Set up health check alerts

### Vercel Monitoring
- Monitor deployment status
- Check function logs
- Review performance metrics

## 🎉 Success!

Your Gurukul Learning Platform is now deployed:
- **Backend**: https://gurukul-backend-xxxx.onrender.com
- **Frontend**: https://gurukul-frontend-xxxx.vercel.app
- **Database**: MongoDB Atlas + Redis Cloud

## 🚀 Quick Deployment Commands

### For Future Updates

**Backend Updates**:
```bash
# Make changes to backend code
git add Backend/
git commit -m "Update backend"
git push origin main
# Render will auto-deploy
```

**Frontend Updates**:
```bash
# Make changes to frontend code
git add "new frontend/"
git commit -m "Update frontend"
git push origin main
# Vercel will auto-deploy
```

### Environment Variables Quick Reference

**Backend (Render)**:
```env
PORT=10000
MONGODB_URL=mongodb+srv://...
REDIS_URL=redis://...
GROQ_API_KEY=...
OPENAI_API_KEY=...
GOOGLE_API_KEY=...
```

**Frontend (Vercel)**:
```env
VITE_BASE_API_URL=https://your-backend.onrender.com/api/v1/base
VITE_FINANCIAL_API_URL=https://your-backend.onrender.com/api/v1/financial
VITE_MEMORY_API_URL=https://your-backend.onrender.com/api/v1/memory
# ... (other API URLs)
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review deployment logs in respective dashboards
3. Verify all environment variables are set correctly
4. Test API endpoints individually using the /docs interface
