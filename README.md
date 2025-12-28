# Smart Site Task Manager 🚀

**Backend + Flutter Hybrid Developer Assessment** - Navicon Infraprojects

A production-ready task management system with **AI-powered auto-classification**, Supabase persistence, and polished Flutter dashboard.

[![Backend Status](https://api.render.com/status/YOUR_RENDER_SERVICE_ID)](https://YOUR_RENDER_URL.com)
[![Flutter Tests](https://github.com/YOUR_USERNAME/smart-site-task-manager/actions/workflows/flutter.yml/badge.svg)](https://github.com/YOUR_USERNAME/smart-site-task-manager/actions)

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

## 🚀 Live Demo

**Backend API**: https://your-app.onrender.com/api/tasks  
**Flutter App**: (APK/IPA screenshots below)

## 📋 API Documentation

### `POST /api/tasks` - Create Task (Auto-classifies)
