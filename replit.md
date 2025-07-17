# Track & Field Multi-Event Calculator

## Overview

This is a full-stack web application for calculating and tracking track and field multi-event performances (Pentathlon, Heptathlon, and Decathlon). The application allows users to input their event results and automatically calculates points using World Athletics scoring formulas, providing a comprehensive tool for athletes and coaches to analyze performance data.

## User Preferences

Preferred communication style: Simple, everyday language.
Design theme: Glassmorphism - translucent elements, blur effects, subtle gradients, layered transparency.
Default theme: Dark mode with enhanced glassmorphism effects.
Typography: Inter font family with medium weight for enhanced readability and modern appearance.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming

### Storage Architecture
- **Primary Storage**: Local storage and IndexedDB for offline-first functionality
- **Data Persistence**: Browser-based storage with JSON serialization
- **Offline Support**: Full offline capability with service worker caching
- **PWA Features**: Progressive Web App with install prompt and background sync
- **Legacy Support**: Express.js server maintained for development compatibility

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
- **Performances Table**: Event results with JSON storage for flexible event data, includes optional labels and UUID for tracking
- **Validation**: Zod schemas for runtime type checking and API validation

### Scoring System
- **World Athletics Formulas**: Implemented in `server/services/scoring.ts`
- **Event Types**: Support for Pentathlon, Heptathlon, and Decathlon
- **Point Calculation**: Separate formulas for track (time-based) and field (measurement-based) events

### Local Storage Functions
- `getPerformances()` - Retrieve all performances from localStorage
- `savePerformance()` - Create new performance with UUID generation
- `updatePerformance()` - Update existing performance by UUID
- `deletePerformance()` - Delete performance by ID
- `getAchievements()` - Retrieve all achievements from localStorage
- `checkAchievements()` - Evaluate and create new achievements based on performance data

### Frontend Features
- **Calculator Interface**: Form-based input for each event type
- **Results Display**: Table view of all results with sorting and filtering
- **Performance Tracking**: Historical performance data with date tracking
- **Performance Labels**: Optional labels for performances (simplified to "Label")
- **Performance Editing**: Click history items to load and edit existing performances using UUID tracking
- **Manual Save Control**: Save performances manually with "SAVE PERFORMANCE" button (no auto-save)
- **Dynamic Placeholders**: Input field placeholders adapt to metric/imperial toggle showing relevant examples
- **Responsive Design**: Mobile-optimized interface with adaptive components
- **Glassmorphism Design**: Translucent UI elements with blur effects, subtle gradients, and layered transparency
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

## Recent Changes: Latest modifications with dates

### July 17, 2025 - Achievement System & Radar Charts
- **Achievement Timeline**: Implemented complete achievement system with database schema, API endpoints, and React components
- **Milestone Tracking**: Added automatic achievement detection for first performances, score improvements, and multi-event completions
- **Radar Chart Visualization**: Added comprehensive radar charts showing points distribution for each event in saved performances
- **Chart Features**: Each performance displays as a radar chart with event names as axes and points determining distance from center
- **Glassmorphism Integration**: All new components follow the dark mode glassmorphism design theme
- **Performance Enhancement**: Fixed React hooks issues and optimized component rendering
- **Offline-First Architecture**: Converted from API server to fully offline local storage using IndexedDB and localStorage
- **PWA Features**: Added Progressive Web App capabilities with service worker, offline status, and install functionality
- **Day-Based Event Organization**: Implemented day divisions for decathlon and heptathlon with running subtotals
- **Enhanced UI/UX**: Calculator hidden by default, comprehensive summary section with Day 1/Day 2/Final totals, improved form reset behavior