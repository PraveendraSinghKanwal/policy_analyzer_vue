
// Helper function to get sequence from environment variable
export function getCategorySequenceFromEnv() {
  // This will work when you add VITE_CATEGORY_SEQUENCE to your .env file
  const envSequence = import.meta.env.VITE_CATEGORY_SEQUENCE;
  if (envSequence) {
    return envSequence.split(',').map(item => item.trim());
  }
  return []; // Return empty array if no environment variable
} 