const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/quote',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response:', data);
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.write(JSON.stringify({
    coverage_type: 'HEALTH',
    age: 30,
    coverage_amount: 100000
}));

req.end();
