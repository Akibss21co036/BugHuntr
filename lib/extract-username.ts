/**
 * Extracts username from email address
 * @param email - Email address like "xyz@gmail.com"
 * @returns Username like "xyz"
 */
export function extractUsernameFromEmail(email: string): string {
  if (!email) return ""
  
  // Extract the part before @ symbol
  const username = email.split("@")[0]
  
  // Remove any dots, dashes, or numbers for cleaner username
  // But keep the original if it's already clean
  return username.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()
}

/**
 * Gets display username - uses existing username or extracts from email
 * @param username - Existing username
 * @param email - Email to extract from if no username
 * @returns Display username
 */
export function getDisplayUsername(username?: string, email?: string): string {
  if (username && username.trim()) {
    return username.trim()
  }
  
  if (email) {
    return extractUsernameFromEmail(email)
  }
  
  return "user"
}