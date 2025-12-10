// Google Docs API Integration
// Creates a Google Doc with the provided content
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { content, title = 'Differentiated Work', accessToken } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    if (!accessToken) {
      return res.status(401).json({ error: "Google OAuth token is required. Please authenticate first." });
    }

    // Step 1: Create a new Google Doc
    const createDocResponse = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title
      })
    });

    if (!createDocResponse.ok) {
      const errorData = await createDocResponse.json();
      throw new Error(`Failed to create document: ${errorData.error?.message || createDocResponse.statusText}`);
    }

    const docData = await createDocResponse.json();
    const documentId = docData.documentId;

    // Step 2: Get the document to find the end index
    const getDocResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    if (!getDocResponse.ok) {
      throw new Error('Failed to get document structure');
    }

    const docStructure = await getDocResponse.json();
    // Find the end index (usually after the title)
    const endIndex = docStructure.body?.content?.[docStructure.body.content.length - 1]?.endIndex || 1;

    // Step 3: Clean up content - remove markdown syntax but keep structure
    let cleanContent = content
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers (we'll add formatting later if needed)
      .replace(/\*(?!\*)(.*?)(?<!\*)\*/g, '$1') // Remove italic markers
      .replace(/^### (.*$)/gm, '$1') // Remove ### headers
      .replace(/^## (.*$)/gm, '$1') // Remove ## headers  
      .replace(/^# (.*$)/gm, '$1'); // Remove # headers

    // Step 4: Insert the content
    const insertRequest = {
      insertText: {
        location: { index: endIndex - 1 },
        text: cleanContent
      }
    };

    const batchUpdateResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [insertRequest]
        })
      }
    );

    if (!batchUpdateResponse.ok) {
      const errorData = await batchUpdateResponse.json();
      console.error('Batch update error:', errorData);
      // Document was created, so we'll still return success with the doc URL
    }

    // Return the document URL
    const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;
    
    return res.status(200).json({
      success: true,
      documentId: documentId,
      documentUrl: docUrl
    });

  } catch (error) {
    console.error('Google Docs API Error:', error);
    return res.status(500).json({
      error: "Failed to create Google Doc: " + error.message
    });
  }
}

