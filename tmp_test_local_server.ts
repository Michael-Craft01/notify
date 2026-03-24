import http from 'http';

const checkLocalEndpoint = () => {
  const req = http.request('http://localhost:3000/api/test-notification', { method: 'GET' }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Body: ${data}`);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.end();
};

checkLocalEndpoint();
