# Google Workspace Integration Setup

This document describes the Google Workspace integration features that have been implemented.

## Overview

The application now includes a modular Google Service layer that provides integration with:
- **Google Classroom**: Import student rosters from courses
- **Google Drive**: Save AI-generated documents (IEPs, BIPs, PLAAFPs) as Google Docs

## Installation

Before using Google integration features, install the required dependency:

```bash
npm install googleapis
```

## Files Created/Modified

### 1. Google Service Layer
- **File**: `src/lib/googleService.js`
- **Class**: `GoogleIntegration`
- **Methods**:
  - `listCourses()`: Fetch active courses from Google Classroom
  - `getCourseRoster(courseId)`: Get students from a specific course
  - `createDoc(title, content)`: Create a Google Doc in Drive

### 2. Updated Import Roster Component
- **File**: `src/components/ImportRoster.jsx`
- **Features**:
  - Toggle between "Upload CSV" and "Import from Google Classroom"
  - Course selection dropdown when Classroom mode is active
  - Automatic roster import from selected course
  - Mock data fallback for dev mode

### 3. Updated CopyBlock Component
- **File**: `src/TeacherDashboard.jsx` (CopyBlock function)
- **Features**:
  - "Save to Google Drive" button next to "Copy" button
  - Loading spinner during save
  - "Open Doc" link after successful save
  - Converts markdown to plain text for Google Docs

## OAuth Setup (Required for Production)

To use Google integration in production, you need to:

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable APIs:
     - Google Classroom API
     - Google Drive API
     - Google Docs API

2. **Configure OAuth Consent Screen**:
   - Set up OAuth consent screen
   - Add scopes:
     - `https://www.googleapis.com/auth/classroom.courses.readonly`
     - `https://www.googleapis.com/auth/classroom.rosters.readonly`
     - `https://www.googleapis.com/auth/drive.file`

3. **Get Access Token**:
   - Implement OAuth flow to get user's access token
   - Store token in `localStorage` as `google_access_token`
   - The `getGoogleAccessToken()` function in `googleService.js` retrieves it

## Dev Mode / Mock Data

The integration includes automatic fallback to mock data when:
- Dev mode is active (`DevModeService.isActive()`)
- No access token is available
- API calls fail

This allows you to test the UI without setting up OAuth.

### Mock Data Provided:
- 3 sample courses (Math, ELA, Science)
- 3 sample students per course
- Mock document creation (returns a mock Google Docs link)

## Usage Examples

### Import from Google Classroom

```jsx
import ImportRoster from './components/ImportRoster';

<ImportRoster
  onImportComplete={handleImportComplete}
  onStudentsUpdate={handleStudentsUpdate}
  user={user}
  theme={theme}
/>
```

1. User selects "Google Classroom" toggle
2. System loads available courses
3. User selects a course
4. Clicks "Import Roster from Course"
5. Students are imported (grade/diagnosis fields need manual entry)

### Save to Google Drive

The `CopyBlock` component automatically includes the "Save to Drive" button:

```jsx
<CopyBlock 
  content={bipAnalysis} 
  label="Copy BIP to Documentation" 
  theme={theme}
  title="Behavior Intervention Plan"
/>
```

1. User clicks "Save to Google Drive"
2. Document is created in Drive
3. Button changes to "Saved to Drive"
4. "Open Doc" link appears

## API Endpoints Used

- `GET /classroom/v1/courses?courseStates=ACTIVE` - List courses
- `GET /classroom/v1/courses/{courseId}/students` - Get roster
- `POST /drive/v3/files` - Create document
- `PATCH /docs/v1/documents/{documentId}:batchUpdate` - Update document content

## Error Handling

All Google API calls include:
- Try/catch error handling
- Automatic fallback to mock data
- User-friendly error messages
- Console logging for debugging

## Next Steps

1. **Install googleapis**: `npm install googleapis`
2. **Set up OAuth**: Implement OAuth flow to get access tokens
3. **Test in Dev Mode**: Use mock data to test UI
4. **Configure Scopes**: Ensure all required scopes are requested
5. **Production Testing**: Test with real Google accounts

## Notes

- The service layer is designed to be activated later - it works with mock data until OAuth is configured
- Markdown content is automatically converted to plain text for Google Docs
- Document titles are derived from the `title` prop or `label` prop
- All Google API calls use the REST API directly (not the googleapis library yet) for simplicity


