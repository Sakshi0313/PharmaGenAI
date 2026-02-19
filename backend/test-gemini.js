/**
 * Test script to verify Gemini API key and list available models
 * Run with: node test-gemini.js
 */

require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDY8T--OvtKZOjDr-VugJ570Kv_3IoqHRI';

console.log('🔍 Testing Gemini API Key...\n');
console.log('API Key:', GEMINI_API_KEY.substring(0, 20) + '...\n');

async function testGeminiAPI() {
  try {
    // Test 1: List available models
    console.log('📋 Fetching available models...');
    const modelsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );

    if (!modelsResponse.ok) {
      const error = await modelsResponse.json();
      console.error('❌ Failed to fetch models:', error);
      return;
    }

    const modelsData = await modelsResponse.json();
    console.log('✅ API Key is valid!\n');
    
    console.log('Available Models:');
    console.log('─'.repeat(80));
    
    if (modelsData.models && modelsData.models.length > 0) {
      modelsData.models.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name}`);
        console.log(`   Display Name: ${model.displayName}`);
        console.log(`   Description: ${model.description || 'N/A'}`);
        console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('No models found.');
    }

    // Test 2: Generate content with gemini-2.5-flash
    console.log('\n🧪 Testing content generation with gemini-2.5-flash...\n');
    
    const generateResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Say "Hello! Gemini API is working!" in one sentence.'
            }]
          }]
        })
      }
    );

    if (!generateResponse.ok) {
      const error = await generateResponse.json();
      console.error('❌ Content generation failed:', error);
      return;
    }

    const generateData = await generateResponse.json();
    
    if (generateData.candidates && generateData.candidates[0]) {
      const response = generateData.candidates[0].content.parts[0].text;
      console.log('✅ Content Generation Test:');
      console.log('Response:', response);
      console.log('\n🎉 Gemini API is fully functional!\n');
    }

    // Recommended models for your use case
    console.log('\n💡 Recommended Models for PharmaGenAI:');
    console.log('─'.repeat(80));
    console.log('1. gemini-2.0-flash (Current) - Fast, versatile, good for production');
    console.log('2. gemini-2.5-flash - Latest mid-size model with 1M token support');
    console.log('3. gemini-2.5-pro - Most accurate, best for complex medical explanations\n');

  } catch (error) {
    console.error('❌ Error testing Gemini API:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check if API key is correct in .env file');
    console.log('2. Verify API key has Generative Language API enabled');
    console.log('3. Check if you have internet connection');
    console.log('4. Visit: https://makersuite.google.com/app/apikey to manage keys\n');
  }
}

// Run the test
testGeminiAPI();
