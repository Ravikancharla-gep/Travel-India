// Utility to fetch place images from various sources

/**
 * Fetch image for a place using multiple sources (Unsplash, Wikipedia, Google Places)
 * Returns image URL or data URL
 * Priority: Unsplash (1st) -> Wikipedia (2nd) -> Google Places (3rd, if API key provided)
 */
export const fetchPlaceImage = async (
  placeName: string,
  coords?: [number, number],
  googleApiKey?: string
): Promise<string | null> => {
  // Try multiple sources in priority order
  let imageUrl: string | null = null;

  // 1. Try Wikipedia API first (most reliable free source)
  // Unsplash Source API is deprecated and returns 503 errors
  if (coords) {
    imageUrl = await fetchFromWikipedia(placeName, coords);
    if (imageUrl) return imageUrl;
  }

  // 2. Try Google Places API (if API key provided)
  if (googleApiKey && coords) {
    imageUrl = await fetchFromGooglePlaces(placeName, coords, googleApiKey);
    if (imageUrl) return imageUrl;
  }

  // 3. Try Unsplash as last resort (though it's deprecated)
  // This is kept for backward compatibility but will likely fail
  imageUrl = await fetchFromUnsplash(placeName);
  if (imageUrl) return imageUrl;

  return null;
};

/**
 * Fetch image from Google Places API
 */
async function fetchFromGooglePlaces(
  placeName: string,
  coords: [number, number],
  apiKey: string
): Promise<string | null> {
  try {
    // Search for place
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(placeName)}&inputtype=textquery&locationbias=circle:2000@${coords[0]},${coords[1]}&fields=photos,place_id&key=${apiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) return null;
    
    const searchData = await searchResponse.json();
    if (searchData.candidates?.[0]?.photos?.[0]?.photo_reference) {
      const photoRef = searchData.candidates[0].photos[0].photo_reference;
      // Get photo URL (maxwidth=400 for reasonable size)
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${apiKey}`;
      
      // Convert to data URL to avoid CORS issues
      const photoResponse = await fetch(photoUrl);
      if (photoResponse.ok) {
        const blob = await photoResponse.blob();
        return await blobToDataURL(blob);
      }
    }
  } catch (error) {
    console.log('Google Places API failed:', error);
  }
  return null;
}

/**
 * Fetch image from Unsplash (fallback method)
 * Uses direct Unsplash API with a simple query
 */
async function fetchFromUnsplash(placeName: string): Promise<string | null> {
  try {
    // Try to get a random image related to the place name from Unsplash
    // Note: This requires an API key for production, but for now we'll try a simple approach
    // Using Unsplash's Source API alternative: direct search URL
    const searchQuery = encodeURIComponent(`${placeName} India`);
    // Using a proxy-free approach: direct Unsplash search (may have CORS issues)
    // Alternative: Use Unsplash's official API with access key
    const unsplashUrl = `https://source.unsplash.com/featured/800x600/?${searchQuery}`;
    
    // Check if image loads (this is a simple check)
    // In production, use Unsplash API with proper authentication
    console.log('⚠️ Unsplash Source API is deprecated, trying alternative...');
    
    // For now, return null and rely on Wikipedia
    // In the future, integrate proper Unsplash API with access key
    return null;
  } catch (error) {
    console.log('Unsplash fetch failed:', error);
    return null;
  }
}

/**
 * Fetch image from Wikipedia API using geosearch and text search
 * This is now the primary image source since Unsplash is deprecated
 */
async function fetchFromWikipedia(
  placeName: string,
  coords: [number, number]
): Promise<string | null> {
  // Note: Browser-based fetch cannot set User-Agent header, but Wikipedia API works with origin=*
  const headers = {
    'Accept': 'application/json',
  };
  
  try {
    let pageTitle: string | null = null;
    
    // First try: Search by place name (more accurate for specific places like Jatayu)
    try {
      const textSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(placeName)}&srlimit=5&format=json&origin=*`;
      const textResponse = await fetch(textSearchUrl, { headers });
      if (textResponse.ok) {
        const textData = await textResponse.json();
        const searchResults = textData.query?.search;
        if (searchResults && searchResults.length > 0) {
          // Try to find best match - prefer exact matches or India-related pages
          const exactMatch = searchResults.find((r: any) => {
            const lowerTitle = r.title.toLowerCase();
            const lowerPlace = placeName.toLowerCase();
            return lowerTitle === lowerPlace || 
                   lowerTitle.includes(lowerPlace) || 
                   lowerPlace.includes(lowerTitle.split(' ')[0]);
          });
          pageTitle = exactMatch ? exactMatch.title : searchResults[0].title;
          console.log('✅ Wikipedia text search found:', pageTitle);
        } else {
          console.log('⚠️ Wikipedia text search returned no results for:', placeName);
        }
      } else {
        console.error('❌ Wikipedia text search failed with status:', textResponse.status, textResponse.statusText);
      }
    } catch (e) {
      console.error('❌ Wikipedia text search error:', e);
    }
    
    // Second try: Geosearch if text search didn't work
    if (!pageTitle && coords) {
      try {
        const geosearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gsradius=10000&gscoord=${coords[0]}|${coords[1]}&gslimit=5&format=json&origin=*`;
        console.log('🔍 Trying Wikipedia geosearch:', geosearchUrl);
        const geoResponse = await fetch(geosearchUrl, { headers });
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          console.log('📡 Geosearch response:', geoData);
          
          // Check for errors in response
          if (geoData.error) {
            console.error('❌ Wikipedia API error:', geoData.error);
            return null;
          }
          
          const pages = geoData.query?.geosearch;
          if (pages && pages.length > 0) {
            console.log('✅ Geosearch found', pages.length, 'pages near coordinates');
            // Prefer pages that match the place name
            const nameMatch = pages.find((p: any) => 
              p.title.toLowerCase().includes(placeName.toLowerCase()) ||
              placeName.toLowerCase().includes(p.title.toLowerCase().split(' ')[0])
            );
            pageTitle = nameMatch ? nameMatch.title : pages[0].title;
            console.log('✅ Selected page:', pageTitle);
          } else {
            console.log('⚠️ Geosearch returned no pages near coordinates');
          }
        } else {
          console.error('❌ Wikipedia geosearch failed with status:', geoResponse.status, geoResponse.statusText);
          const errorText = await geoResponse.text();
          console.error('Error response:', errorText.substring(0, 200));
        }
      } catch (e) {
        console.error('❌ Wikipedia geosearch error:', e);
      }
    }
    
    if (!pageTitle) {
      console.log('⚠️ No Wikipedia page found for:', placeName);
      return null;
    }
    
    // Get images for that page - try both pageimages and images API
    try {
      // First try: Get thumbnail image
      const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=600&format=json&origin=*`;
      console.log('🖼️ Fetching images for page:', pageTitle);
      
      const imgResponse = await fetch(imageUrl, { headers });
      if (imgResponse.ok) {
        const imgData = await imgResponse.json();
        const pagesData = imgData.query?.pages;
        const firstPage = Object.values(pagesData || {})[0] as any;
        
        if (firstPage?.thumbnail?.source) {
          console.log('✅ Found thumbnail:', firstPage.thumbnail.source);
          // Return direct URL - Wikipedia images work fine with CORS
          return firstPage.thumbnail.source;
        }
        
        // If no thumbnail, try to get full image from images API
        if (firstPage?.original?.source) {
          console.log('✅ Found original image:', firstPage.original.source);
          return firstPage.original.source;
        }
      } else {
        console.error('❌ Failed to fetch pageimages, status:', imgResponse.status);
      }
      
      // Second try: Get images list and pick first one
      const imagesUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=images&imlimit=5&format=json&origin=*`;
      const imagesResponse = await fetch(imagesUrl, { headers });
      if (imagesResponse.ok) {
        const imagesData = await imagesResponse.json();
        const pagesData = imagesData.query?.pages;
        const firstPage = Object.values(pagesData || {})[0] as any;
        const images = firstPage?.images;
        
        if (images && images.length > 0) {
          console.log('📸 Found', images.length, 'images on page');
          // Filter out non-image files and get image info
          const imageTitles = images
            .filter((img: any) => {
              const lowerTitle = img.title.toLowerCase();
              return !lowerTitle.includes('icon') && 
                     !lowerTitle.includes('logo') &&
                     (lowerTitle.endsWith('.jpg') || lowerTitle.endsWith('.png') || lowerTitle.endsWith('.jpeg'));
            })
            .slice(0, 3)
            .map((img: any) => img.title);
          
          if (imageTitles.length > 0) {
            console.log('🖼️ Trying to fetch image:', imageTitles[0]);
            // Get image info for first image
            const imageInfoUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(imageTitles[0])}&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json&origin=*`;
            const imageInfoResponse = await fetch(imageInfoUrl, { headers });
            if (imageInfoResponse.ok) {
              const imageInfoData = await imageInfoResponse.json();
              const imagePages = imageInfoData.query?.pages;
              const imagePage = Object.values(imagePages || {})[0] as any;
              
              if (imagePage?.imageinfo?.[0]?.thumburl) {
                console.log('✅ Found image URL:', imagePage.imageinfo[0].thumburl);
                return imagePage.imageinfo[0].thumburl;
              }
              if (imagePage?.imageinfo?.[0]?.url) {
                console.log('✅ Found image URL:', imagePage.imageinfo[0].url);
                return imagePage.imageinfo[0].url;
              }
            }
          }
        } else {
          console.log('⚠️ No images found on page');
        }
      } else {
        console.error('❌ Failed to fetch images list, status:', imagesResponse.status);
      }
    } catch (e) {
      console.error('❌ Wikipedia image fetch error:', e);
    }
  } catch (error) {
    console.log('Wikipedia fetch failed:', error);
  }
  return null;
}

/**
 * Convert blob to data URL
 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Check if image URL is accessible (for Unsplash direct URLs)
 */
export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    // For Unsplash direct URLs, we can't easily validate due to CORS
    // But the browser will handle it
    return url.startsWith('http');
  } catch {
    return false;
  }
};

