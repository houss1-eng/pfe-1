const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/n8n/generate', {
      prompt: 'Test generation with fallback',
      projectName: 'Test Project'
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}
test();
