const express = require('express')
const app = express()
const session = require('express-session')
const mongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID

var url
if (process.env.DB_URL) {
    url = process.env.DB_URL
} else {
    url = 'mongodb://127.0.0.1:27017'
}

var db
mongoClient.connect(url, function (err, client) {
    if (err) throw err
    db = client.db("MessageBoard")
})

app.use(express.static('public'))
app.use(express.urlencoded())
app.use(express.json())
app.use(express.text())
app.use(session({
    secret: "message board app"
}))

app.post('/create', function (req, res) {
    db.collection('Users').find({}).toArray(function (err, result) {
        var x = 0;
        if (err) throw err
        for (var i = 0; i < result.length; i++) {
            if (req.body.username == result[i].username || req.body.email == result[i].email) {
                x = 1;
            }
        }
        if (x == 1) {
            res.send(`<script>alert('Username or Email already exist');window.location='/signup'</script>`)
        } else {
            db.collection('Users').insertOne(req.body, function (err, result) {
                if (err) throw err
                res.send(`<script>alert('Account created!');window.location='/'</script>`)
            })
        }
    })
})

app.post('/auth', (req, res) => {
    db.collection('Users').find({}).toArray(function (err, result) {
        var x = 0;
        if (err) throw err;
        for (var i = 0; i < result.length; i++) {
            if (req.body.username == result[i].username && req.body.password == result[i].password) {
                var y = result[i].username
                var z = result[i].password
                x = 1;
            }
        }
        if (x == 1) {
            if (y == "yashpal") {
                res.redirect('/topics')
            } else {
                res.redirect('/topics')
            }
        } else {
            res.send(`<script>alert('wrong credentials!');window.location='/'</script>`);
        }
    })
})

app.get('/logout', function (req, res) {
    req.session.destroy()
    res.redirect('/')
})

app.get('/signup', function (req, res) {
    res.sendFile('signup.html', {
        root: __dirname + '/views'
    });
});

app.get('/', function (req, res) {
    // if (!req.session.loggedIn)
        res.sendFile('login.html', {
            root: __dirname + '/views'
        })
    // else
    //     res.redirect("/topics")
})

app.get('/topics', function (req, res) {
    res.sendFile('topics.html', {
        root: __dirname + '/views'
    })
})

app.get('/leaderboard', function (req, res) {
    res.sendFile('leaderboard.html', {
        root: __dirname + '/views'
    });
});

app.get('/post', function (req, res) {
    res.sendFile('post.html', {
        root: __dirname + '/views'
    })
})

app.get('/forgot', function (req, res) {
    res.sendFile('forgot.html', {
        root: __dirname + '/views'
    })
})

app.post('/authPass', (req, res) => {
    db.collection('Users').find({}).toArray(function (err, result) {
        var x = 0;
        if (err) throw err;
        for (var i = 0; i < result.length; i++) {
            if (req.body.username == result[i].username && req.body.password == req.body.ConfirmPassword) {
                var y = result[i].username;
                var z = req.body.password;
                x = 1;
            }
        }
        if (x == 1) {
            db.collection('Users').updateOne({
                username: y
            }, {
                $set: {
                    password: z
                }
            }, function (err, result) {
                if (err) throw err;
            });
            res.send(`<script>alert('Updated');window.location='/forgot'</script>`);
        } else {
            res.send(`<script>alert('Username or Password do not match');window.location='/forgot'</script>`);
        }
    })

})

app.post('/createpost', function (req, res) {
    console.log(req.body)
    let post = {
        '_id': new ObjectID(),
        'content': req.body.post
    }
    db.collection('Topics').updateOne({
            "name": "Jquery"
        }, {
            $push: {
                posts: post
            }
        },
        function (err, result) {
            if (err) throw err;
            res.send(result);
        })
})

app.get('/getpost', function (req, res) {
    db.collection('Topics').findOne({
        '_id': ObjectID("5d1311e66b4186f06c58c178")
    }, function (err, result) {
        if (err) throw err
        let post = result.posts.find(item => item._id == req.query.postid)
        res.send(post)
    })
})

app.post('/getpostlist', function (req, res) {
    db.collection('Topics').find({
        '_id': ObjectID(req.body)
    }).toArray(function (err, result) {
        res.send(result)
    })
})

app.put('/updatepost', function (req, res) {

})

app.delete('/deletepost', function (req, res) {

})

app.get('/*', function (req, res) {
    res.send('404 page Not Found')
})

app.listen(process.env.PORT || 3000, function () {
    console.log('app listening on port 3000!')
})