import fs from 'fs';
import path from 'path';

// Cache the logo base64 content so we only read from disk once
let cachedLogoBase64: string | null = null;

/**
 * Read the CGT Brain logo from public/logos/ and return as base64 string.
 * Cached after first read for performance.
 */
export function getLogoBase64(): string {
  if (cachedLogoBase64) return cachedLogoBase64;

  try {
    const logoPath = path.join(process.cwd(), 'public', 'logos', 'logo-20-dark.png');
    const logoBuffer = fs.readFileSync(logoPath);
    cachedLogoBase64 = logoBuffer.toString('base64');
    return cachedLogoBase64;
  } catch (error) {
    console.warn('⚠️ Could not read logo file:', error);
    // Return a 1x1 transparent PNG as fallback so emails still send
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
}

/**
 * The Content-ID used to reference the logo in email HTML.
 * Use in HTML as: <img src="cid:cgt-brain-logo" />
 */
export const LOGO_CID = 'cgt-brain-logo';

/**
 * Returns the Resend attachment object for the inline logo.
 * Add this to the `attachments` array in resend.emails.send().
 */
export function getLogoAttachment() {
  return {
    filename: 'cgt-brain-logo.png',
    content: getLogoBase64(),
    contentType: 'image/png',
    contentId: LOGO_CID,
  };
}

/**
 * The HTML img tag to use in email templates for the logo.
 */
export const LOGO_IMG_HTML = `<img src="cid:${LOGO_CID}" alt="CGT Brain Logo" width="44" height="44" style="width: 44px; height: 44px; display: block; border: 0;" />`;
