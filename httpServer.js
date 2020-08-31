const http = require('http');
const PORT = 8080;

//function to handle requests and send responses
const requestHandler = (req, res) => {
  if (req.url === '/') {
    res.end('Welcome')
  }
  else if (req.url === '/urls') {} else {
    res.statusCode = 404;
    res.end('404 Page Not Found')
  }
};

const server = http.createServer(requestHandler);
server.listen(PORT, () => {
  console.log(`listening on http://localhost: ${PORT}`);
});