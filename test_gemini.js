const GEMINI_API_KEY = "AQ.Ab8RN6LF30YxxitL1tDmMaVBnAbjL9dM7QSi6SDHq37kl1Gxpw";

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
    const text = await res.text();
    console.log('Response Text:', text);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
