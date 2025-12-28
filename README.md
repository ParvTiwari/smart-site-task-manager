# Smart Site Task Manager 🚀

**Backend + Flutter Hybrid Developer Assessment** - Navicon Infraprojects

A production-ready task management system with **AI-powered auto-classification**, Supabase persistence, and polished Flutter dashboard.

## 🎯 Features

- **5 Core API Endpoints** (CRUD + filters/pagination)
- **Auto-classification** (category, priority, entities, actions)
- **Supabase PostgreSQL** (tasks + audit history)
- **Flutter Dashboard** (summary cards, task list, bottom-sheet form)
- **Production Deployment** (Render + env vars)
- **Unit Tests** (classification logic)
- **Material Design 3** + dark mode support

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js, Express, TypeScript, Zod, pg |
| **Database** | Supabase PostgreSQL |
| **Frontend** | Flutter, Riverpod, Dio |
| **Deployment** | Render (backend), Supabase (DB) |
| **Testing** | Vitest (backend) |

## 📋 API Documentation

### `POST /api/tasks` - Create Task (Auto-classifies)
