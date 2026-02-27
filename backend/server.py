from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64
import asyncpg
from supabase import create_client, Client
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase client for auth
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')
DATABASE_URL = os.environ.get('DATABASE_URL')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Database connection pool
db_pool = None

async def get_db_pool():
    global db_pool
    if db_pool is None:
        db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
    return db_pool

# FastAPI app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============= MODELS =============
class UserSignUp(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: Optional[str] = None
    language: str = "en"
    created_at: str

class OCRRequest(BaseModel):
    image_base64: str
    language: str = "en"

class QuizGenerateRequest(BaseModel):
    text: str
    difficulty: str = "medium"
    num_questions: int = 10
    language: str = "en"

class QuizSubmitRequest(BaseModel):
    quiz_data: dict
    score: int
    total: int
    difficulty: str
    time_taken: int

class FriendRequest(BaseModel):
    friend_id: str

class GroupCreate(BaseModel):
    name: str
    members: List[str] = []

class MessageCreate(BaseModel):
    group_id: str
    content: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
    avatar_url: Optional[str] = None

# ============= DATABASE SETUP =============
async def init_db():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Users table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                avatar_url TEXT,
                language TEXT DEFAULT 'en',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        
        # Quiz results table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS quiz_results (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id),
                quiz_data JSONB NOT NULL,
                score INTEGER NOT NULL,
                total INTEGER NOT NULL,
                difficulty TEXT NOT NULL,
                time_taken INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        
        # Leaderboard table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS leaderboard (
                id TEXT PRIMARY KEY,
                user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
                total_score INTEGER DEFAULT 0,
                quizzes_taken INTEGER DEFAULT 0,
                avg_score REAL DEFAULT 0,
                best_score INTEGER DEFAULT 0,
                rank INTEGER DEFAULT 0,
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        
        # Friends table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS friends (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id),
                friend_id TEXT NOT NULL REFERENCES users(id),
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, friend_id)
            )
        ''')
        
        # Groups table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS groups (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_by TEXT NOT NULL REFERENCES users(id),
                members TEXT[] DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        
        # Messages table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                group_id TEXT NOT NULL REFERENCES groups(id),
                sender_id TEXT NOT NULL REFERENCES users(id),
                content TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        
        logger.info("Database tables initialized")

# ============= AUTH HELPERS =============
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        token = credentials.credentials
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            user = await conn.fetchrow('SELECT * FROM users WHERE id = $1', user_response.user.id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found in database")
            
            return dict(user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# ============= AUTH ENDPOINTS =============
@api_router.post("/auth/signup")
async def signup(data: UserSignUp):
    try:
        # Create user in Supabase Auth
        response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
            "options": {
                "data": {"name": data.name}
            }
        })
        
        if not response.user:
            raise HTTPException(status_code=400, detail="Failed to create user")
        
        user_id = response.user.id
        
        # Create user in our database
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.execute('''
                INSERT INTO users (id, email, name, language) 
                VALUES ($1, $2, $3, 'en')
                ON CONFLICT (id) DO NOTHING
            ''', user_id, data.email, data.name)
            
            # Initialize leaderboard entry
            await conn.execute('''
                INSERT INTO leaderboard (id, user_id) 
                VALUES ($1, $2)
                ON CONFLICT (user_id) DO NOTHING
            ''', str(uuid.uuid4()), user_id)
        
        return {
            "message": "User created successfully",
            "user": {
                "id": user_id,
                "email": data.email,
                "name": data.name
            },
            "access_token": response.session.access_token if response.session else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/auth/login")
async def login(data: UserLogin):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })
        
        if not response.user or not response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            user = await conn.fetchrow('SELECT * FROM users WHERE id = $1', response.user.id)
            
            if not user:
                # Create user record if missing
                await conn.execute('''
                    INSERT INTO users (id, email, name, language) 
                    VALUES ($1, $2, $3, 'en')
                ''', response.user.id, data.email, data.email.split('@')[0])
                
                await conn.execute('''
                    INSERT INTO leaderboard (id, user_id) 
                    VALUES ($1, $2)
                    ON CONFLICT (user_id) DO NOTHING
                ''', str(uuid.uuid4()), response.user.id)
                
                user = await conn.fetchrow('SELECT * FROM users WHERE id = $1', response.user.id)
        
        return {
            "access_token": response.session.access_token,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "language": user["language"],
                "avatar_url": user["avatar_url"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=401, detail="Login failed")

@api_router.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "language": current_user["language"],
        "avatar_url": current_user["avatar_url"],
        "created_at": current_user["created_at"].isoformat() if current_user["created_at"] else None
    }

# ============= OCR ENDPOINT =============
@api_router.post("/ocr")
async def extract_text(data: OCRRequest, current_user: dict = Depends(get_current_user)):
    try:
        language_instruction = "Hindi" if data.language == "hi" else "English"
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"ocr-{uuid.uuid4()}",
            system_message=f"You are an OCR expert. Extract all text from the image accurately. The image contains {language_instruction} text from a book. Return ONLY the extracted text, nothing else. Preserve the original language."
        ).with_model("openai", "gpt-5.2")
        
        image_content = ImageContent(image_base64=data.image_base64)
        
        user_message = UserMessage(
            text=f"Extract all text from this book image. The text is in {language_instruction}. Return only the extracted text.",
            image_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        return {
            "text": response,
            "language": data.language
        }
    except Exception as e:
        logger.error(f"OCR error: {e}")
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")

# ============= QUIZ GENERATION =============
@api_router.post("/quiz/generate")
async def generate_quiz(data: QuizGenerateRequest, current_user: dict = Depends(get_current_user)):
    try:
        language_instruction = "Generate questions and answers in Hindi" if data.language == "hi" else "Generate questions and answers in English"
        difficulty_instruction = {
            "easy": "Make questions simple and straightforward, suitable for beginners",
            "medium": "Make questions moderately challenging, testing understanding",
            "hard": "Make questions complex, requiring deep analysis and critical thinking"
        }.get(data.difficulty, "Make questions moderately challenging")
        
        prompt = f"""Based on the following text, create exactly {data.num_questions} multiple choice questions.
        
Text: {data.text}

Instructions:
- {language_instruction}
- {difficulty_instruction}
- Each question must have exactly 4 options (A, B, C, D)
- Provide the correct answer and a brief explanation for each question

Return the response in this exact JSON format:
{{
    "questions": [
        {{
            "question": "Question text here",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": 0,
            "explanation": "Brief explanation why this is correct"
        }}
    ]
}}

Return ONLY valid JSON, no additional text."""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"quiz-{uuid.uuid4()}",
            system_message="You are an expert quiz creator. Generate educational MCQ quizzes from given text. Always respond with valid JSON only."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        try:
            # Clean up response if needed
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            quiz_data = json.loads(response_text.strip())
        except json.JSONDecodeError as je:
            logger.error(f"JSON parse error: {je}, response: {response[:500]}")
            raise HTTPException(status_code=500, detail="Failed to parse quiz response")
        
        return {
            "quiz": quiz_data,
            "difficulty": data.difficulty,
            "language": data.language,
            "num_questions": data.num_questions
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quiz generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

# ============= QUIZ RESULTS =============
@api_router.post("/quiz/submit")
async def submit_quiz(data: QuizSubmitRequest, current_user: dict = Depends(get_current_user)):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            import json
            quiz_id = str(uuid.uuid4())
            
            # Save quiz result
            await conn.execute('''
                INSERT INTO quiz_results (id, user_id, quiz_data, score, total, difficulty, time_taken)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            ''', quiz_id, current_user["id"], json.dumps(data.quiz_data), data.score, data.total, data.difficulty, data.time_taken)
            
            # Update leaderboard
            stats = await conn.fetchrow('''
                SELECT COUNT(*) as count, SUM(score) as total_score, MAX(score) as best_score, AVG(score::float / total::float * 100) as avg_score
                FROM quiz_results WHERE user_id = $1
            ''', current_user["id"])
            
            await conn.execute('''
                UPDATE leaderboard 
                SET total_score = $2, quizzes_taken = $3, avg_score = $4, best_score = $5, updated_at = NOW()
                WHERE user_id = $1
            ''', current_user["id"], int(stats["total_score"] or 0), int(stats["count"] or 0), 
               float(stats["avg_score"] or 0), int(stats["best_score"] or 0))
            
            # Update all ranks
            await conn.execute('''
                WITH ranked AS (
                    SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_score DESC, avg_score DESC) as new_rank
                    FROM leaderboard
                )
                UPDATE leaderboard SET rank = ranked.new_rank
                FROM ranked WHERE leaderboard.user_id = ranked.user_id
            ''')
            
            return {
                "message": "Quiz submitted successfully",
                "quiz_id": quiz_id,
                "score": data.score,
                "total": data.total,
                "percentage": round(data.score / data.total * 100, 1) if data.total > 0 else 0
            }
    except Exception as e:
        logger.error(f"Quiz submit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/quiz/history")
async def get_quiz_history(current_user: dict = Depends(get_current_user)):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            results = await conn.fetch('''
                SELECT id, score, total, difficulty, time_taken, created_at
                FROM quiz_results 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT 50
            ''', current_user["id"])
            
            return [{
                "id": r["id"],
                "score": r["score"],
                "total": r["total"],
                "difficulty": r["difficulty"],
                "time_taken": r["time_taken"],
                "percentage": round(r["score"] / r["total"] * 100, 1) if r["total"] > 0 else 0,
                "created_at": r["created_at"].isoformat()
            } for r in results]
    except Exception as e:
        logger.error(f"Quiz history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= DASHBOARD =============
@api_router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Get leaderboard stats
            stats = await conn.fetchrow('''
                SELECT total_score, quizzes_taken, avg_score, best_score, rank
                FROM leaderboard WHERE user_id = $1
            ''', current_user["id"])
            
            # Get recent quizzes
            recent = await conn.fetch('''
                SELECT score, total, difficulty, created_at
                FROM quiz_results WHERE user_id = $1
                ORDER BY created_at DESC LIMIT 5
            ''', current_user["id"])
            
            return {
                "stats": {
                    "total_quizzes": stats["quizzes_taken"] if stats else 0,
                    "avg_score": round(stats["avg_score"], 1) if stats and stats["avg_score"] else 0,
                    "best_score": stats["best_score"] if stats else 0,
                    "rank": stats["rank"] if stats else 0,
                    "total_points": stats["total_score"] if stats else 0
                },
                "recent_quizzes": [{
                    "score": r["score"],
                    "total": r["total"],
                    "difficulty": r["difficulty"],
                    "percentage": round(r["score"] / r["total"] * 100, 1) if r["total"] > 0 else 0,
                    "created_at": r["created_at"].isoformat()
                } for r in recent]
            }
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= LEADERBOARD =============
@api_router.get("/leaderboard")
async def get_leaderboard(current_user: dict = Depends(get_current_user)):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            leaders = await conn.fetch('''
                SELECT l.rank, l.total_score, l.quizzes_taken, l.avg_score, l.best_score, u.id, u.name, u.avatar_url
                FROM leaderboard l
                JOIN users u ON l.user_id = u.id
                WHERE l.quizzes_taken > 0
                ORDER BY l.rank ASC
                LIMIT 100
            ''')
            
            # Get current user's rank
            user_rank = await conn.fetchrow('''
                SELECT rank, total_score, quizzes_taken, avg_score FROM leaderboard WHERE user_id = $1
            ''', current_user["id"])
            
            return {
                "leaders": [{
                    "rank": l["rank"],
                    "user_id": l["id"],
                    "name": l["name"],
                    "avatar_url": l["avatar_url"],
                    "total_score": l["total_score"],
                    "quizzes_taken": l["quizzes_taken"],
                    "avg_score": round(l["avg_score"], 1) if l["avg_score"] else 0
                } for l in leaders],
                "my_rank": {
                    "rank": user_rank["rank"] if user_rank else 0,
                    "total_score": user_rank["total_score"] if user_rank else 0,
                    "quizzes_taken": user_rank["quizzes_taken"] if user_rank else 0
                }
            }
    except Exception as e:
        logger.error(f"Leaderboard error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= FRIENDS =============
@api_router.get("/friends")
async def get_friends(current_user: dict = Depends(get_current_user)):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Get accepted friends
            friends = await conn.fetch('''
                SELECT u.id, u.name, u.avatar_url, f.status, f.created_at
                FROM friends f
                JOIN users u ON (f.friend_id = u.id AND f.user_id = $1) OR (f.user_id = u.id AND f.friend_id = $1)
                WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted' AND u.id != $1
            ''', current_user["id"])
            
            # Get pending requests
            pending = await conn.fetch('''
                SELECT u.id, u.name, u.avatar_url, f.created_at, f.id as request_id
                FROM friends f
                JOIN users u ON f.user_id = u.id
                WHERE f.friend_id = $1 AND f.status = 'pending'
            ''', current_user["id"])
            
            return {
                "friends": [{
                    "id": f["id"],
                    "name": f["name"],
                    "avatar_url": f["avatar_url"]
                } for f in friends],
                "pending_requests": [{
                    "request_id": p["request_id"],
                    "user_id": p["id"],
                    "name": p["name"],
                    "avatar_url": p["avatar_url"]
                } for p in pending]
            }
    except Exception as e:
        logger.error(f"Friends error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/friends/request")
async def send_friend_request(data: FriendRequest, current_user: dict = Depends(get_current_user)):
    try:
        if data.friend_id == current_user["id"]:
            raise HTTPException(status_code=400, detail="Cannot add yourself as friend")
        
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Check if friend exists
            friend = await conn.fetchrow('SELECT id FROM users WHERE id = $1', data.friend_id)
            if not friend:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Check if already friends or pending
            existing = await conn.fetchrow('''
                SELECT id FROM friends WHERE 
                (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
            ''', current_user["id"], data.friend_id)
            
            if existing:
                raise HTTPException(status_code=400, detail="Friend request already exists")
            
            request_id = str(uuid.uuid4())
            await conn.execute('''
                INSERT INTO friends (id, user_id, friend_id, status)
                VALUES ($1, $2, $3, 'pending')
            ''', request_id, current_user["id"], data.friend_id)
            
            return {"message": "Friend request sent", "request_id": request_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Friend request error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/friends/accept/{request_id}")
async def accept_friend_request(request_id: str, current_user: dict = Depends(get_current_user)):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            result = await conn.execute('''
                UPDATE friends SET status = 'accepted' 
                WHERE id = $1 AND friend_id = $2 AND status = 'pending'
            ''', request_id, current_user["id"])
            
            if result == "UPDATE 0":
                raise HTTPException(status_code=404, detail="Request not found")
            
            return {"message": "Friend request accepted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Accept friend error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/friends/{friend_id}")
async def remove_friend(friend_id: str, current_user: dict = Depends(get_current_user)):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.execute('''
                DELETE FROM friends WHERE 
                (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
            ''', current_user["id"], friend_id)
            
            return {"message": "Friend removed"}
    except Exception as e:
        logger.error(f"Remove friend error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/search")
async def search_users(q: str, current_user: dict = Depends(get_current_user)):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            users = await conn.fetch('''
                SELECT id, name, email, avatar_url FROM users 
                WHERE (name ILIKE $1 OR email ILIKE $1) AND id != $2
                LIMIT 20
            ''', f"%{q}%", current_user["id"])
            
            return [{
                "id": u["id"],
                "name": u["name"],
                "email": u["email"],
                "avatar_url": u["avatar_url"]
            } for u in users]
    except Exception as e:
        logger.error(f"Search users error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= GROUPS =============
@api_router.get("/groups")
async def get_groups(current_user: dict = Depends(get_current_user)):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            groups = await conn.fetch('''
                SELECT g.id, g.name, g.created_by, g.members, g.created_at, u.name as creator_name
                FROM groups g
                JOIN users u ON g.created_by = u.id
                WHERE g.created_by = $1 OR $1 = ANY(g.members)
                ORDER BY g.created_at DESC
            ''', current_user["id"])
            
            return [{
                "id": g["id"],
                "name": g["name"],
                "created_by": g["created_by"],
                "creator_name": g["creator_name"],
                "members": list(g["members"]) if g["members"] else [],
                "member_count": len(g["members"]) + 1 if g["members"] else 1,
                "created_at": g["created_at"].isoformat()
            } for g in groups]
    except Exception as e:
        logger.error(f"Get groups error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/groups")
async def create_group(data: GroupCreate, current_user: dict = Depends(get_current_user)):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            group_id = str(uuid.uuid4())
            await conn.execute('''
                INSERT INTO groups (id, name, created_by, members)
                VALUES ($1, $2, $3, $4)
            ''', group_id, data.name, current_user["id"], data.members)
            
            return {"message": "Group created", "group_id": group_id}
    except Exception as e:
        logger.error(f"Create group error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/groups/{group_id}/members")
async def add_group_member(group_id: str, data: FriendRequest, current_user: dict = Depends(get_current_user)):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Check group exists and user is creator
            group = await conn.fetchrow('SELECT * FROM groups WHERE id = $1', group_id)
            if not group:
                raise HTTPException(status_code=404, detail="Group not found")
            
            if group["created_by"] != current_user["id"]:
                raise HTTPException(status_code=403, detail="Only group creator can add members")
            
            await conn.execute('''
                UPDATE groups SET members = array_append(members, $1) WHERE id = $2
            ''', data.friend_id, group_id)
            
            return {"message": "Member added"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add member error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= MESSAGES =============
@api_router.get("/messages/{group_id}")
async def get_messages(group_id: str, current_user: dict = Depends(get_current_user)):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Check user is in group
            group = await conn.fetchrow('''
                SELECT * FROM groups WHERE id = $1 AND (created_by = $2 OR $2 = ANY(members))
            ''', group_id, current_user["id"])
            
            if not group:
                raise HTTPException(status_code=403, detail="Not a member of this group")
            
            messages = await conn.fetch('''
                SELECT m.id, m.content, m.created_at, m.sender_id, u.name as sender_name, u.avatar_url
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.group_id = $1
                ORDER BY m.created_at ASC
                LIMIT 100
            ''', group_id)
            
            return [{
                "id": m["id"],
                "content": m["content"],
                "sender_id": m["sender_id"],
                "sender_name": m["sender_name"],
                "avatar_url": m["avatar_url"],
                "created_at": m["created_at"].isoformat(),
                "is_mine": m["sender_id"] == current_user["id"]
            } for m in messages]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get messages error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/messages")
async def send_message(data: MessageCreate, current_user: dict = Depends(get_current_user)):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Check user is in group
            group = await conn.fetchrow('''
                SELECT * FROM groups WHERE id = $1 AND (created_by = $2 OR $2 = ANY(members))
            ''', data.group_id, current_user["id"])
            
            if not group:
                raise HTTPException(status_code=403, detail="Not a member of this group")
            
            message_id = str(uuid.uuid4())
            await conn.execute('''
                INSERT INTO messages (id, group_id, sender_id, content)
                VALUES ($1, $2, $3, $4)
            ''', message_id, data.group_id, current_user["id"], data.content)
            
            return {
                "message_id": message_id,
                "content": data.content,
                "sender_id": current_user["id"],
                "sender_name": current_user["name"]
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send message error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= PROFILE =============
@api_router.put("/profile")
async def update_profile(data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            updates = []
            values = [current_user["id"]]
            i = 2
            
            if data.name:
                updates.append(f"name = ${i}")
                values.append(data.name)
                i += 1
            
            if data.language:
                updates.append(f"language = ${i}")
                values.append(data.language)
                i += 1
            
            if data.avatar_url:
                updates.append(f"avatar_url = ${i}")
                values.append(data.avatar_url)
                i += 1
            
            if updates:
                query = f"UPDATE users SET {', '.join(updates)} WHERE id = $1"
                await conn.execute(query, *values)
            
            user = await conn.fetchrow('SELECT * FROM users WHERE id = $1', current_user["id"])
            
            return {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "language": user["language"],
                "avatar_url": user["avatar_url"]
            }
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= ROOT =============
@api_router.get("/")
async def root():
    return {"message": "QZap API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include router and setup CORS
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()
    logger.info("Application started")

@app.on_event("shutdown")
async def shutdown():
    global db_pool
    if db_pool:
        await db_pool.close()
    logger.info("Application shutdown")
