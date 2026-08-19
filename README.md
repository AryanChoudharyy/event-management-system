# EventFlow — Event Management System

A full-stack MERN application for managing events across multiple user profiles and timezones. Built as an interview assignment demonstrating clean architecture, timezone-aware date handling, and professional UI design.

## Features

- **Multi-profile management** — Create user profiles with independent timezone preferences
- **Event CRUD** — Create, view, and edit events with multi-profile assignment
- **Full timezone support** — Events display correctly in each user's selected timezone using IANA identifiers
- **Event update history** — Every edit creates a structured changelog showing previous vs. updated values
- **Responsive UI** — Works on desktop, tablet, and mobile
- **Real-time timezone switching** — Change a profile's timezone and all timestamps convert instantly

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Vite) |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose) |
| State Management | Zustand |
| Date/Timezone | Day.js (UTC + Timezone plugins) |
| Styling | Vanilla CSS with CSS custom properties |
| HTTP Client | Axios |
| Routing | React Router v6 |

## Architecture

```
event-management-system/
├── client/              # React SPA (Vite)
│   └── src/
│       ├── components/  # Reusable UI (Modal, Toast, TimezoneSelect, MultiSelect)
│       ├── pages/       # Dashboard, Events, Profiles
│       ├── layouts/     # AppLayout (sidebar navigation)
│       ├── store/       # Zustand stores (profileStore, eventStore)
│       ├── services/    # API client (axios)
│       ├── utils/       # Timezone helpers
│       └── styles/      # Design system CSS
│
├── server/              # Express API
│   └── src/
│       ├── config/      # MongoDB connection
│       ├── models/      # Mongoose schemas (Profile, Event, EventLog)
│       ├── controllers/ # Request handlers
│       ├── services/    # Business logic
│       ├── routes/      # Express routes
│       ├── middleware/   # Error handler
│       └── utils/       # Helpers (asyncHandler, createError)
```

## Database Schema

### Profile
| Field | Type | Description |
|-------|------|-------------|
| name | String | User display name (1-50 chars) |
| timezone | String | IANA timezone identifier |
| createdAt | Date | Auto timestamp |
| updatedAt | Date | Auto timestamp |

### Event
| Field | Type | Description |
|-------|------|-------------|
| title | String | Event title (1-100 chars) |
| description | String | Optional description (max 500) |
| profiles | [ObjectId] | Assigned profiles (min 1) |
| timezone | String | Timezone of creation |
| startDateTime | Date | Start instant (stored as UTC) |
| endDateTime | Date | End instant (stored as UTC) |
| createdBy | ObjectId | Creator profile reference |

### EventLog
| Field | Type | Description |
|-------|------|-------------|
| eventId | ObjectId | Reference to Event |
| updatedBy | ObjectId | Who made the change |
| changes | Array | `[{ field, previousValue, updatedValue }]` |
| createdAt | Date | When the update occurred |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles` | List all profiles |
| POST | `/api/profiles` | Create profile |
| PATCH | `/api/profiles/:id` | Update profile (e.g. timezone) |
| GET | `/api/events` | List events (optional `?profileId=`) |
| GET | `/api/events/:id` | Get single event |
| POST | `/api/events` | Create event |
| PATCH | `/api/events/:id` | Update event |
| GET | `/api/events/:id/logs` | Get update history for event |

All responses follow: `{ success: true, data: ... }` or `{ success: false, message: "..." }`

## Timezone Strategy

1. **Storage**: All datetimes stored as UTC `Date` objects in MongoDB
2. **Event creation**: User selects a timezone + local date/time → converted to UTC via `dayjs.tz()` before saving
3. **Display**: UTC dates converted to the viewing user's selected timezone at render time
4. **Timezone change**: No data migration needed — the display layer re-converts automatically
5. **Update logs**: Timestamps stored as UTC; displayed in the viewer's current timezone
6. **No manual offsets**: Uses `dayjs/plugin/timezone` with IANA identifiers for correct DST handling

## State Management

Two Zustand stores keep state organized:

- **profileStore** — profiles list, active profile selection, CRUD operations
- **eventStore** — events list, loading/error states, CRUD operations

Local React state is used for UI-only concerns (modal visibility, form inputs, search queries).

## DSA / Performance Decisions

1. **Profile Map** — `Events.jsx` builds a `Map<profileId, Profile>` for O(1) lookups when rendering event cards, avoiding repeated `.find()` calls over the profiles array
2. **Event count Map** — `Profiles.jsx` computes event counts per profile using a `Map` in a single pass over events, rather than filtering per-profile
3. **Memoization** — `useMemo` for filtered event lists and computed stats to avoid recalculation on unrelated re-renders
4. **Stable callbacks** — `useCallback` for event handlers passed as props, preventing unnecessary child re-renders
5. **Sorted insertion** — New events are inserted in sorted order in the store, avoiding full re-sorts
6. **MongoDB indexes** — Indexes on `profiles`, `startDateTime`, and `createdBy` fields for efficient querying
7. **Lean queries** — Mongoose `.lean()` returns plain objects instead of full documents, reducing memory overhead

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm

### Environment Variables

Copy the example and fill in your MongoDB URI:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```
PORT=5000
MONGODB_URI=mongodb+srv://your_connection_string
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Install Dependencies

```bash
npm run install:all
```

### Seed Database (Optional)

```bash
npm run seed
```

Creates 5 sample profiles (Aryan, Sarah, James, Yuki, Emma) across different timezones and 6 sample events.

### Run Development

```bash
npm run dev
```

This starts both the Express server (port 5000) and Vite dev server (port 5173) concurrently.

- Frontend: http://localhost:5173
- API: http://localhost:5000/api

## Deployment

### Frontend → Vercel
- Set `VITE_API_URL` to your backend URL

### Backend → Render
- Set environment variables: `PORT`, `MONGODB_URI`, `CLIENT_URL`, `NODE_ENV=production`

### Database → MongoDB Atlas
- Create a cluster and whitelist your backend IP

## Future Improvements

- User authentication and authorization
- Event deletion with confirmation
- Calendar view (week/month)
- Email notifications for upcoming events
- Recurring events
- Dark mode toggle
- Event export (iCal)


---

## 🚀 Deployment Guide

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB)
- GitHub account
- Render/Vercel account (for deployment)

### Option 1: Deploy to Render (Recommended for Full-Stack)

#### 1. **Prepare MongoDB Atlas**
```bash
# Create a free cluster at https://cloud.mongodb.com
# Get your connection string (e.g., mongodb+srv://username:password@cluster.mongodb.net/eventdb)
```

#### 2. **Push to GitHub**
```bash
# Initialize and push if not already done
git add .
git commit -m "Initial commit - Event Management System"
gh repo create event-management-system --public --source=. --remote=origin --push
```

#### 3. **Deploy Backend on Render**
- Go to [render.com](https://render.com) and create a new **Web Service**
- Connect your GitHub repository
- Configure:
  - **Name**: `event-management-api`
  - **Root Directory**: `server`
  - **Build Command**: `npm install`
  - **Start Command**: `node src/server.js`
  - **Environment Variables**:
    - `NODE_ENV` = `production`
    - `PORT` = `5000`
    - `MONGODB_URI` = `your_mongodb_atlas_connection_string`
    - `CLIENT_URL` = `https://your-frontend-url.onrender.com` (update after frontend deployment)

#### 4. **Deploy Frontend on Render**
- Create another **Static Site**
- Configure:
  - **Name**: `event-management-frontend`
  - **Root Directory**: `client`
  - **Build Command**: `npm install && npm run build`
  - **Publish Directory**: `dist`
  - **Environment Variables**:
    - `VITE_API_URL` = `https://your-backend-api.onrender.com/api`

#### 5. **Update CORS**
- Go back to backend service and update `CLIENT_URL` environment variable with the frontend URL
- Redeploy backend if needed

### Option 2: Deploy to Vercel + MongoDB Atlas

#### 1. **Deploy Backend (Vercel Serverless)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy backend
cd server
vercel --prod
# Follow prompts and add environment variables:
# - MONGODB_URI
# - CLIENT_URL (add after frontend deployment)
```

#### 2. **Deploy Frontend**
```bash
cd ../client
vercel --prod
# Add environment variable:
# - VITE_API_URL = https://your-backend.vercel.app/api
```

#### 3. **Update Backend CORS**
```bash
# Redeploy backend with updated CLIENT_URL pointing to frontend
cd ../server
vercel --prod
```

### Option 3: Railway (Alternative)

Railway provides seamless full-stack deployment:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy (Railway will auto-detect the monorepo structure)
railway up
```

### Environment Variables Reference

#### Backend (`.env`)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eventdb
CLIENT_URL=https://your-frontend-url.com
```

#### Frontend (`.env.production`)
```env
VITE_API_URL=https://your-backend-api.com/api
```

### Post-Deployment Checklist

- ✅ Backend health check: `https://your-api.com/api/health`
- ✅ MongoDB connection successful
- ✅ Frontend loads without console errors
- ✅ CORS configured correctly
- ✅ Can create profiles
- ✅ Can create events
- ✅ Can update events
- ✅ Update logs working
- ✅ Timezone switching works

### Seeding Production Data (Optional)

```bash
# If you want to seed demo data in production
# SSH into backend or run locally pointing to production DB
cd server
node src/seed.js
```

---

## 📦 Local Development Setup

### 1. Clone and Install
```bash
git clone https://github.com/yourusername/event-management-system.git
cd event-management-system

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

**Backend** (`server/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eventdb
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend** (`client/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start MongoDB
```bash
# If using local MongoDB
mongod

# OR use MongoDB Atlas connection string in .env
```

### 4. Seed Database (Optional)
```bash
cd server
node src/seed.js
```

### 5. Run Development Servers
```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

### 6. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health

---

## 🔑 API Endpoints

### Profiles
- `GET /api/profiles` - Get all profiles
- `POST /api/profiles` - Create profile
- `PATCH /api/profiles/:id` - Update profile (timezone)

### Events
- `GET /api/events` - Get all events (with optional `?profileId=` filter)
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event
- `PATCH /api/events/:id` - Update event

### Event Logs
- `GET /api/events/:id/logs` - Get update history for an event

---

## 🎯 Project Highlights

### Timezone Architecture
- **Storage**: All dates stored in UTC (ISO 8601) in MongoDB
- **Display**: Converted to user's timezone using Day.js with IANA timezone data
- **Input**: User enters local time → converted to UTC → stored
- **Update**: Timezone changes instantly update all displayed timestamps without altering underlying data

### Data Structure & DSA Optimizations
1. **Event filtering**: Uses MongoDB indexes on `profiles` array for O(log n) lookup
2. **Profile event count**: Computed using a `Map` in O(n) single pass
3. **Timezone conversion**: Cached timezone offset calculations to avoid repeated computation
4. **Event logs**: Indexed by `event` reference for fast historical queries

### State Management Strategy
- **Zustand stores** for global state (profiles, events)
- **Local component state** for UI-only concerns (modals, dropdowns)
- **API layer** abstracts HTTP calls and error handling
- **Optimistic UI updates** where appropriate (timezone changes)

---

## 🧪 Testing the App

### Critical User Flows
1. **Create Profile** → Set timezone → Verify it appears in list
2. **Create Event** → Assign multiple profiles → Different timezone → Verify timestamps
3. **Edit Event** → Change times → Check update logs
4. **Switch Timezone** → Verify all event times update correctly
5. **Multi-timezone test**: Create event in Asia/Kolkata, view as user in America/New_York

---

## 📝 Assignment Requirements Coverage

| Requirement | Status | Implementation |
|------------|--------|----------------|
| React frontend | ✅ | React 18 + Vite |
| Express backend | ✅ | Express.js with layered architecture |
| MongoDB database | ✅ | Mongoose ODM with schemas |
| State management | ✅ | Zustand |
| Timezone handling | ✅ | Day.js with timezone plugin |
| Create profiles | ✅ | Admin can create profiles with name + timezone |
| No profile deletion | ✅ | No delete functionality implemented |
| Multi-profile events | ✅ | Events can be assigned to 1+ profiles |
| Timezone per event | ✅ | Each event has its own timezone |
| Date/time validation | ✅ | End cannot be before start |
| View events | ✅ | Users see events assigned to them |
| Update events | ✅ | Full edit capability with validation |
| createdAt/updatedAt | ✅ | Stored in UTC, displayed in user timezone |
| Multi-timezone display | ✅ | Events display per user's selected timezone |
| **BONUS: Update logs** | ✅ | Full changelog with previous/updated values |
| **BONUS: Log timezone conversion** | ✅ | Logs update when user changes timezone |

---

## 🤝 Contributing

This project was built as an interview assignment. Contributions are welcome for:
- Additional test coverage
- Performance optimizations
- UI/UX improvements
- Additional features (reminders, recurring events, etc.)

---

## 📄 License

MIT License - Feel free to use this project for learning or as a portfolio piece.

---

## 👤 Author

Built with ❤️ for SkaiLama MERN Stack Developer Assignment

**Repository**: https://github.com/AryanChoudharyy/event-management-system  
**Live Demo**: Deploy following the guide below

