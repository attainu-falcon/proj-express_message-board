const express = require('express');
const app = express();

app.use(express.static('public'))

app.get('/signup', function(req, res) {
    res.sendFile('signup.html', { root: __dirname + '/views' });
});

app.get('/login', function(req, res) {
    res.sendFile('login.html', { root: __dirname + '/views' });
});

app.get('/topics', function(req, res) {
    res.sendFile('topics.html', { root: __dirname + '/views' });
});

app.get('/leaderboard', function(req, res) {
    res.sendFile('leaderboard.html', { root: __dirname + '/views' });
});

app.get('/post', function(req, res) {
    res.sendFile('post.html', { root: __dirname + '/views' });
});

app.get('/*', function(req, res) {
    res.send('404 Not Found');
});

app.listen(3000, function() {
    console.log('Example app listening on port 3000!');
});