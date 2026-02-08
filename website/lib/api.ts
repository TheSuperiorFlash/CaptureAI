// Centralized API base URL configuration
// Uses NEXT_PUBLIC_API_URL environment variable if set, otherwise defaults to production endpoint
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.captureai.workers.dev'
