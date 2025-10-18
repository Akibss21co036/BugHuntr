import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Simple intelligent responses based on keywords
    const input = message.toLowerCase();
    let response = "";

    // Educational content about cybersecurity and bug bounties
    if (input.includes('xss') || input.includes('cross-site scripting')) {
      response = "🚨 **XSS (Cross-Site Scripting)**\n\n**What is XSS?**\nA vulnerability that allows attackers to inject malicious scripts into web pages viewed by other users.\n\n**Types of XSS:**\n• **Reflected XSS** - Script executed immediately from URL\n• **Stored XSS** - Script saved in database, executed later\n• **DOM-based XSS** - Client-side script manipulation\n\n**Impact:** Session hijacking, data theft, website defacement\n**Prevention:** Input validation, output encoding, CSP headers";
    } else if (input.includes('sql injection') || input.includes('sqli')) {
      response = "💉 **SQL Injection**\n\n**What is SQL Injection?**\nA code injection technique that exploits vulnerabilities in database queries.\n\n**How it works:**\n• Malicious SQL code inserted into input fields\n• Database executes unintended commands\n• Can lead to data breach or system compromise\n\n**Types:**\n• **Union-based** - Combine malicious query with legitimate one\n• **Boolean-based** - True/false responses reveal data\n• **Time-based** - Database delays indicate vulnerability\n\n**Prevention:** Parameterized queries, input validation, least privilege";
    } else if (input.includes('csrf') || input.includes('cross-site request forgery')) {
      response = "🔀 **CSRF (Cross-Site Request Forgery)**\n\n**What is CSRF?**\nAn attack that forces users to execute unwanted actions on applications where they're authenticated.\n\n**How it works:**\n• Victim is logged into vulnerable application\n• Attacker tricks victim into clicking malicious link\n• Unwanted action performed with victim's credentials\n\n**Examples:**\n• Changing email/password\n• Making financial transactions\n• Posting content as the victim\n\n**Prevention:** CSRF tokens, SameSite cookies, origin validation";
    } else if (input.includes('mitm') || input.includes('man in the middle')) {
      response = "📡 **Man-in-the-Middle (MITM) Attacks**\n\n**What is MITM?**\nAn attack where the attacker secretly intercepts and potentially alters communications between two parties.\n\n**Common Scenarios:**\n• **WiFi Eavesdropping** - Intercepting traffic on unsecured networks\n• **SSL Stripping** - Downgrading HTTPS to HTTP\n• **DNS Spoofing** - Redirecting traffic to malicious servers\n• **ARP Poisoning** - Network-level traffic interception\n\n**Protection:**\n• Use HTTPS everywhere\n• Verify SSL certificates\n• Use VPN on public WiFi\n• Enable HSTS headers";
    } else if (input.includes('rce') || input.includes('remote code execution')) {
      response = "💥 **Remote Code Execution (RCE)**\n\n**What is RCE?**\nA vulnerability that allows attackers to execute arbitrary code on a remote system.\n\n**Common Causes:**\n• **Deserialization flaws** - Unsafe object reconstruction\n• **File upload vulnerabilities** - Executing uploaded files\n• **Command injection** - OS command execution\n• **Buffer overflows** - Memory corruption exploitation\n\n**Impact:**\n• Complete system compromise\n• Data theft and manipulation\n• Lateral movement in networks\n• Installation of backdoors\n\n**This is typically rated as CRITICAL severity due to its severe impact.**";
    } else if (input.includes('social engineering') || input.includes('phishing')) {
      response = "🎭 **Social Engineering & Phishing**\n\n**Social Engineering:**\nPsychological manipulation to trick people into revealing confidential information or performing actions.\n\n**Common Techniques:**\n• **Phishing** - Fraudulent emails/websites\n• **Pretexting** - Creating false scenarios\n• **Baiting** - Offering something enticing\n• **Tailgating** - Following authorized personnel\n• **Quid pro quo** - Offering services for information\n\n**Phishing Indicators:**\n• Urgent or threatening language\n• Suspicious sender addresses\n• Generic greetings\n• Unexpected attachments\n• Suspicious links\n\n**Protection:** Security awareness training, email filtering, multi-factor authentication";
    } else if (input.includes('session') && (input.includes('hijacking') || input.includes('fixation'))) {
      response = "🔐 **Session Security Issues**\n\n**Session Hijacking:**\nStealing user's session ID to impersonate them.\n\n**Methods:**\n• **Packet sniffing** - Intercepting network traffic\n• **XSS attacks** - JavaScript stealing session cookies\n• **Session sidejacking** - WiFi packet capture\n• **Malware** - Local session theft\n\n**Session Fixation:**\nForcing user to use attacker-controlled session ID.\n\n**Prevention:**\n• Use HTTPS for all authenticated pages\n• Regenerate session IDs after login\n• Set secure and HttpOnly cookie flags\n• Implement session timeout\n• Use strong session ID generation";
    } else if (input.includes('directory traversal') || input.includes('path traversal')) {
      response = "📁 **Directory/Path Traversal**\n\n**What is Directory Traversal?**\nA vulnerability that allows attackers to access files outside the intended directory.\n\n**How it works:**\n• Using `../` sequences to navigate up directories\n• Accessing sensitive files like `/etc/passwd`\n• Reading configuration files or source code\n• Potential for code execution in some cases\n\n**Example Attack:**\n`http://example.com/view?file=../../../etc/passwd`\n\n**Prevention:**\n• Input validation and sanitization\n• Use whitelists for allowed files\n• Implement proper access controls\n• Avoid user input in file paths\n• Use secure coding practices";
    } else if (input.includes('api security') || input.includes('rest api')) {
      response = "🔌 **API Security**\n\n**Common API Vulnerabilities:**\n\n• **Broken Authentication** - Weak API key management\n• **Excessive Data Exposure** - Returning too much data\n• **Lack of Rate Limiting** - No request throttling\n• **Injection Flaws** - SQL, NoSQL, command injection\n• **Improper Authorization** - Access control issues\n• **Security Misconfiguration** - Default settings\n• **Mass Assignment** - Binding user input to objects\n\n**API Security Best Practices:**\n• Use OAuth 2.0 or JWT for authentication\n• Implement rate limiting and throttling\n• Validate and sanitize all inputs\n• Use HTTPS everywhere\n• Implement proper logging and monitoring\n• Version your APIs securely\n• Apply the principle of least privilege";
    } else if (input.includes('cryptography') || input.includes('encryption')) {
      response = "🔒 **Cryptography & Encryption**\n\n**Types of Encryption:**\n• **Symmetric** - Same key for encryption/decryption (AES)\n• **Asymmetric** - Public/private key pairs (RSA, ECC)\n• **Hashing** - One-way functions (SHA-256, bcrypt)\n\n**Common Crypto Vulnerabilities:**\n• **Weak encryption algorithms** - MD5, SHA-1, DES\n• **Poor key management** - Hardcoded keys, weak generation\n• **Insufficient randomness** - Predictable values\n• **Padding oracle attacks** - CBC mode vulnerabilities\n• **Side-channel attacks** - Timing, power analysis\n\n**Best Practices:**\n• Use industry-standard algorithms (AES-256, RSA-2048+)\n• Implement proper key rotation\n• Use secure random number generators\n• Apply perfect forward secrecy\n• Regularly update crypto libraries";
    } else if (input.includes('navigation') || input.includes('navigate')) {
      response = "🧭 **Navigation Help**\n\nI can help you navigate to any part of BugHuntr:\n\n• Say 'Navigate to [page]' for quick access\n• Available pages: feed, dashboard, profile, submissions, communities, leaderboard\n• Admin users can access admin panel and management tools\n\nWhat would you like to explore?";
    } else if (input.includes('submit') && input.includes('bug')) {
      response = "🐛 **Bug Submission Guide**\n\n1. **Document the vulnerability** with clear steps to reproduce\n2. **Assess the severity** (Critical/High/Medium/Low)\n3. **Provide evidence** like screenshots or proof-of-concept\n4. **Submit through our form** with all required details\n5. **Wait for review** - our admin team will validate and assign bounty\n\nReady to submit? I can navigate you to the submission page!";
    } else if (input.includes('admin') && input.includes('panel')) {
      response = "🔑 **Admin Panel Access**\n\nAdmin features include:\n• **Submission Management** - Review and validate bug reports\n• **Bug Hunt Creation** - Organize security challenges\n• **User Migration** - Manage user accounts and data\n• **Platform Utilities** - Administrative tools and analytics\n\nNote: Admin access required for these features.";
    } else if (input.includes('community') || input.includes('communities')) {
      response = "👥 **Community Features**\n\n• **Join specialized communities** based on your interests\n• **Web App Security, Mobile Security, IoT Security** and more\n• **Participate in discussions** and knowledge sharing\n• **Exclusive bug hunt events** for community members\n• **Mentorship opportunities** with experienced researchers\n\nCommunities are great for networking and learning!";
    } else if (input.includes('leaderboard') || input.includes('ranking')) {
      response = "🏆 **Leaderboard System**\n\n• **Points-based ranking** for valid vulnerability submissions\n• **Severity multipliers** - Critical bugs earn more points\n• **Monthly competitions** with fresh rankings\n• **Achievement system** for milestones and accomplishments\n• **Public recognition** for top security researchers\n\nCheck your current ranking and compete with others!";
    } else {
      response = "🤖 **BugHuntr Assistant**\n\nI'm here to help you navigate and understand our security platform!\n\n**I can help with:**\n• Platform navigation and features\n• Bug submission process and guidelines\n• Community information and benefits\n• Leaderboard and ranking system\n• Admin panel features (for admins)\n• **Cybersecurity education** - vulnerabilities, attacks, defenses\n\n**Try asking:**\n• 'What is a bug bounty?'\n• 'Explain XSS vulnerabilities'\n• 'How does SQL injection work?'\n• 'Navigate to my profile'\n• 'Tell me about OWASP Top 10'\n\nWhat would you like to know?";
    }
    
    return NextResponse.json({
      response: response,
      session_id: 'bughuntr-session',
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json({
      response: "🔧 **Technical Assistance**\n\nI'm experiencing some technical difficulties, but I can still help you with:\n\n• **Quick Navigation** - Say 'Navigate to [page]'\n• **Platform Information** - Ask about features and processes\n• **General Guidance** - Bug submission, communities, rankings\n\nWhat would you like help with?",
      session_id: 'error-session',
    }, { status: 200 });
  }
}