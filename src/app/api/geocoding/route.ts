import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https'; // Import Node.js https module

// Interface based on Nominatim response structure
interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string; // Note: Nominatim returns lat/lon as strings
  lon: string; // Note: Nominatim returns lat/lon as strings
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
}

// Interface for the structure expected by the frontend
interface FormattedLocation {
    id: number;
    name: string;
    lat: number;
    lon: number;
}

// Create an https agent that explicitly prefers IPv4
const httpsAgent = new https.Agent({
  family: 4, // Force IPv4
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'Missing name query parameter' }, { status: 400 });
  }

  const apiUrl = 'https://nominatim.openstreetmap.org/search';
  const MAX_RESULTS = 5;

  const params = {
    q: name,           // Parameter name for query is 'q' for Nominatim
    format: 'json',
    limit: MAX_RESULTS, // Parameter name for limit is 'limit'
    // addressdetails: 1, // Optionally add addressdetails=1 for more granular info
  };

  const headers = {
    // Nominatim requires a User-Agent. Using a generic one for now.
    // For production, consider a more specific User-Agent (e.g., 'QueMePongoApp/1.0 (your-contact-email@example.com)')
    'User-Agent': 'QueMePongoApp/1.0'
  };

  const timeout = 15000; // 15 seconds

  console.log(`[API Geocoding - Nominatim] Making request to: ${apiUrl}`);
  console.log(`[API Geocoding - Nominatim] Params: ${JSON.stringify(params)}`);
  console.log(`[API Geocoding - Nominatim] Headers: ${JSON.stringify(headers)}`);
  console.log(`[API Geocoding - Nominatim] Timeout: ${timeout}ms`);

  try {
    const response = await axios.get<NominatimResult[]>(apiUrl, {
      params,
      headers,
      timeout,
      httpsAgent: httpsAgent // Use the custom agent configured for IPv4
    });

    const results = response.data || [];

    // Format the results to match the frontend expectation { id, name, lat, lon }
    const formattedResults: FormattedLocation[] = results.map(location => ({
      id: location.place_id,
      name: location.display_name,
      lat: parseFloat(location.lat), // Convert string lat to number
      lon: parseFloat(location.lon), // Convert string lon to number
    }));

    return NextResponse.json(formattedResults);

  } catch (error) {
    console.error('[API Geocoding - Nominatim] Error fetching data:', error);
    if (axios.isAxiosError(error)) {
        // Log more details for Axios errors
        console.error('[API Geocoding - Nominatim] Axios error details:', {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            // Avoid logging potentially large response data unless necessary for debugging
            // data: error.response?.data,
            config: error.config, // Log the config used for the request
            request: error.request ? '[Request Object Present]' : '[No Request Object]', // Indicate if request object exists
            response: error.response ? '[Response Object Present]' : '[No Response Object]', // Indicate if response object exists
        });
      return NextResponse.json(
        { error: 'Failed to fetch geocoding data from Nominatim', details: error.message },
        { status: error.response?.status || 500 }
      );
    }
    // Generic server error
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 