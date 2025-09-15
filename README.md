# MAxTask - Task Management App

A modern task management application built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Dashboard**: Clean, responsive dashboard with task statistics and recent activity
- **Dark Mode**: Built-in theme switching with system preference detection
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Backend**: Supabase (Database & Auth)
- **UI**: Tailwind CSS + shadcn/ui components
- **Icons**: Lucide React
- **Theme**: next-themes for dark mode support
- **Drag & Drop**: @dnd-kit (planned)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

1. Create a [Supabase](https://supabase.com) project
2. Run the SQL script from `Project-Vercel-Blueprint.md` in your Supabase SQL Editor

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.local` and fill in your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
maxtask-app/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── theme-provider.tsx # Theme provider for dark mode
│   └── theme-toggle.tsx   # Theme toggle button
├── lib/                   # Utility functions and configurations
│   ├── supabase/          # Supabase client configurations
│   └── utils.ts           # shadcn/ui utility functions
├── middleware.ts          # Authentication middleware
└── .env.local            # Environment variables (not committed)
```

## Development

- The project uses TypeScript for type safety
- ESLint for code linting
- Tailwind CSS for styling
- shadcn/ui for consistent UI components

## Dashboard Features

The dashboard includes:
- **Welcome Header**: Personalized greeting with theme toggle
- **Statistics Cards**: Four key metrics (Open Tasks, Overdue Tasks, Due Today, Completed Tasks)
- **Recent Tasks Table**: List of recently updated tasks with status badges
- **Responsive Layout**: Adapts to different screen sizes
- **Dark/Light Mode**: Automatic theme switching

## Deployment

Deploy to Vercel by connecting your GitHub repository. Make sure to add your environment variables in the Vercel dashboard.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
