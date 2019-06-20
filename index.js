const express = require('express');
const session = require('express-session');
const app = express();

const users = [
    {
    username: "yash",
    password: "gurgaon" },
    {
    username: "ishan",
    password: "delhi" },
    {
    username: "aditya",
    password: "pune" }
]

app.use(express.static('public'))
app.use(express.urlencoded())
app.use(session({
    secret: "message board app"
}))

app.post('/auth', (req, res) => {
    for (user of users) {
        if (req.body.username == user.username && req.body.password == user.password) {
            req.session.loggedIn = "true";
        }
    }
    if (req.session.loggedIn=="true") {
        res.redirect('/topics');
    } else
        res.send(`<script>alert('wrong credentials!');window.location='/login'</script>`);
});

app.get('/logout',function(req,res){
    req.session.destroy();
    res.redirect('/login');
    
})
    

app.get('/signup', function(req, res) {
    res.sendFile('signup.html', { root: __dirname + '/views' });
});

app.get('/login', function(req, res) {
    res.sendFile('login.html', { root: __dirname + '/views' });
});

app.get('/topics', function(req, res) {
    res.sendFile('topics.html ', { root: __dirname + '/views' });
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