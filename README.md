# Hostel Access Hub

A modern web application for managing hostel gatepass requests with separate dashboards for students and wardens.

> **⚠️ Note**: This project is not yet completed.

## 📋 Overview

Hostel Access Hub is a comprehensive gatepass management system designed to streamline the process of requesting and approving student leave from hostel premises. The application provides role-based access with dedicated interfaces for students and wardens.

## ✨ Features

### Student Features
- **Submit Gatepass Requests**: Request permission to leave hostel with details like destination, dates, contact info, and reason
- **Track Request Status**: View all submitted requests with real-time status updates (pending, approved, rejected)
- **Request History**: Access complete history of all gatepass requests
- **Profile Information**: View personal details including roll number and room number
- **Warden Feedback**: See remarks and comments from wardens on requests

### Warden Features
- **Request Management**: Review all gatepass requests from students
- **Approve/Reject Requests**: Take action on pending requests with optional remarks
- **Categorized Views**: Filter requests by status (pending, approved, rejected)
- **Student Information**: Access student details (name, roll number, room number) with each request
- **Dashboard Analytics**: View total student count and request statistics
- **Real-time Updates**: Automatic notification system for new requests

## 🛠️ Tech Stack

- **Frontend**:
  - React 18 with TypeScript
  - Vite for blazing-fast development
  - Tailwind CSS for styling
  - shadcn/ui for UI components
  - Radix UI primitives

- **Backend & Database**:
  - Supabase for backend services
  - PostgreSQL database
  - Row Level Security (RLS) policies
  - Real-time subscriptions

- **Additional Libraries**:
  - React Query (@tanstack/react-query) for server state management
  - React Hook Form for form handling
  - date-fns for date manipulation
  - Lucide React for icons

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm or yarn package manager
- Supabase account

### Installation

1. **Clone the repository**
   ```sh
   git clone <YOUR_GIT_URL>
   cd hostel-access-hub
   ```

2. **Install dependencies**
   ```sh
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Set up Supabase**
   - Create a new project on [Supabase](https://supabase.com)
   - Copy your project URL and anon key
   - Create a `.env.local` file in the root directory:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Run database migrations**
   ```sh
   # Install Supabase CLI
   npm install -g supabase

   # Link to your project
   supabase link --project-ref your-project-ref

   # Push migrations
   supabase db push
   ```

5. **Start the development server**
   ```sh
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
hostel-access-hub/
├── src/
│   ├── components/
│   │   ├── StudentDashboard.tsx    # Student interface
│   │   ├── WardenDashboard.tsx     # Warden interface
│   │   └── ui/                     # Reusable UI components
│   ├── pages/
│   │   ├── Auth.tsx                # Authentication page
│   │   ├── Index.tsx               # Landing page
│   │   └── NotFound.tsx            # 404 page
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts           # Supabase client config
│   │       └── types.ts            # Database types
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utility functions
│   └── main.tsx                    # App entry point
├── supabase/
│   └── migrations/                 # Database migrations
└── public/                         # Static assets
```

## 🗄️ Database Schema

The application uses the following main tables:

- **profiles**: User profiles with role-based access (student/warden)
- **student_details**: Student-specific information (roll number, room number)
- **gatepass_requests**: All gatepass request records with status tracking

## 🔐 Authentication & Authorization

- Authentication handled by Supabase Auth
- Role-based access control (RBAC)
- Row Level Security (RLS) policies ensure data privacy
- Students can only view/edit their own requests
- Wardens have access to all requests

## 🎨 UI Components

Built with shadcn/ui, the application includes:
- Cards, Dialogs, and Modals
- Forms with validation
- Tables and Lists
- Status badges
- Toast notifications
- Responsive design for mobile and desktop

## 📱 Usage

### For Students
1. Sign up/Login with your credentials
2. Navigate to Student Dashboard
3. Click "New Request" to submit a gatepass
4. Fill in the required details and submit
5. Track your request status in the dashboard

### For Wardens
1. Login with warden credentials
2. Navigate to Warden Dashboard
3. Review pending requests in the "Pending" tab
4. Click on a request to view details
5. Approve or reject with optional remarks
6. View approved/rejected requests in respective tabs

## 🔧 Development

```sh
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```
