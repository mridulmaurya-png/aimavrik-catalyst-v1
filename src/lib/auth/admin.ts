export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const adminEmailsVar = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  const adminEmails = adminEmailsVar.split(",").map(e => e.trim().toLowerCase());
  
  return adminEmails.includes(email.toLowerCase());
}
