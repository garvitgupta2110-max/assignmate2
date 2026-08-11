# ResuMate - All-in-One Student Productivity Platform

![ResuMate](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

ResuMate is a comprehensive SaaS platform designed to help college students manage all aspects of their academic life in one place. From resume building to assignment tracking, presentation creation to timetable planning, ResuMate combines powerful tools with intelligent AI assistance.

## Features

### 🎯 Core Modules

- **Resume Builder**: Create professional resumes with AI assistance and multiple templates
- **Presentation Maker**: Build stunning presentations with AI-generated content
- **Assignment Tracker**: Manage and track all assignments with deadlines and priorities
- **Timetable Planner**: Organize your weekly schedule with drag-and-drop functionality
- **Smart Calendar**: Unified calendar view of all classes, assignments, and events
- **AI Assistant**: Chat-based AI to help with various academic tasks

### ✨ Key Features

- Dark premium UI with glassmorphism design
- Apple + Notion + Linear inspired aesthetics
- Full responsive design for all devices
- Real-time notifications for deadlines
- AI-powered content generation
- Progress tracking and productivity scoring
- Multiple export formats (PDF, DOCX, PPTX)
- Cloud storage integration
- OAuth authentication with Google

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React version
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn UI** - High-quality UI components
- **Framer Motion** - Smooth animations
- **NextAuth.js** - Authentication
- **Zustand** - State management
- **Recharts** - Data visualization

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Cloudinary** - Image storage
- **Google Generative AI** - AI capabilities

### Deployment
- **Vercel** - Frontend deployment
- **Render** - Backend deployment
- **MongoDB Atlas** - Cloud database

## Project Structure

```
resumate/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App router pages
│   ├── components/          # Reusable React components
│   ├── lib/                 # Utility functions
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Zustand state management
│   └── public/              # Static assets
│
├── backend/                 # Express.js backend API
│   ├── src/
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── controllers/      # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Helper functions
│   │   └── config/          # Configuration files
│   └── dist/                # Compiled JavaScript
```

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- MongoDB (local or Atlas)
- Google OAuth credentials
- Gemini API key
- Cloudinary account

### 1. Clone and Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

Update `.env.local` with your credentials:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXTAUTH_SECRET=your_nextauth_secret
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
```

Update `.env` with your credentials:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/resumate
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo

# Or using local MongoDB
mongod
```

### 4. Run Development Servers

**Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

**Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/google` - Google OAuth authentication
- `POST /api/auth/verify-otp` - OTP verification

### User Endpoints

- `GET /api/users/me` - Get current user profile
- `PUT /api/users` - Update user profile

### Assignment Endpoints

- `GET /api/assignments` - Get all assignments
- `POST /api/assignments` - Create new assignment
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment

### Resume Endpoints

- `GET /api/resumes` - Get all resumes
- `POST /api/resumes` - Create new resume
- `PUT /api/resumes/:id` - Update resume
- `DELETE /api/resumes/:id` - Delete resume

### Presentation Endpoints

- `GET /api/presentations` - Get all presentations
- `POST /api/presentations` - Create new presentation
- `PUT /api/presentations/:id` - Update presentation
- `DELETE /api/presentations/:id` - Delete presentation

### Timetable Endpoints

- `GET /api/timetable` - Get timetable
- `PUT /api/timetable` - Update timetable

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/resumate
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
FRONTEND_URL=http://localhost:3000
```

## Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  email: String (unique),
  name: String,
  password: String (optional),
  profileImage: String,
  college: String,
  branch: String,
  semester: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Assignment Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  title: String,
  subject: String,
  description: String,
  dueDate: Date,
  priority: String (low|medium|high),
  status: String (pending|in-progress|completed),
  progress: Number (0-100),
  attachments: [String],
  createdAt: Date,
  updatedAt: Date
}
```

## Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel deploy
```

### Backend (Render)
```bash
cd backend
npm run build
# Push to GitHub and connect to Render
```

## Features Roadmap

- [ ] AI-powered assignment solver
- [ ] Collaborative features
- [ ] Mobile app
- [ ] Integration with Google Calendar
- [ ] Advanced analytics
- [ ] Social networking for students
- [ ] Job marketplace
- [ ] Study groups

## Monetization

### Free Plan
- 2 Resume Exports/month
- 5 Presentations/month
- 50 Assignments
- Basic features

### Pro Plan ($9.99/month)
- Unlimited Resume Exports
- Unlimited PPT Generation
- Advanced AI Features
- Premium Templates
- Priority support

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@resumate.app or create an issue in the repository.

## Contact

- Email: contact@resumate.app
- Website: https://resumate.app
- Twitter: [@ResuMateApp](https://twitter.com/resumateapp)

---

Built with ❤️ for students, by developers

#   a s s i g n m a t e  
 #   a s s i g n m a t e  
 #   a s s i g n m a t e 3  
 #   a s s i g n m a t e 3  
 