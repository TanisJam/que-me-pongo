import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latitude = searchParams.get('latitude');
  const longitude = searchParams.get('longitude');
  const start_date = searchParams.get('start_date');
  const end_date = searchParams.get('end_date');
  const hourly = searchParams.get('hourly'); // e.g., "temperature_2m,relative_humidity_2m,precipitation"

  if (!latitude || !longitude || !start_date || !end_date || !hourly) {
    return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
  }

  const apiUrl = 'https://archive-api.open-meteo.com/v1/archive';

  try {
    const response = await axios.get(apiUrl, {
      params: {
        latitude,
        longitude,
        start_date,
        end_date,
        hourly,
        // Optional: Add timezone if needed, defaults to UTC
        // timezone: 'auto',
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('[API Historical] Error fetching data:', error);
    // Check if the error is from Axios and has response data
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { error: 'Failed to fetch historical data from Open-Meteo', details: error.response.data },
        { status: error.response.status || 500 }
      );
    }
    // Generic server error
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 