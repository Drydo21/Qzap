# QZap AI Quiz App - Product Requirements Document

## Overview
QZap is an AI-powered quiz application that transforms book photos into interactive MCQ quizzes using OCR and GPT-5.2.

## Original Problem Statement
Build a full-stack quiz app with:
- Supabase PostgreSQL backend
- AI-powered OCR for English/Hindi book images
- Quiz generation with difficulty levels
- Timed quizzes with navigation
- Social features (friends, groups, messaging)
- Leaderboard and dashboard stats
- Bilingual support (EN/HI)

## User Personas
1. **Students** - Primary users who want to study effectively
2. **Study Groups** - Friends who want to learn together
3. **Self-learners** - Individuals improving knowledge through quizzes

## Core Requirements (Static)
- ✅ Supabase Auth (signup/login)
- ✅ OCR from book images (English/Hindi)
- ✅ AI quiz generation (5/10/15 questions)
- ✅ Difficulty levels (Easy/Medium/Hard)
- ✅ Timer options (30s/60s per question)
- ✅ Score calculation with explanations
- ✅ Dashboard with stats
- ✅ Leaderboard
- ✅ Friends system
- ✅ Group messaging
- ✅ Language toggle (EN/HI)
- ✅ Mobile-optimized design

## What's Been Implemented (Feb 27, 2026)

### Backend (FastAPI + Supabase PostgreSQL)
- `/api/auth/signup` - User registration
- `/api/auth/login` - User authentication
- `/api/auth/logout` - Session termination
- `/api/auth/me` - Get current user
- `/api/ocr` - Extract text from book images using GPT-5.2 Vision
- `/api/quiz/generate` - Generate MCQ quizzes
- `/api/quiz/submit` - Submit quiz results
- `/api/quiz/history` - Get quiz history
- `/api/dashboard` - Dashboard stats
- `/api/leaderboard` - Global rankings
- `/api/friends/*` - Friends system
- `/api/groups/*` - Group management
- `/api/messages/*` - Group messaging
- `/api/profile` - Profile updates

### Database Tables
- users
- quiz_results
- leaderboard
- friends
- groups
- messages

### Frontend (React + Tailwind CSS)
- Landing page with hero section
- Auth page (login/signup tabs)
- Dashboard with stats cards
- Quiz creation (image upload, options)
- Quiz taking (timer, navigation)
- Quiz results (score, explanations)
- Leaderboard page
- Friends page
- Groups & messaging page
- Profile page
- Mobile bottom navigation

### Features
- Light theme (student-friendly)
- Manrope + Inter typography
- Responsive design (mobile-first)
- Language toggle (English/Hindi)
- Animations using Framer Motion
- Toast notifications

## Prioritized Backlog

### P0 (Critical)
- All core features implemented ✅

### P1 (High Priority)
- Email verification handling (requires Supabase dashboard config)
- Push notifications for quiz reminders
- Share quiz results on social media

### P2 (Nice to Have)
- Quiz categories/subjects
- Study streak tracking
- Achievement badges
- Audio pronunciation for Hindi text
- Dark mode option

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Framer Motion, Shadcn/UI
- **Backend**: FastAPI, Python
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-5.2 (Emergent LLM key)
- **OCR**: OpenAI Vision API

## Next Tasks
1. Disable email verification in Supabase dashboard
2. Add quiz categories feature
3. Implement study streak tracking
4. Add social sharing for quiz results
5. Consider gamification badges
