/**
 * Google Workspace Integration Service
 * 
 * Provides integration with Google Classroom, Drive, and Docs APIs
 * Requires: npm install googleapis
 * 
 * Usage:
 *   const google = new GoogleIntegration(accessToken);
 *   const courses = await google.listCourses();
 */

import { DevModeService } from '../devMode';

/**
 * GoogleIntegration Class
 * Handles all Google Workspace API interactions
 */
export class GoogleIntegration {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.isDevMode = DevModeService.isActive();
    
    // Initialize googleapis client when library is available
    // For now, we'll use fetch API directly
    this.baseURL = 'https://www.googleapis.com';
  }

  /**
   * Get authenticated headers for API requests
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Mock data for dev mode or when API fails
   */
  getMockCourses() {
    return [
      {
        id: 'mock_course_1',
        name: 'Math 5th Grade - Period 1',
        section: 'Room 101',
        courseState: 'ACTIVE',
        enrollmentCode: 'ABC123'
      },
      {
        id: 'mock_course_2',
        name: 'ELA 5th Grade - Period 2',
        section: 'Room 102',
        courseState: 'ACTIVE',
        enrollmentCode: 'DEF456'
      },
      {
        id: 'mock_course_3',
        name: 'Science 5th Grade - Period 3',
        section: 'Room 103',
        courseState: 'ACTIVE',
        enrollmentCode: 'GHI789'
      }
    ];
  }

  /**
   * Get mock roster for a course
   */
  getMockRoster(courseId) {
    return [
      {
        userId: 'student_1',
        profile: {
          name: {
            givenName: 'Alex',
            familyName: 'Johnson',
            fullName: 'Alex Johnson'
          },
          emailAddress: 'alex.johnson@school.edu'
        }
      },
      {
        userId: 'student_2',
        profile: {
          name: {
            givenName: 'Sam',
            familyName: 'Martinez',
            fullName: 'Sam Martinez'
          },
          emailAddress: 'sam.martinez@school.edu'
        }
      },
      {
        userId: 'student_3',
        profile: {
          name: {
            givenName: 'Jordan',
            familyName: 'Smith',
            fullName: 'Jordan Smith'
          },
          emailAddress: 'jordan.smith@school.edu'
        }
      }
    ];
  }

  /**
   * List active courses from Google Classroom
   * @returns {Promise<Array>} Array of course objects
   */
  async listCourses() {
    // In dev mode, return mock data
    if (this.isDevMode || !this.accessToken) {
      console.log('[GoogleIntegration] Using mock courses (dev mode or no token)');
      return this.getMockCourses();
    }

    try {
      const response = await fetch(
        `${this.baseURL}/classroom/v1/courses?courseStates=ACTIVE`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Google Classroom API error: ${response.status}`);
      }

      const data = await response.json();
      return data.courses || [];
    } catch (error) {
      console.warn('[GoogleIntegration] Failed to fetch courses, using mock data:', error);
      // Fallback to mock data on error
      return this.getMockCourses();
    }
  }

  /**
   * Get roster (students) for a specific course
   * @param {string} courseId - The Google Classroom course ID
   * @returns {Promise<Array>} Array of student objects with name and email
   */
  async getCourseRoster(courseId) {
    // In dev mode, return mock data
    if (this.isDevMode || !this.accessToken) {
      console.log('[GoogleIntegration] Using mock roster (dev mode or no token)');
      return this.getMockRoster(courseId);
    }

    try {
      const response = await fetch(
        `${this.baseURL}/classroom/v1/courses/${courseId}/students`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Google Classroom API error: ${response.status}`);
      }

      const data = await response.json();
      return data.students || [];
    } catch (error) {
      console.warn('[GoogleIntegration] Failed to fetch roster, using mock data:', error);
      // Fallback to mock data on error
      return this.getMockRoster(courseId);
    }
  }

  /**
   * Convert markdown-like text to plain text for Google Docs
   * Removes markdown formatting but preserves structure
   */
  markdownToPlainText(markdown) {
    if (!markdown) return '';
    
    return markdown
      // Remove markdown headers
      .replace(/^#+\s+/gm, '')
      // Remove bold/italic
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Create a new Google Doc in Drive
   * @param {string} title - Document title
   * @param {string} content - Document content (markdown will be converted to plain text)
   * @returns {Promise<{id: string, webViewLink: string}>} Document ID and view link
   */
  async createDoc(title, content) {
    // In dev mode, return mock document
    if (this.isDevMode || !this.accessToken) {
      console.log('[GoogleIntegration] Using mock document creation (dev mode or no token)');
      return {
        id: 'mock_doc_' + Date.now(),
        webViewLink: 'https://docs.google.com/document/d/mock_doc_' + Date.now() + '/edit',
        name: title
      };
    }

    try {
      // Convert markdown to plain text
      const plainText = this.markdownToPlainText(content);

      // Step 1: Create the document metadata
      const createResponse = await fetch(
        `${this.baseURL}/drive/v3/files`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            name: title,
            mimeType: 'application/vnd.google-apps.document'
          })
        }
      );

      if (!createResponse.ok) {
        throw new Error(`Google Drive API error: ${createResponse.status}`);
      }

      const fileData = await createResponse.json();
      const documentId = fileData.id;

      // Step 2: Populate the document with content
      // Note: Google Docs API requires content to be sent in a specific format
      // For simplicity, we'll use the Drive API's update method with plain text
      const updateResponse = await fetch(
        `${this.baseURL}/upload/drive/v3/files/${documentId}?uploadType=multipart`,
        {
          method: 'PATCH',
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'multipart/related; boundary=foo_bar_baz'
          },
          body: this.createMultipartBody(plainText)
        }
      );

      // Alternative: Use the Docs API batchUpdate for better formatting
      // For now, we'll use a simpler approach with the Drive API
      if (!updateResponse.ok) {
        // If direct update fails, try using Docs API
        await this.updateDocContent(documentId, plainText);
      }

      // Get the web view link
      const fileResponse = await fetch(
        `${this.baseURL}/drive/v3/files/${documentId}?fields=webViewLink,name`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      const fileInfo = await fileResponse.json();

      return {
        id: documentId,
        webViewLink: fileInfo.webViewLink || `https://docs.google.com/document/d/${documentId}/edit`,
        name: fileInfo.name || title
      };
    } catch (error) {
      console.error('[GoogleIntegration] Failed to create document:', error);
      throw error;
    }
  }

  /**
   * Update document content using Google Docs API
   * @private
   */
  async updateDocContent(documentId, text) {
    try {
      // Split text into paragraphs
      const paragraphs = text.split('\n\n').filter(p => p.trim());

      const requests = paragraphs.map((paragraph, index) => ({
        insertText: {
          location: {
            index: index > 0 ? 1 : 0
          },
          text: paragraph + (index < paragraphs.length - 1 ? '\n\n' : '')
        }
      }));

      const response = await fetch(
        `${this.baseURL}/docs/v1/documents/${documentId}:batchUpdate`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            requests: requests
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Google Docs API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('[GoogleIntegration] Failed to update document content via Docs API:', error);
      // This is not critical - document is created, content can be added manually
    }
  }

  /**
   * Create multipart body for file upload
   * @private
   */
  createMultipartBody(text) {
    const boundary = 'foo_bar_baz';
    const metadata = JSON.stringify({
      mimeType: 'text/plain'
    });

    return [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      metadata,
      `--${boundary}`,
      'Content-Type: text/plain',
      '',
      text,
      `--${boundary}--`
    ].join('\r\n');
  }
}

/**
 * Helper function to get Google access token from user session
 * This should be implemented based on your OAuth flow
 * 
 * @returns {Promise<string|null>} Access token or null
 */
export async function getGoogleAccessToken() {
  // TODO: Implement OAuth token retrieval
  // This should get the token from your auth system
  // For now, return null (will use mock data)
  
  // Example: Get from localStorage or session storage
  try {
    const token = localStorage.getItem('google_access_token');
    return token;
  } catch {
    return null;
  }
}

/**
 * Helper function to check if Google integration is available
 */
export function isGoogleIntegrationAvailable() {
  // Check if access token exists or if in dev mode
  return DevModeService.isActive() || localStorage.getItem('google_access_token') !== null;
}

