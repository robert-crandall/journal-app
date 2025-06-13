# Journal App Frontend

A Next.js frontend for the conversational journal application.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

- `/src/app/` - Next.js App Router pages and layouts
- `/src/components/` - Reusable UI components
- `/src/lib/` - Business logic and API client
- `/src/types/` - TypeScript type definitions
- `/src/utils/` - Utility functions and helpers
- `/src/styles/` - Global styles and Tailwind CSS configuration

## Features

- **Conversational Journal**: AI-powered journal entries with follow-up questions
- **Self-Experiments**: Track lifestyle experiments with daily tasks
- **Character Stats**: RPG-inspired personal development tracking
- **Dark/Light Themes**: Support for multiple themes including Dracula
- **Mobile-First**: Responsive design optimized for mobile devices
- **Type-Safe**: End-to-end TypeScript integration with backend

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4 + daisyUI
- **Authentication**: JWT tokens with secure storage
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **HTTP Client**: Fetch API with custom wrapper
- **Date Handling**: date-fns

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (static export)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3001)

## Deployment

This app is configured for static site generation (SSG). Run `npm run build` to generate static files in the `out/` directory.

## Development Notes

- The app uses Tailwind CSS 4 with the new `@theme` directive for custom styling
- Authentication is handled client-side with JWT tokens stored in cookies
- The API client is designed to be easily replaced with tRPC once backend client is integrated
- All components are mobile-first and accessible
- Theme switching is persisted in localStorage
