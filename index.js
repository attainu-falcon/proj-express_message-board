const express = require('express');
const session = require('express-session');

const app = express();
var mongoClient = require('mongodb').MongoClient;
var db;
var url;
if (process.env.DB_URL) {
    url = process.env.DB_URL
} else {
    url = 'mongodb://127.0.0.1:27017'
}
mongoClient.connect(url, function (err, client) {

    if (err) throw err;
    db = client.db("MessageBoard");
});

app.use(express.static('public'))
app.use(express.urlencoded())
app.use(express.json())
app.use(session({
    secret: "message board app"
}))
app.post('/createuser', function (req, res) {
    db.collection('Users').insertOne(req.body, function (err, result) {
        if (err) throw err;
        res.send(`<script>alert('Account created!');window.location='/login'</script>`);
    });
});


app.post('/auth', (req, res) => {
    db.collection('Users').find(req.body).toArray(function (err, users) {
        if (err) throw err;
        
        for (user of users) {
            if (req.body.username == user.username && req.body.password == user.password) {
                req.session.loggedIn = "true";
            }
        }
        
        if (req.session.loggedIn == "true") {
            res.redirect('/topics');
        } else
        res.send(`<script>alert('wrong credentials!');window.location='/login'</script>`);
    });
});

app.post('/createpost', function (req, res) {
    console.log(req.body)
    db.collection('Topics').updateOne(
        { "name" : "Jquery" },
        { $set: { "posts.content" : req.body.post }}, 
            function (err, result) {
                if (err) throw err;        
                res.send(result);
    });
    
});

app.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/login');

})
app.get('/signup', function (req, res) {
    res.sendFile('signup.html', {
        root: __dirname + '/views'
    });
});

app.get('/login', function (req, res) {
    if (!req.session.loggedIn)
        res.sendFile('login.html', {
            root: __dirname + '/views'
        });
    else
        res.redirect("/topics")
});

app.get('/topics', function (req, res) {
    res.sendFile('topics.html', {
        root: __dirname + '/views'
    });
});

app.get('/leaderboard', function (req, res) {
    res.sendFile('leaderboard.html', {
        root: __dirname + '/views'
    });
});

app.get('/post', function (req, res) {
    res.sendFile('post.html', {
        root: __dirname + '/views'
    });
});

app.get('/*', function (req, res) {
    res.send('404 page Not Found');
});
    
app.listen(process.env.PORT || 3000, function () {
    console.log('app listening on port 3000!');
});