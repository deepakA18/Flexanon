export async function getZerionClient() {
  const apiKey = process.env.ZERION_API_KEY;
  
  if (!apiKey || apiKey === 'your_zerion_api_key_here') {
    console.log('⚠️  No Zerion API key found');
  }

  // Return client when API key is available
  const { getZerionClient } = await import('./zerion.js');
  return getZerionClient();
}

