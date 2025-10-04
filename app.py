from flask import Flask, request, jsonify
from pydantic import BaseModel, ValidationError
from groq import AsyncGroq
import asyncio
import os
import logging
from flask_cors import CORS
import re
from typing import Tuple, List, Dict, Any
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")

if not GROQ_API_KEY:
    print("GROQ_API_KEY not set, bug analysis may not work")

if not EMERGENT_LLM_KEY:
    raise RuntimeError("EMERGENT_LLM_KEY environment variable not set")

if GROQ_API_KEY:
    client = AsyncGroq(api_key=GROQ_API_KEY)

class BugReport(BaseModel):
    title: str
    description: str

class ChatMessage(BaseModel):
    message: str
    session_id: str = "default"

@app.route("/", methods=["GET"])
def root():
    return jsonify({"message": "API is running"})

@app.route("/api/chat", methods=["POST"])
def chat_endpoint():
    """BugHuntr Assistant chat endpoint"""
    try:
        data = request.json
        chat_data = ChatMessage(**data)
        
        # Use asyncio to run the async chat function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        response = loop.run_until_complete(process_chat_message(chat_data))
        loop.close()
        
        return jsonify({"response": response})
    
    except ValidationError as ve:
        logging.error(f"Chat validation error: {ve}", exc_info=True)
        return jsonify({"error": "Invalid chat message format"}), 400
    
    except Exception as e:
        logging.error(f"Error in chat endpoint: {e}", exc_info=True)
        return jsonify({"error": "Error processing chat message"}), 500

async def process_chat_message(chat_data: ChatMessage) -> str:
    """Process chat message using Emergent LLM"""
    try:
        # Initialize the chat with Emergent LLM key
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=chat_data.session_id,
            system_message=BUGHUNTR_ASSISTANT_PROMPT
        ).with_model("openai", "gpt-4o-mini")  # Using GPT-4o-mini for efficiency
        
        # Create user message
        user_message = UserMessage(text=chat_data.message)
        
        # Get response from LLM
        response = await chat.send_message(user_message)
        
        # Ensure response is concise (max ~250 tokens as specified)
        if len(response) > 1200:  # Rough token estimate
            response = response[:1200] + "..."
            
        return response
        
    except Exception as e:
        logging.error(f"Error processing chat message: {e}", exc_info=True)
        return "I'm sorry, I'm having trouble processing your request right now. Please try again or check the documentation in the /docs section."

# -------------------------
# Deterministic rule classifier
# -------------------------
def classify_with_rules(title: str, desc: str) -> Tuple[str, str]:
    s = (title + " " + desc).lower()

    # CRITICAL indicators
    critical_phrases = [
        "full database dump", "full db dump", "database dump",
        "data exfiltrat", "remote code execution", "rce",
        "full system takeover", "root shell", "credentials leaked",
        "credentials leak", "credentials stolen", "data leaked"
    ]
    for p in critical_phrases:
        if p in s:
            return "Critical", "explicit_critical_phrase"

    # HIGH indicators
    high_phrases = [
        "privilege escalation", "auth bypass", "authentication bypass",
        "gain admin", "become admin", "elevat", "write access to sensitive",
        "access sensitive data", "modify users", "create admin",
        "unauthenticated access to", "access to sensitive"
    ]
    for p in high_phrases:
        if p in s:
            return "High", "explicit_high_phrase"

    # MEDIUM indicators (info disclosure, schema leaks, etc.)
    medium_phrases = [
        "table", "column", "schema", "schema info", "verbose error",
        "error message", "stack trace", "information disclosure",
        "reveals", "revealed", "expose", "exposes", "sql error",
        "sql exception", "helps attackers", "reconnaiss", "reconnaissance",
        "no direct data", "no data compromised", "no data leak"
    ]
    medium_count = sum(1 for p in medium_phrases if p in s)
    if medium_count >= 1:
        if any(k in s for k in ["no direct data", "no data compromised", "no data leak"]):
            return "Medium", "info_disclosure_no_data"
        return "Medium", "info_disclosure"

    # LOW indicators
    low_phrases = [
        "x-frame-options", "missing header", "content-security-policy",
        "csp", "http-only", "strict-transport-security", "hsts",
        "best practise", "best practice", "minor", "typo", "ui issue",
        "cosmetic", "ui-only"
    ]
    for p in low_phrases:
        if p in s:
            return "Low", "low_best_practice"

    return None, "inconclusive"

# -------------------------
# BugHuntr Assistant System Prompt
# -------------------------
BUGHUNTR_ASSISTANT_PROMPT = """You are **BugHuntr Assistant**, a focused, trustworthy chatbot built into the BugHuntr web app. Your job is to **help users understand and navigate the site**, answer questions about features and data paths, give short copy-paste Firebase v9 code snippets, and provide step-by-step help for common tasks (join/create communities, post, comment, upload attachments, report duplicates, find settings). Be concise, accurate, and friendly. Avoid speculation — if unsure, say "I'm not sure; here's how to check" and point to the exact file, console, or route.

CONFIG:
- Preferred reply length: **very short** (1–6 sentences) + optional 3–6 step list or tiny code block.
- Max tokens per reply: ~250 (the caller will enforce in API).
- Temperature: 0.15 (low hallucination).
- When returning code, keep snippets ≤ 12 lines and use Firebase v9 modular style.
- NEVER include API keys or secrets in responses.

CONTEXT (use this to answer user queries; keep answers oriented to these facts):
- Purpose: collaborative bug-reporting + community discussion app with AI-powered severity analysis.
- Key pages/flows: Home (communities list) → Community page (posts + join/leave + create post) → Post detail (comments) → Create Community modal → Profile / Dashboard → Bug Submit with severity analysis.
- Bug Analysis: BugHuntr includes automatic severity classification (Critical/High/Medium/Low) using AI analysis of bug titles and descriptions.
- Firestore schema (exact paths — give these when asked):
  - Communities: `/communities/{communityId}` → { id, slug, name, description, createdBy, createdAt, privacy: "public"|"private", membersCount, moderators[], tags[], avatarUrl }
  - Members: `/communityMembers/{communityId}/members/{uid}` → { uid, role: "member"|"moderator"|"owner", joinedAt, displayName, photoURL }
  - Posts: `/communityPosts/{communityId}/posts/{postId}` → { id, authorUid, authorDisplayName, authorPhotoURL, title, content, attachments[], createdAt, updatedAt, likesCount, commentsCount, visibility, severityTag }
  - Comments: `/communityPosts/{communityId}/posts/{postId}/comments/{commentId}` → { id, authorUid, content, createdAt, parentCommentId? }
  - Notifications: `/notifications/{userId}/notifications/{notifId}` → { id, type, payload, read, createdAt }
- Storage conventions:
  - Community avatars: `communityAvatars/{communityId}/avatar.jpg`
  - Post attachments: `communityPosts/{communityId}/{postId}/{filename}`

INSTRUCTIONS — Behavior rules (always follow):
1. **Answer concisely first** (1–2 lines). Then optionally give a short numbered list (3–6 steps) or tiny Firebase code snippet.
2. **Always** provide exact Firestore/storage paths when the user asks where data is saved.
3. Use Firebase v9 modular snippets only when user asks for code. Keep snippets copy/paste ready and ≤12 lines.
4. For operations that should be server-side (mass notifications, admin-only actions), explicitly recommend Cloud Functions and **do not** give admin credentials or insecure client-side patterns.
5. If the user asks DevOps/deployment steps, give minimal commands and exact file names (e.g., `firebase.json`, `firebase.rules`), and mention Firestore Rules must be edited in the Firebase console or deployed from `firebase deploy --only firestore:rules`.
6. Respect free Gemini key constraints: keep single replies short; suggest paginating long answers.
7. If the user asks for longer code or files, respond: "I can paste the full file — say 'paste full file'" and wait for explicit request.

FEW-SHOT EXAMPLES (imitate style — concise + steps or snippet):

Q: How do I join a community?
A: Short: Click **Join** on the community page. Steps: 1) Open `/community/{communityId}`. 2) Click Join — client writes `/communityMembers/{communityId}/members/{yourUid}` with `role: "member"`. 3) The app updates `membersCount` in `/communities/{communityId}`. Need the exact client code?

Q: Where are posts stored?
A: Posts are in Firestore at `communityPosts/{communityId}/posts/{postId}`. Each post includes `authorUid`, `title`, `content`, `attachments[]`, and timestamps.

Q: How does bug severity analysis work?
A: BugHuntr uses AI to automatically classify bug severity as Critical, High, Medium, or Low based on the title and description. Submit bugs via `/submit` and the system analyzes impact level using the `/api/analyzeSeverity` endpoint.

Q: Create a post (code)?
A: Short snippet:
```js
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
await addDoc(collection(db, "communityPosts", communityId, "posts"), {
  authorUid: auth.currentUser.uid, title, content, createdAt: serverTimestamp(), likesCount:0
});
```

Remember to be helpful, concise, and accurate. If you don't know something specific about BugHuntr, say so and guide them to check the relevant documentation or settings."""

# -------------------------
# Strict LLM system prompt
# -------------------------
SYSTEM_PROMPT = (
    "You are a security vulnerability severity classification assistant. "
    "INPUT: title and short description of a bug report. "
    "TASK: Return EXACTLY ONE label: Critical, High, Medium, or Low. "
    "DEFINITIONS (IMMEDIATE IMPACT ONLY): "
    "- Critical: immediate unauthenticated RCE, immediate full database dump, full admin takeover, or equivalent catastrophic impact. "
    "- High: immediate significant data loss, privilege escalation, or auth bypass exposing sensitive data or admin controls. "
    "- Medium: information disclosure, useful reconnaissance, or non-catastrophic vulnerabilities. "
    "- Low: minor misconfigurations or best-practice issues without direct impact. "
    "RULES: 1) Classify based ONLY on the information given and ONLY on immediate impact. "
    "2) Do NOT escalate severity solely because the issue 'could' enable further attacks. "
    "3) If the description says 'no direct data compromise' or similar, treat info leak as Medium. "
    "REPLY with ONLY one label and NOTHING ELSE."
)

# -------------------------
# Main async analyzer
# -------------------------
async def analyze_severity_async(bug: BugReport):
    title = bug.title
    desc = bug.description
    s = (title + " " + desc).lower()

    # Rule-based classification
    rule_label, rule_reason = classify_with_rules(title, desc)
    if rule_label is not None:
        logging.debug(f"Rule classifier chose {rule_label} ({rule_reason}) for: {title}")
        label = rule_label
    else:
        # Fall back to LLM if rules inconclusive
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Title: {title}\nDescription: {desc}"}
        ]
        try:
            if not GROQ_API_KEY or 'client' not in globals():
                label = "Medium"
            else:
                completion = await client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    temperature=0.0,
                    max_completion_tokens=12,
                    top_p=1,
                    stream=False
                )
                severity_raw = completion.choices[0].message.content.strip()
                severity = re.sub(r'[^A-Za-z]', '', severity_raw).capitalize()
                valid_labels = {"Critical", "High", "Medium", "Low"}
                label = severity if severity in valid_labels else "Medium"
        except Exception:
            logging.exception("Error calling model, falling back to Medium.")
            label = "Medium"

    # Override: schema info + facilitation markers → High
    schema_terms = ["schema", "table", "column", "sql exception", "verbose error"]
    facilitation_terms = [
        "lowers barrier", "helps attacker", "helps attackers",
        "facilitat", "targeted sql", "precise sql",
        "materially lowers", "significantly lowers"
    ]
    if any(t in s for t in schema_terms) and any(f in s for f in facilitation_terms):
        logging.debug("Override: schema + facilitation detected → High")
        label = "High"

    # Safeguard: only Critical if explicit catastrophic indicators present
    critical_indicators = [
        "full database dump", "database dump", "data exfiltrat",
        "data leaked", "remote code execution", "rce", "root shell"
    ]
    if label == "Critical" and not any(k in s for k in critical_indicators):
        logging.info("Downgrading Critical to High (no explicit catastrophic evidence).")
        label = "High"

    return label

# -------------------------
# Flask endpoint wrapper
# -------------------------
@app.route("/api/analyzeSeverity", methods=["POST"])
def analyze_severity():
    try:
        if not GROQ_API_KEY:
            return jsonify({"error": "Bug analysis service temporarily unavailable"}), 503
            
        data = request.json
        bug = BugReport(**data)

        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            severity = loop.run_until_complete(analyze_severity_async(bug))
            loop.close()
        except RuntimeError:
            severity = asyncio.get_event_loop().run_until_complete(analyze_severity_async(bug))

        return jsonify({"severity": severity})

    except ValidationError as ve:
        logging.error(f"Validation error: {ve}", exc_info=True)
        return jsonify({"error": "Invalid input data"}), 400

    except Exception as e:
        logging.error(f"Error in analyze_severity: {e}", exc_info=True)
        return jsonify({"error": "Error processing request."}), 500

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    app.run(host="0.0.0.0", port=8000)

