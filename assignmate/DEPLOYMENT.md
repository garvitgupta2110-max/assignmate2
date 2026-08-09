# ResuMate - Comprehensive Deployment Guide

## Pre-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] Database backups created
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] SSL certificates obtained
- [ ] Domain configured
- [ ] CI/CD pipeline setup
- [ ] Error logging configured
- [ ] Monitoring setup complete
- [ ] Backup and disaster recovery plan in place

## Production Environment Variables

### Frontend (.env.production)
```
NEXT_PUBLIC_API_URL=https://api.resumate.app
NEXT_PUBLIC_APP_URL=https://resumate.app
NEXTAUTH_SECRET=generate-a-secure-random-key
NEXTAUTH_URL=https://resumate.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
NEXT_PUBLIC_GEMINI_API_KEY=your_production_gemini_api_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

### Backend (.env.production)
```
PORT=5000
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=generate-a-secure-random-key
JWT_EXPIRY=7d
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
GEMINI_API_KEY=your_production_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
FRONTEND_URL=https://resumate.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Deploying to Vercel (Frontend)

1. **Connect GitHub repository**
   - Go to vercel.com
   - Click "New Project"
   - Select your GitHub repository
   - Click "Import"

2. **Configure Project**
   - Set Project Name: `resumate`
   - Set Root Directory: `./frontend`
   - Set Build Command: `npm run build`
   - Set Start Command: `npm start`

3. **Add Environment Variables**
   - Go to Settings → Environment Variables
   - Add all variables from `.env.production`

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Access your app at the Vercel URL

## Deploying to Render (Backend & Frontend)

### Option 1: Using render.yaml (Recommended for Monorepo)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

2. **Create Render Account**
   - Go to render.com
   - Sign up with GitHub
   - Grant permissions

3. **Deploy from Dashboard**
   - Click "New +"
   - Select "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml`
   - Confirm the configuration
   - Click "Deploy"

4. **Add Environment Variables**
   - For each service, go to Settings → Environment
   - Add variables from `.env.production` sections

### Option 2: Manual Backend Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

2. **Create Render Account**
   - Go to render.com
   - Sign up with GitHub
   - Grant permissions

3. **Create New Web Service**
   - Click "New +"
   - Select "Web Service"
   - Connect GitHub repository
   - Set Root Directory: `backend`

4. **Configure Service**
   - Name: `assignmate-api`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Region: Choose closest to your users

5. **Add Environment Variables**
   - Click "Environment"
   - Add all variables from Backend `.env.production`
   - Important: Use MongoDB Atlas URI

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment

## Setting Up MongoDB Atlas

1. **Create Account**
   - Go to mongodb.com/cloud
   - Sign up for free

2. **Create Cluster**
   - Click "Create a Deployment"
   - Choose "Serverless"
   - Select region
   - Click "Create Deployment"

3. **Set Credentials**
   - Create a database user
   - Generate connection string

4. **Whitelist IP**
   - Go to Network Access
   - Add IP Address (or allow all for development)

5. **Copy Connection String**
   - Use this as `MONGODB_URI` in backend environment

## Setting Up Cloudinary

1. **Create Account**
   - Go to cloudinary.com
   - Sign up for free

2. **Get Credentials**
   - Go to Dashboard
   - Copy Cloud Name
   - Generate API Key and Secret

3. **Configure Upload**
   - Settings → Upload
   - Set Unsigned Upload option
   - Note the upload preset

## Setting Up Google OAuth

1. **Create Google Cloud Project**
   - Go to console.cloud.google.com
   - Create new project
   - Enable Google+ API

2. **Create OAuth Credentials**
   - Go to Credentials
   - Click "Create Credentials"
   - Select "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs

3. **Get Credentials**
   - Copy Client ID and Secret
   - Use in environment variables

## Setting Up Gemini API

1. **Get API Key**
   - Go to makersuite.google.com
   - Sign in with Google
   - Click "Get API Key"
   - Create new API key

2. **Enable API**
   - Go to Google Cloud Console
   - Enable "Generative Language API"

3. **Use in Code**
   - Add API key to environment variables

## Monitoring & Logging

### Frontend (Vercel)
- Automatic error tracking
- Performance monitoring
- View logs in Vercel dashboard

### Backend (Render)
- View logs in Render dashboard
- Set up error notifications
- Configure uptime monitoring

### Database (MongoDB Atlas)
- Monitor database performance
- Set up alerts
- Regular backups (automatic)

## Security Best Practices

1. **SSL/TLS**
   - Vercel provides free SSL
   - Render provides free SSL
   - Always use HTTPS

2. **Environment Secrets**
   - Use Vercel Environment Variables
   - Use Render Environment Variables
   - Never commit secrets to Git

3. **Database Security**
   - Use strong passwords
   - Enable IP whitelist
   - Regular backups
   - Use MongoDB encryption

4. **API Security**
   - Implement rate limiting
   - Validate all inputs
   - Use CORS correctly
   - Implement request signing

5. **Monitoring**
   - Set up error tracking
   - Monitor API performance
   - Set up alerts
   - Regular security audits

## Scaling Strategy

### Phase 1: MVP (Current)
- Single backend instance
- Shared MongoDB
- CDN for static files (included in Vercel)

### Phase 2: Growth
- Multiple backend instances (load balancing)
- Database replication
- Redis cache layer
- API rate limiting

### Phase 3: Enterprise
- Kubernetes deployment
- Auto-scaling infrastructure
- Advanced caching strategies
- Database sharding

## Disaster Recovery

1. **Database Backups**
   - MongoDB Atlas does automatic daily backups
   - Enable point-in-time recovery
   - Test restore procedures monthly

2. **Code Backups**
   - Use GitHub as primary backup
   - Tag releases
   - Keep changelog updated

3. **Disaster Recovery Plan**
   - Document recovery procedures
   - Test recovery process
   - Keep runbooks updated

## Performance Optimization

### Frontend
- Enable caching headers
- Optimize images
- Minify JavaScript
- Use CDN (Vercel does this automatically)

### Backend
- Database indexing
- Query optimization
- Implement caching
- Connection pooling

### Database
- Regular optimization
- Index creation
- Query analysis
- Storage monitoring

## Rollback Procedure

### If Frontend Breaks
```bash
# Vercel automatically keeps previous deployments
# Go to Vercel dashboard → Deployments
# Click "Promote to Production" on previous working version
```

### If Backend Breaks
```bash
# Render keeps deployment history
# Go to Render dashboard → Deploys
# Click "Deploy" on previous working version
```

## Support & Maintenance

- Monitor error rates daily
- Review analytics weekly
- Update dependencies monthly
- Security audit quarterly
- Major version upgrades semi-annually

## Useful Commands for Production

```bash
# Check backend health
curl https://api.resumate.app/health

# View frontend logs
vercel logs resumate

# View backend logs
render logs resumate-api

# Database stats
db.stats()

# Cleanup old data
db.assignments.deleteMany({createdAt: {$lt: new Date(Date.now() - 90*24*60*60*1000)}})
```

## Emergency Contacts

- Vercel Support: support@vercel.com
- Render Support: support@render.com
- MongoDB Support: support.mongodb.com
- Cloudinary Support: support@cloudinary.com

---

For detailed deployment guides, refer to:
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Render Deployment Docs](https://render.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)

