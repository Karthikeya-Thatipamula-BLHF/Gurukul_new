# 🗄️ External Services Setup Guide

This guide helps you set up the required external services for your Gurukul platform deployment.

## 🍃 MongoDB Atlas Setup (Free Tier)

### Step 1: Create Account & Cluster
1. **Sign up**: Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. **Create Organization**: Name it "Gurukul Platform"
3. **Create Project**: Name it "Gurukul Production"
4. **Build Database**:
   - Choose "Shared" (Free)
   - Provider: AWS
   - Region: us-east-1 (N. Virginia)
   - Cluster Name: `gurukul-cluster`

### Step 2: Configure Security
1. **Database Access**:
   ```
   Username: gurukul_user
   Password: [Generate strong password - save this!]
   Database User Privileges: Read and write to any database
   ```

2. **Network Access**:
   ```
   IP Address: 0.0.0.0/0
   Comment: Allow access from anywhere (for Render deployment)
   ```

### Step 3: Get Connection String
1. **Connect to Cluster**:
   - Click "Connect" → "Connect your application"
   - Driver: Python, Version: 3.6 or later
   - Copy connection string:
   ```
   mongodb+srv://gurukul_user:<password>@gurukul-cluster.xxxxx.mongodb.net/gurukul?retryWrites=true&w=majority
   ```

### Step 4: Initialize Database
```javascript
// Connect to your cluster and run these commands in MongoDB Compass or Shell:

// Create database
use gurukul

// Create collections
db.createCollection("users")
db.createCollection("lessons")
db.createCollection("memory_sessions")
db.createCollection("financial_data")
db.createCollection("chat_history")

// Create indexes for better performance
db.users.createIndex({ "user_id": 1 })
db.lessons.createIndex({ "subject": 1, "topic": 1 })
db.memory_sessions.createIndex({ "user_id": 1, "timestamp": -1 })
db.chat_history.createIndex({ "user_id": 1, "timestamp": -1 })
```

## 🔴 Redis Cloud Setup (Free Tier)

### Step 1: Create Account & Database
1. **Sign up**: Go to [Redis Cloud](https://redis.com/redis-enterprise-cloud/)
2. **Create Subscription**:
   - Plan: Fixed (Free 30MB)
   - Cloud Provider: AWS
   - Region: us-east-1
   - Subscription Name: "Gurukul Cache"

### Step 2: Create Database
1. **New Database**:
   ```
   Database Name: gurukul-cache
   Protocol: Redis Stack
   Memory Limit: 30MB
   Throughput: 30 ops/sec
   ```

### Step 3: Get Connection Details
1. **Configuration Tab**:
   ```
   Endpoint: redis-xxxxx.c1.us-east-1-2.ec2.cloud.redislabs.com
   Port: 12345
   Password: [Copy the password]
   ```

2. **Connection String Format**:
   ```
   redis://default:<password>@<endpoint>:<port>
   ```

## 🔑 API Keys Setup

### Groq API Key
1. **Sign up**: Go to [Groq Console](https://console.groq.com)
2. **Create API Key**:
   - Name: "Gurukul Production"
   - Copy the key (starts with `gsk_...`)

### OpenAI API Key
1. **Sign up**: Go to [OpenAI Platform](https://platform.openai.com)
2. **Create API Key**:
   - Go to API Keys section
   - Create new secret key
   - Name: "Gurukul Production"
   - Copy the key (starts with `sk-...`)

### Google AI API Key
1. **Sign up**: Go to [Google AI Studio](https://makersuite.google.com)
2. **Create API Key**:
   - Click "Get API Key"
   - Create new key
   - Copy the key

## 📝 Environment Variables Checklist

### For Render (Backend)
```env
# Database
MONGODB_URL=mongodb+srv://gurukul_user:<password>@gurukul-cluster.xxxxx.mongodb.net/gurukul?retryWrites=true&w=majority
REDIS_URL=redis://default:<password>@<endpoint>:<port>

# API Keys
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# App Config
PORT=10000
HOST=0.0.0.0
ENVIRONMENT=production
DEBUG=false
```

### For Vercel (Frontend)
```env
# API URLs (replace with your actual Render URL)
VITE_BASE_API_URL=https://gurukul-backend-xxxx.onrender.com/api/v1/base
VITE_CHAT_API_URL=https://gurukul-backend-xxxx.onrender.com/api/v1/base
VITE_FINANCIAL_API_URL=https://gurukul-backend-xxxx.onrender.com/api/v1/financial
VITE_MEMORY_API_URL=https://gurukul-backend-xxxx.onrender.com/api/v1/memory
VITE_AKASH_API_URL=https://gurukul-backend-xxxx.onrender.com/api/v1/akash
VITE_SUBJECT_API_URL=https://gurukul-backend-xxxx.onrender.com/api/v1/subjects
VITE_KARTHIKEYA_API_URL=https://gurukul-backend-xxxx.onrender.com/api/v1/base
VITE_TTS_API_URL=https://gurukul-backend-xxxx.onrender.com/api/v1/tts

# App Config
VITE_APP_NAME=Gurukul Learning Platform
VITE_ENVIRONMENT=production
```

## 🧪 Testing Connections

### Test MongoDB Connection
```python
# test_mongodb.py
from pymongo import MongoClient
import os

# Replace with your connection string
MONGODB_URL = "mongodb+srv://gurukul_user:<password>@gurukul-cluster.xxxxx.mongodb.net/gurukul?retryWrites=true&w=majority"

try:
    client = MongoClient(MONGODB_URL)
    db = client.gurukul
    
    # Test connection
    client.admin.command('ping')
    print("✅ MongoDB connection successful!")
    
    # Test database operations
    test_doc = {"test": "connection", "timestamp": "2024-01-01"}
    result = db.test_collection.insert_one(test_doc)
    print(f"✅ Document inserted with ID: {result.inserted_id}")
    
    # Clean up
    db.test_collection.delete_one({"_id": result.inserted_id})
    print("✅ Test document cleaned up")
    
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
```

### Test Redis Connection
```python
# test_redis.py
import redis
import os

# Replace with your connection details
REDIS_URL = "redis://default:<password>@<endpoint>:<port>"

try:
    r = redis.from_url(REDIS_URL)
    
    # Test connection
    r.ping()
    print("✅ Redis connection successful!")
    
    # Test operations
    r.set("test_key", "test_value")
    value = r.get("test_key")
    print(f"✅ Redis test value: {value.decode()}")
    
    # Clean up
    r.delete("test_key")
    print("✅ Test key cleaned up")
    
except Exception as e:
    print(f"❌ Redis connection failed: {e}")
```

## 🔒 Security Best Practices

1. **MongoDB Atlas**:
   - Use strong passwords
   - Regularly rotate credentials
   - Monitor access logs
   - Enable backup

2. **Redis Cloud**:
   - Use strong passwords
   - Enable SSL/TLS
   - Monitor memory usage
   - Set up alerts

3. **API Keys**:
   - Store securely in environment variables
   - Never commit to version control
   - Regularly rotate keys
   - Monitor usage and billing

## 📊 Monitoring & Alerts

### MongoDB Atlas
- Set up alerts for connection spikes
- Monitor storage usage
- Enable performance advisor

### Redis Cloud
- Set up memory usage alerts
- Monitor connection count
- Track operation latency

## ✅ Completion Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] Database user created with proper permissions
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string obtained and tested
- [ ] Redis Cloud database created
- [ ] Redis connection details obtained and tested
- [ ] All API keys obtained (Groq, OpenAI, Google)
- [ ] Environment variables documented
- [ ] Connection tests passed
- [ ] Security settings reviewed

## 🎯 Next Steps

After completing this setup:
1. Use the connection strings in your Render deployment
2. Set environment variables in both Render and Vercel
3. Deploy your backend and frontend
4. Test the full application flow

Your external services are now ready for production deployment! 🚀
