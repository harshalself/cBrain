import axios from 'axios';

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:8000/api/v1/users/login', {
      email: 'harshal@gmail.com',
      password: 'harshal2004'
    });

    console.log('Login response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('Login failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testLogin();