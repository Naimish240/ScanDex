// Heuristic field extraction from raw OCR text.
export interface Extracted {
  name?: string;
  title?: string;
  company?: string;
  email?: string;
  phones: string[];
  website?: string;
  linkedin?: string;
  address?: string;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/g;
const URL_RE = /\b((?:https?:\/\/|www\.)[^\s,]+|[a-z0-9-]+\.(?:com|io|co|net|org|dev|ai|app|us|uk|in|de)(?:\/[^\s,]*)?)\b/gi;
const LINKEDIN_RE = /(linkedin\.com\/[^\s,]+|(?:^|\s)in\/[a-z0-9-]+)/i;
const TITLE_HINTS = /\b(CEO|CTO|CFO|COO|VP|Director|Manager|Engineer|Developer|Designer|Founder|Head|Lead|Architect|Consultant|Analyst|Partner|Principal|President|Officer|Specialist|Coordinator|Sales|Marketing)\b/i;
const COMPANY_HINTS = /\b(Inc\.?|LLC|Ltd\.?|Limited|GmbH|Corp\.?|Corporation|Co\.?|Company|Group|Studio|Labs|Systems|Solutions|Technologies|Tech|Consulting)\b/i;

export function extractFields(raw: string): Extracted {
  const text = raw.replace(/\r/g, "");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const emails = text.match(EMAIL_RE) || [];
  const email = emails[0];

  const phoneMatches = (text.match(PHONE_RE) || [])
    .map((p) => p.trim())
    .filter((p) => p.replace(/\D/g, "").length >= 8);
  const phones = Array.from(new Set(phoneMatches)).slice(0, 3);

  let website: string | undefined;
  let linkedin: string | undefined;
  const urls = text.match(URL_RE) || [];
  for (const u of urls) {
    const low = u.toLowerCase();
    if (low.includes("linkedin.com")) linkedin = u;
    else if (!low.includes("@") && !website) website = u;
  }
  if (!linkedin) {
    const li = text.match(LINKEDIN_RE);
    if (li) linkedin = li[0].trim();
  }

  // Name: first line with only letters/spaces, 2-4 words, no digits, no email chars
  let name: string | undefined;
  let title: string | undefined;
  let company: string | undefined;

  for (const line of lines) {
    if (name && title && company) break;
    if (line.includes("@") || /\d/.test(line)) continue;
    const wordCount = line.split(/\s+/).length;
    if (!name && wordCount >= 2 && wordCount <= 4 && /^[A-Za-z.\s'-]+$/.test(line) && line.length < 40) {
      name = line;
      continue;
    }
    if (!title && TITLE_HINTS.test(line)) {
      title = line;
      continue;
    }
    if (!company && COMPANY_HINTS.test(line)) {
      company = line;
    }
  }
  // Fallback company: line after title, or line without email/phone/url
  if (!company) {
    for (const line of lines) {
      if (line === name || line === title) continue;
      if (line.includes("@") || /\d{3,}/.test(line)) continue;
      if (URL_RE.test(line)) continue;
      if (line.length > 2 && line.length < 60) {
        company = line;
        break;
      }
    }
  }

  // Address: line containing a comma and digits or postal-ish pattern
  const address = lines.find(
    (l) => l !== name && l !== title && l !== company && l.includes(",") && /\d/.test(l),
  );

  return { name, title, company, email, phones, website, linkedin, address };
}
