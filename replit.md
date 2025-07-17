# Track & Field Multi-Event Calculator

## Overview

This is a full-stack web application for calculating and tracking track and field multi-event performances (Pentathlon, Heptathlon, and Decathlon). The application allows users to input their event results and automatically calculates points using World Athletics scoring formulas, providing a comprehensive tool for athletes and coaches to analyze performance data.

## User Preferences

Preferred communication style: Simple, everyday language.
Design theme: Neubrutalism - bold colors, thick borders, sharp geometric shapes, high contrast.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Storage**: In-memory storage implementation with interface for database integration

### Project Structure
```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   └── pages/       # Page components
├── server/          # Express backend
│   ├── routes.ts    # API route definitions
│   ├── storage.ts   # Data storage abstraction
│   └── services/    # Business logic services
└── shared/          # Shared types and schemas
    └── schema.ts    # Database schema and validation
```

## Key Components

### Database Schema
- **Users Table**: Authentication and user management
- **Performances Table**: Event results with JSON storage for flexible event data
- **Validation**: Zod schemas for runtime type checking and API validation

### Scoring System
- **World Athletics Formulas**: Implemented in `server/services/scoring.ts`
- **Event Types**: Support for Pentathlon, Heptathlon, and Decathlon
- **Point Calculation**: Separate formulas for track (time-based) and field (measurement-based) events

### API Endpoints
- `GET /api/performances` - Retrieve all performances with optional event type filtering
- `GET /api/performances/:id` - Get single performance by ID
- `POST /api/performances` - Create new performance with validation
- `DELETE /api/performances/:id` - Delete performance by ID

### Frontend Features
- **Calculator Interface**: Form-based input for each event type
- **Results Display**: Table view of all results with sorting and filtering
- **Performance Tracking**: Historical performance data with date tracking
- **Responsive Design**: Mobile-optimized interface with adaptive components
- **Neubrutalism Design**: Bold, high-contrast UI with thick borders, sharp corners, and vibrant colors
- **Dark Mode Support**: System theme detection with manual toggle between light/dark/system modes

## Data Flow

1. **User Input**: Athletes input their results through the calculator interface
2. **Client Validation**: Zod schemas validate input data on the client side
3. **API Request**: TanStack Query manages API calls to the Express backend
4. **Server Processing**: Express routes handle requests and validate data
5. **Score Calculation**: Scoring service applies World Athletics formulas
6. **Data Storage**: Results are persisted in PostgreSQL via Drizzle ORM
7. **Response**: Calculated scores and performance data returned to client
8. **UI Update**: React components re-render with new data

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database queries and schema management
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **wouter**: Lightweight routing for React
- **zod**: Runtime type validation and schema definition

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing and optimization

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite compiles React app to static assets in `dist/public`
2. **Backend Build**: ESBuild bundles server code to `dist/index.js`
3. **Type Checking**: TypeScript compiler validates all code

### Production Configuration
- **Environment Variables**: `DATABASE_URL` required for PostgreSQL connection
- **Static Serving**: Express serves built frontend assets in production
- **Database Migrations**: Drizzle Kit handles schema migrations with `db:push`

### Development Workflow
- **Hot Reload**: Vite HMR for instant frontend updates
- **API Logging**: Express middleware logs API requests with response times
- **Error Handling**: Comprehensive error boundaries and API error responses

The application follows a modern full-stack architecture with strong typing throughout, efficient state management, and a focus on developer experience while maintaining production readiness.