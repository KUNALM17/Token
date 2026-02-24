# Hospital Token System - Frontend

## Installation

```bash
cd frontend
npm install
```

## Running Development Server

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── pages/          # Dashboard pages for each role
├── api.ts          # Axios API client
├── types.ts        # TypeScript interfaces
├── App.tsx         # Main app with routing
└── main.tsx        # Entry point
```

## Features

### Authentication
- OTP-based login
- Auto-redirect based on user role
- Token stored in localStorage

### Patient Dashboard
- Browse hospitals
- Select doctors
- Check availability
- Book appointments
- View booking history
- Real-time queue status

### Hospital Admin Dashboard
- Queue management
- Call next / Skip / Complete actions
- Doctor management
- CSV export
- Real-time statistics

### Doctor Dashboard
- View today's queue
- Mark appointments as complete
- Real-time queue updates

### Super Admin Dashboard
- Create hospitals
- Manage hospital admins
- View all hospitals
- Toggle hospital status

## Environment Variables

Create `.env.local` in frontend root:

```env
VITE_API_URL=http://localhost:5000
```

## Notes

- Uses Tailwind CSS for styling
- Lucide React for icons
- Role-based routing with protected pages
- Real-time API calls with Axios
