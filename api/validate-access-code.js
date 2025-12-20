/**
 * Student Access Code Validation API Route
 * 
 * Validates a student access code and returns the StudentProfile ID
 * This allows students to access their data without requiring email authentication
 */

// Use the getStudentByAccessCode function from studentData
async function validateAccessCode(code) {
  // Normalize code to uppercase
  const normalizedCode = typeof code === 'string' ? code.toUpperCase().trim() : '';
  
  if (!normalizedCode || normalizedCode.length !== 6) {
    return null;
  }

  try {
    // Import and use the studentData utility function
    // This will work in serverless environments since we're using the client SDK
    const { getStudentByAccessCode } = await import('../src/studentData.js');
    return await getStudentByAccessCode(normalizedCode);
  } catch (error) {
    console.error('Error validating access code:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests (or GET with query param for simplicity)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use POST or GET.' });
  }

  try {
    // Extract access code from request
    let accessCode = null;
    
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      accessCode = body.accessCode || body.code;
    } else {
      // GET request - extract from query params
      accessCode = req.query.accessCode || req.query.code;
    }

    if (!accessCode) {
      return res.status(400).json({ 
        error: 'Access code is required',
        message: 'Please provide an accessCode in the request body or query parameter'
      });
    }

    // Validate the code format
    if (typeof accessCode !== 'string' || accessCode.trim().length !== 6) {
      return res.status(400).json({ 
        error: 'Invalid access code format',
        message: 'Access code must be exactly 6 characters'
      });
    }

    // Validate the code
    const studentProfile = await validateAccessCode(accessCode);

    if (!studentProfile) {
      return res.status(404).json({ 
        error: 'Invalid access code',
        message: 'No student profile found with this access code'
      });
    }

    // Return the student profile ID and basic info
    return res.status(200).json({
      success: true,
      studentProfile: {
        id: studentProfile.id,
        name: studentProfile.name,
        gradeLevel: studentProfile.gradeLevel,
        hasTransitionData: !!studentProfile.transitionData
      }
    });

  } catch (error) {
    console.error('Access code validation error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: 'Failed to validate access code: ' + error.message
    });
  }
}

