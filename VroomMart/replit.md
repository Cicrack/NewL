# Overview

Eldady is a social commerce platform that combines social networking features with e-commerce functionality. The application allows users to create and share products, form communities called "Vrooms", engage through likes and comments, and manage shopping carts. It's built as a full-stack web application with a React frontend and Express backend, using PostgreSQL for data persistence and Replit's authentication system for user management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with **React 18** using TypeScript and follows a component-based architecture. The application uses **Vite** as the build tool and bundler for fast development and optimized production builds.

**State Management**: The app leverages **TanStack Query (React Query)** for server state management, providing caching, synchronization, and optimistic updates. Local component state is managed with React's built-in hooks.

**Routing**: **Wouter** is used as a lightweight routing library, providing client-side navigation between pages like home, profile, cart, messages, and individual vroom pages.

**UI Framework**: The interface is built with **shadcn/ui** components on top of **Radix UI** primitives, providing accessible and customizable components. **Tailwind CSS** handles styling with a custom design system featuring warm colors (terracotta, coral, warm white).

**Form Management**: **React Hook Form** with **Zod** schema validation manages form state and validation across product creation, user profiles, and messaging interfaces.

## Backend Architecture
The server runs on **Express.js** with TypeScript, providing a RESTful API architecture. The application follows a layered approach with clear separation between routes, business logic, and data access.

**API Design**: RESTful endpoints handle CRUD operations for products, users, vrooms, cart items, orders, and messages. Routes are organized by feature domain (products, auth, cart, etc.).

**Data Access Layer**: A storage abstraction layer (`storage.ts`) encapsulates all database operations, making the system database-agnostic and easier to test.

**Development Setup**: In development, Vite middleware is integrated with Express to provide hot module replacement and unified development experience.

## Data Storage
The application uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database queries and schema management.

**Database Schema**: The schema includes tables for users, products, vrooms (communities), follows, likes, bookmarks, comments, cart items, orders, and messages. Relationships are properly defined with foreign keys and cascade deletes.

**Connection Management**: **Neon Database** (serverless PostgreSQL) is used as the database provider, with connection pooling handled by the Neon serverless driver.

**Migrations**: Drizzle Kit manages database schema migrations with the schema defined in TypeScript for type safety.

## Authentication and Authorization
The system uses **Replit's OpenID Connect (OIDC)** authentication for user management, providing seamless integration with the Replit ecosystem.

**Session Management**: **Express Session** with **PostgreSQL session store** handles user sessions with proper security configurations (httpOnly, secure cookies).

**User Profile Management**: User data is automatically synced from Replit's authentication system and stored locally for performance.

**Route Protection**: Middleware functions protect authenticated routes and handle unauthorized access gracefully.

# External Dependencies

## Third-party Services
- **Replit Authentication**: OpenID Connect provider for user authentication and profile management
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit Development Tools**: Cartographer for development debugging and runtime error overlays

## Key Libraries and Frameworks
- **Frontend**: React 18, TypeScript, Vite, Wouter (routing), TanStack Query (state management)
- **UI Components**: Radix UI primitives, shadcn/ui component library, Tailwind CSS
- **Backend**: Express.js, TypeScript, Passport.js (authentication middleware)
- **Database**: Drizzle ORM, PostgreSQL with Neon serverless driver
- **Form Handling**: React Hook Form with Zod validation
- **Utilities**: date-fns (date formatting), clsx (conditional classes), class-variance-authority (component variants)

## Development Dependencies
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation
- **Type Safety**: TypeScript across the entire stack with shared types
- **Code Quality**: ESLint and TypeScript compiler for code validation