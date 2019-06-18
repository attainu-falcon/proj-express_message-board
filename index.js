const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(80, () => {
    console.log('Example app listening on port 80!');
});

//Run app, then load http://localhost:80 in a browser to see the output.