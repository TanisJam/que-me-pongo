import axios from 'axios';

/**
 * Generic fetcher function for SWR using Axios.
 * @param url The URL to fetch.
 * @returns The data from the response.
 */
export const fetcher = (url: string) => axios.get(url).then(res => res.data); 