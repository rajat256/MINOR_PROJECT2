const axios = require('axios');

async function test() {
    try {
        console.log("Testing Registration...");
        const res = await axios.post('http://localhost:5000/api/auth/register', {
            name: "Test User",
            email: "test_" + Date.now() + "@example.com",
            password: "password123",
            role: "customer",
            phone: "1234567890",
            location: "Test City"
        });
        console.log("Registration Success:", res.data);
    } catch (err) {
        console.error("Registration Failed:", err.response?.status, err.response?.data || err.message);
    }
}

test();
