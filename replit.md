# Campus Buddy - Smart Campus Guide & Scheduler

## Overview

Campus Buddy is a comprehensive web-based application designed to help new students navigate their campus and manage their academic schedules. The system provides advanced 3D interactive campus maps, real-time positioning, indoor navigation with Bluetooth beacons, class scheduling, reminder management, and administrative tools for campus facility management.

## Recent Changes (July 13, 2025)

✓ Enhanced navigation system with 3D building visualization
✓ Real-time GPS tracking and indoor positioning capabilities  
✓ Bluetooth beacon support for precise indoor navigation
✓ Turn-by-turn navigation with accessibility considerations
✓ Admin panel for managing navigation infrastructure
✓ AR navigation framework (UI ready, implementation pending)
✓ Emergency evacuation route planning
✓ Advanced pathfinding algorithms for multi-floor buildings

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side navigation
- **Styling**: Tailwind CSS with Shadcn/ui component library
- **State Management**: TanStack React Query for server state management
- **Build Tool**: Vite for development and production builds
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API architecture
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Middleware**: Custom authentication and role-based access control

### Database Architecture
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless provider
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Connection pooling via @neondatabase/serverless

## Key Components

### Authentication System
- JWT token-based authentication
- Role-based access control (student, admin, super_admin)
- Secure password hashing with bcrypt
- Session management with localStorage

### Enhanced Navigation System
- 3D building visualization with interactive campus maps
- Real-time GPS tracking with accuracy indicators
- Indoor positioning using Bluetooth beacons and WiFi fingerprinting
- Multi-floor navigation with elevator and stair routing
- Turn-by-turn directions with landmark references
- Accessibility-aware pathfinding for wheelchair users
- Emergency evacuation route planning and management
- AR navigation interface (framework implemented)
- Canvas-based map editing tools for administrators
- Advanced pathfinding algorithms (A* with 3D support)

### Schedule Management
- Course creation and management
- Class schedule tracking with time slots
- Day-of-week based scheduling
- Room assignment integration

### Reminder System
- Automated class reminders
- Customizable notification timing
- Integration with user schedules

### User Management
- Multi-role user system
- Profile management
- Department and student ID tracking
- Admin portal for user administration

## Data Flow

1. **Authentication Flow**: Users authenticate via login/register forms → JWT tokens stored in localStorage → Token validation on protected routes
2. **Map Data Flow**: Buildings/floors fetched from database → Rendered on interactive map → Admin edits saved to database
3. **Schedule Flow**: Users create courses → Add schedules to courses → Reminders automatically generated → Notifications triggered
4. **Admin Flow**: Super admins manage users and buildings → Admins manage content → Students consume content

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM, React Router via Wouter)
- TanStack React Query for data fetching
- React Hook Form with Zod validation

### UI and Styling
- Tailwind CSS for styling
- Radix UI for accessible component primitives
- Lucide React for icons
- Class Variance Authority for component variants

### Backend Dependencies
- Express.js for server framework
- Drizzle ORM for database operations
- bcrypt for password security
- jsonwebtoken for authentication
- @neondatabase/serverless for database connectivity

### Development Tools
- TypeScript for type safety
- Vite for build tooling
- ESBuild for production bundling
- PostCSS with Autoprefixer

## Deployment Strategy

### Development Environment
- Vite dev server for frontend hot reloading
- Express server running via tsx for TypeScript execution
- Environment variables for database connection
- Replit-specific development tooling integration

### Production Build
- Frontend: Vite builds optimized static assets
- Backend: ESBuild bundles server code for Node.js execution
- Database: Drizzle migrations applied via `db:push` script
- Assets served statically from Express server

### Environment Configuration
- DATABASE_URL required for PostgreSQL connection
- JWT_SECRET for authentication security
- NODE_ENV for environment-specific behavior
- Automatic database seeding in development mode

### Key Architectural Decisions

1. **Monorepo Structure**: Shared TypeScript schemas between client/server for type safety
2. **Serverless Database**: Neon PostgreSQL for scalability and ease of deployment
3. **Component Library**: Shadcn/ui for consistent, accessible UI components
4. **Authentication Strategy**: JWT tokens for stateless authentication with role-based permissions
5. **Map Technology**: Leaflet.js for interactive maps with custom pathfinding algorithms
6. **Build Strategy**: Separate frontend/backend builds with shared type definitions