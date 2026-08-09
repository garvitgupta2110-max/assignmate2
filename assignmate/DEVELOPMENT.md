# ResuMate Development Guide

## Quick Start for Developers

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/resumate.git
   cd resumate
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend && npm install

   # Backend (in new terminal)
   cd backend && npm install
   ```

3. **Setup environment files**
   ```bash
   # Frontend
   cp frontend/.env.example frontend/.env.local

   # Backend
   cp backend/.env.example backend/.env
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend
   cd frontend && npm run dev

   # Terminal 3 - MongoDB (if local)
   mongod
   ```

## Frontend Development

### Project Structure
```
frontend/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── resume/            # Resume builder
│   ├── presentations/     # Presentation maker
│   ├── assignments/       # Assignment tracker
│   ├── timetable/         # Timetable planner
│   ├── calendar/          # Calendar view
│   └── settings/          # Settings page
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── landing/          # Landing page
│   ├── sidebar.tsx       # Navigation sidebar
│   └── header.tsx        # Top header
├── lib/                  # Utilities
├── hooks/                # Custom hooks
└── store/                # Zustand stores
```

### Key Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Component Development

All UI components use Shadcn UI. Key components:
- `Button` - Action buttons
- `Card` - Content containers
- `Input` - Form inputs
- `Dialog` - Modal dialogs
- `Toast` - Notifications

Example:
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

## Backend Development

### Project Structure
```
backend/src/
├── models/       # MongoDB schemas
├── routes/       # API route definitions
├── controllers/  # Business logic
├── middleware/   # Express middleware
├── utils/        # Helper functions
├── config/       # Configuration
└── index.ts      # Entry point
```

### Key Commands

```bash
# Start development server
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

### Adding New Features

1. **Create a Model** (if needed)
   ```typescript
   // src/models/MyModel.ts
   import mongoose, { Schema, Document } from "mongoose";

   export interface IMyModel extends Document {
     name: string;
     createdAt: Date;
   }

   const myModelSchema = new Schema<IMyModel>({
     name: { type: String, required: true }
   }, { timestamps: true });

   export const MyModel = mongoose.model<IMyModel>("MyModel", myModelSchema);
   ```

2. **Create Routes**
   ```typescript
   // src/routes/myroute.ts
   import { Router } from "express";
   import { authMiddleware } from "../middleware/auth";

   const router = Router();

   router.get("/", authMiddleware, async (req, res) => {
     // Implementation
   });

   export default router;
   ```

3. **Register Routes in index.ts**
   ```typescript
   app.use("/api/myroute", myRouteRoutes);
   ```

## Authentication Flow

### Frontend
1. User lands on landing page
2. Click "Sign In" → redirected to auth page
3. Choose Google OAuth or Email/OTP
4. NextAuth handles the flow
5. User is logged in and redirected to dashboard

### Backend
1. Auth endpoint receives credentials
2. Verify with Google or generate OTP
3. Create/update user in database
4. Generate JWT token
5. Return token to frontend

## API Response Format

All API responses follow this format:

**Success:**
```json
{
  "data": { /* actual data */ },
  "status": 200,
  "message": "Success"
}
```

**Error:**
```json
{
  "error": "Error message",
  "status": 400,
  "message": "Bad Request"
}
```

## Testing

### Manual Testing
1. Use Postman or Insomnia for API testing
2. Test with dummy data before real usage
3. Check console for errors

### Testing Checklist
- [ ] Authentication flows
- [ ] CRUD operations for all modules
- [ ] Error handling
- [ ] Responsive design
- [ ] Performance

## Performance Optimization

### Frontend
- Lazy load components with `dynamic`
- Use Image optimization with next/image
- Implement pagination for lists
- Debounce search inputs

### Backend
- Use database indexing for frequently queried fields
- Implement pagination for list endpoints
- Cache frequently accessed data
- Use compression middleware

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Both frontend and backend
3. **Use HTTPS** - Always use HTTPS in production
4. **JWT expiry** - Set reasonable expiry times
5. **CORS** - Configure CORS properly
6. **Rate limiting** - Implement rate limiting
7. **SQL/NoSQL injection** - Use parameterized queries (Mongoose handles this)

## Debugging

### Frontend
```bash
# Chrome DevTools
# - Open Developer Tools (F12)
# - Use Console tab for errors
# - Use Network tab for API calls
# - Use Application tab for localStorage/cookies
```

### Backend
```bash
# Enable debugging
DEBUG=* npm run dev

# Use VS Code debugger
# - Add breakpoints
# - Press F5 to debug
```

## Common Issues & Solutions

### Port Already in Use
```bash
# Kill process using port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Kill process using port 5000 (backend)
lsof -ti:5000 | xargs kill -9
```

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongo --version

# Start MongoDB
mongod

# Or use MongoDB Atlas connection string
```

### Build Errors
```bash
# Clear build artifacts
rm -rf frontend/.next backend/dist

# Reinstall dependencies
rm -rf frontend/node_modules backend/node_modules
npm install (in both directories)
```

## Contributing Guidelines

1. Create a new branch for each feature
2. Follow the existing code style
3. Write clear commit messages
4. Test before submitting PR
5. Update documentation

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## Support

For development issues, create an issue on GitHub or contact the development team.

