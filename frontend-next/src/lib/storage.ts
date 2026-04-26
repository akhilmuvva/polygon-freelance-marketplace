/**
 * StorageService: Handles uploads to IPFS via Pinata.
 */

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_API_SECRET = process.env.NEXT_PUBLIC_PINATA_API_SECRET;

export const uploadMetadata = async (metadata: any) => {
  if (!PINATA_API_KEY || !PINATA_API_SECRET) {
    console.warn('[STORAGE] Pinata keys missing. Falling back to local demo mode.');
    const mockCid = `demo-cid-${Date.now()}`;
    if (typeof window !== 'undefined') {
        localStorage.setItem(mockCid, JSON.stringify(metadata));
    }
    return { cid: mockCid };
  }

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `zenith-mission-${Date.now()}`,
          keyvalues: { app: 'polylance-zenith', type: 'mission-metadata' }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.reason || data.error || 'Pinata Upload Failed');
    
    return { cid: data.IpfsHash };
  } catch (error) {
    console.error('[STORAGE] Upload error:', error);
    throw error;
  }
};

export const uploadFile = async (file: File) => {
  if (!PINATA_API_KEY || !PINATA_API_SECRET) {
    return { cid: `demo-file-${Date.now()}` };
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET,
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Pinata File Upload Failed');

    return { cid: data.IpfsHash };
  } catch (error) {
    console.error('[STORAGE] File upload error:', error);
    throw error;
  }
};
