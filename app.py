from flask import Flask, request, jsonify
from pydantic import BaseModel, ValidationError
from groq import AsyncGroq
import asyncio
import os
import logging
from flask_cors import CORS
import re
from typing import Tuple

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY environment variable not set")

client = AsyncGroq(api_key=GROQ_API_KEY)

class BugReport(BaseModel):
    title: str
    description: str

@app.route("/", methods=["GET"])
def root():
    return jsonify({"message": "API is running"})

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

