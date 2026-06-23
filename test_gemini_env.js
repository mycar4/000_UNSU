const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
console.log('Testing key prefix:', GEMINI_API_KEY.slice(0, 10));

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const requestBody = {
    contents: [{ parts: [{ text: "안녕" }] }]
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    console.log('Response Status:', res.status);
    if (res.status === 200) {
      console.log('Success! New API Key is valid and working.');
    } else {
      const text = await res.text();
      console.log('Failed:', text);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
