"use client"
import { useParams, useRouter } from "next/navigation"
import { BugDetailsContent } from "@/components/bug-details/bug-details-content"
import { RelatedBugsSidebar } from "@/components/bug-details/related-bugs-sidebar"

// Mock data - in a real app this would come from an API
const mockBugDetails = {
  1: {
    id: 1,
    title: "SQL Injection in User Authentication",
    severity: "critical" as const,
    category: "Web Application",
    company: "TechCorp",
    description: `This critical SQL injection vulnerability was discovered in the user authentication system of TechCorp's main web application. The vulnerability exists in the login endpoint where user-supplied input is directly concatenated into SQL queries without proper sanitization or parameterization.

The affected endpoint is /api/auth/login, which processes POST requests containing username and password fields. Due to insufficient input validation, an attacker can inject malicious SQL code through the username parameter, potentially gaining unauthorized access to the database.

**Impact:**
- Complete database compromise
- Unauthorized access to user credentials
- Potential data exfiltration of sensitive customer information
- Administrative privilege escalation

**Affected Systems:**
- Main web application (app.techcorp.com)
- User authentication service
- Customer database (PostgreSQL 12.x)`,
    postedTime: "2 hours ago",
    isLocked: false,
    author: "security_researcher_01",
    bounty: 5000,
    views: 234,
    poc: `**Proof of Concept:**

1. Navigate to the login page at https://app.techcorp.com/login
2. In the username field, enter the following payload:
   \`admin' OR '1'='1' --\`
3. Enter any value in the password field
4. Submit the form

**Expected Result:**
The application should reject the login attempt and display an error message.

**Actual Result:**
The application bypasses authentication and logs in as the first user in the database (typically an admin account).

**SQL Query (Vulnerable):**
\`\`\`sql
SELECT * FROM users WHERE username = 'admin' OR '1'='1' --' AND password = 'anything'
\`\`\`

**Remediation:**
Use parameterized queries or prepared statements:
\`\`\`sql
SELECT * FROM users WHERE username = ? AND password = ?
\`\`\``,
    timeline: [
      { date: "2024-01-15", event: "Vulnerability discovered during security audit" },
      { date: "2024-01-16", event: "Initial report submitted to TechCorp security team" },
      { date: "2024-01-17", event: "Vulnerability confirmed by security team" },
      { date: "2024-01-20", event: "Fix deployed to production environment" },
      { date: "2024-01-22", event: "Public disclosure approved" },
    ],
    tags: ["SQL Injection", "Authentication", "Critical", "Web Security", "Database"],
    cvss: "9.8",
    cwe: "CWE-89",
  },
}

const relatedBugs = [
  {
    id: 2,
    title: "XSS Vulnerability in Comment System",
    severity: "high" as const,
    company: "SocialApp",
    bounty: 2500,
  },
  {
    id: 7,
    title: "Server-Side Request Forgery",
    severity: "high" as const,
    company: "CloudService",
    bounty: 3000,
  },
  {
    id: 8,
    title: "Privilege Escalation in Admin Panel",
    severity: "high" as const,
    company: "AdminSuite",
    bounty: 3500,
  },
]

export default function BugDetailsPage() {
  const params = useParams()
  const router = useRouter()

  const bugId = Number.parseInt(params.id as string)
  const bug = mockBugDetails[bugId as keyof typeof mockBugDetails]

  if (!bug) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Bug Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested vulnerability report could not be found.</p>
          <button onClick={() => router.push("/feed")} className="text-cyber-blue hover:underline">
            Return to Bug Feed
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-6 p-6 pb-20 md:pb-6">
      <main className="flex-1 max-w-4xl">
        <BugDetailsContent bug={bug} />
      </main>

      <aside className="hidden lg:block w-80">
        <RelatedBugsSidebar bugs={relatedBugs} />
      </aside>
    </div>
  )
}
