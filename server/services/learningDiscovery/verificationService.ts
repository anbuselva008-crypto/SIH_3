import type { DiscoveredResource, VerificationStatus } from './types.ts';

export class VerificationService {
  /**
   * Validates URL structure and safe protocols
   */
  public static isValidUrl(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      // Only allow safe HTTP and HTTPS protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }
      // Check that hostname contains a valid dot and no malicious characters
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        return false;
      }
      // Disallow localhost / internal private IPs
      if (
        parsed.hostname === 'localhost' ||
        parsed.hostname.startsWith('127.') ||
        parsed.hostname.startsWith('192.168.') ||
        parsed.hostname.startsWith('10.') ||
        parsed.hostname.startsWith('172.16.')
      ) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Determines verification status based on domain authority and checks
   */
  public static verifyResource(resource: DiscoveredResource): {
    isValid: boolean;
    status: VerificationStatus;
  } {
    if (!this.isValidUrl(resource.url)) {
      return { isValid: false, status: 'Not Verified' };
    }

    try {
      const parsed = new URL(resource.url);
      const host = parsed.hostname.toLowerCase();

      // Tier 1 Official Government Domains
      const isOfficialGov = 
        host.endsWith('.gov.in') || 
        host.endsWith('.nic.in') ||
        host === 'karmayogi.gov.in' ||
        host === 'swayam.gov.in' ||
        host === 'mospi.gov.in';

      if (isOfficialGov) {
        return { isValid: true, status: 'Verified' };
      }

      // Tier 2 Recognized Educational & Public Institutions
      const isInstitutional =
        host.endsWith('.ac.in') ||
        host.endsWith('.edu.in') ||
        host.endsWith('.edu') ||
        host === 'nptel.ac.in';

      if (isInstitutional) {
        return { isValid: true, status: 'Institutional' };
      }

      // If demo catalogue resource, it is already authenticated in prototype
      if (resource.source_type === 'demo_catalogue') {
        return { isValid: true, status: 'Verified' };
      }

      // General web resource with valid URL structure
      return { isValid: true, status: 'Not Verified' };
    } catch {
      return { isValid: false, status: 'Not Verified' };
    }
  }

  /**
   * Sanitizes title and description strings (prevent XSS / HTML injection)
   */
  public static sanitizeString(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  }
}
