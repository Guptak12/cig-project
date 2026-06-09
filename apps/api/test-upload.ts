import fs from 'fs';

async function testUpload() {
  try {
    console.log('Logging in user...');
    const loginRes = await fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cig.dev',
        password: 'admin1234',
      }),
    });

    const loginJson = await loginRes.json() as any;
    if (!loginJson.ok) throw new Error(loginJson.error);

    const token = loginJson.data.token;
    console.log('Login successful! Token:', token.substring(0, 15) + '...');

    // Read image as blob
    const buffer = fs.readFileSync('/Users/destructor/.gemini/antigravity-ide/brain/0c3744b8-20e2-47d9-8a72-2a6d2f56ddf1/selfie_initial_1780862593434.png');
    const blob = new Blob([buffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('selfie', blob, 'selfie.png');

    console.log('Uploading selfie to API...');
    const uploadRes = await fetch('http://localhost:4000/users/selfie', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const uploadJson = await uploadRes.json();
    console.log('Upload response:', uploadJson);
  } catch (err: any) {
    console.error('Error during upload test:', err.message);
  }
}

testUpload();
