const express = require('express')
const app = express()
const session = require('express-session')
const mongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID
var hbs = require("express-handlebars");
app.use(express.static('public'))
app.use(express.urlencoded())
var url
if (process.env.DB_URL) {
    url = process.env.DB_URL
} else {
    url = 'mongodb://127.0.0.1:27017'
}
var db;
mongoClient.connect(url, function (err, client) {
    if (err) throw err
    db = client.db("MessageBoard")
})
app.use(express.json())
app.use(express.text())
app.use(session({
    secret: "message board app"
}))
var main = hbs.create({
    extname: "hbs"
})
app.engine('hbs', main.engine)
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.post('/register', function (req, res) {
    db.collection('Users').findOne({
        $or: [{
            'username': req.body.username
        }, {
            'email': req.body.email
        }]
    }, function (err, result) {
        if (err) throw err
        if (result != null) {
            res.render("signup", {
                title: "Signup Page",
                style: "login",
                var: "username or email id are already exist"
            });
        } else {
            if (req.body.username.length <= 5) {
                res.render("signup", {
                    title: "Signup Page",
                    style: "login",
                    var: "username cannot be less than 5 Character"
                });

            } else if (req.body.password.length <= 8) {
                res.render("signup", {
                    title: "Signup Page",
                    style: "login",
                    var: "Password cannot be less than 8 Character"
                });

            } else {

                db.collection('Users').insertOne(req.body, function (err, result) {


                    if (err) throw err
                    res.render("login", {
                        title: "Login Page",
                        style: "login",
                        var: "Account Created"
                    });
                })
            }

        }
    })
})

app.post('/auth', (req, res) => {
    if (!req.session.username) {
        req.session.username = req.body.username
        req.session.password = req.body.password
    }
    db.collection('Users').findOne({
        "username": req.session.username
    }, function (err, result) {
        if (err) throw err;
        if (result != null) {
            if (req.body.password == result.password) {
                req.session.loggedIn = true;
                req.session.username = req.body.username
                if (result.username == "admin") {
                    req.session.Admin = true;
                    res.redirect('/topics')
                } else {
                    req.session.Admin = false;
                    res.redirect('/topics')
                }
            } else {
                req.session.loggedIn = false;
                res.render("login", {
                    title: "Login Page",
                    style: "login",
                    var: "Wrong UserName or Password"
                });
            }
        } else {
            req.session.loggedIn = false;
            res.render("login", {
                title: "Login Page",
                style: "login",
                var: "Wrong UserName or Password"
            });
        }
    })
})

app.get('/logout', function (req, res) {
    req.session.destroy()
    res.redirect('/')
})

app.post('/authPass', (req, res) => {
    db.collection('Users').findOne({
        'username': req.body.username
    }, function (err, result) {
        if (err) throw err;

        if (result != null && req.body.password == req.body.ConfirmPassword) {
            if (req.body.password.length <= 8) {
                res.render("forgot", {
                    title: "Forgot Page",
                    style: "login",
                    var: "Password cannot be less than 8 Character"
                });
            } else {
                db.collection('Users').updateOne({
                    username: result.username
                }, {
                    $set: {
                        password: req.body.password
                    }
                }, function (err, result) {
                    if (err) throw err;
                    res.render("forgot", {
                        title: "Forgot Page",
                        style: "login",
                        var: "Updated"
                    });

                });
            }

        } else {
            res.render("forgot", {
                title: "Forgot Page",
                style: "login",
                var: "Username or password do not match"
            });
        }
    })
})


app.post('/createpost', function (req, res) {
    let post = {
        '_id': new ObjectID(),
        'username': req.session.username,
        'content': req.body.post
    }
    db.collection('Topics').updateOne({
            _id: ObjectID(req.body.id)
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

app.post('/createcomment', function (req, res) {
    let cmnt = {
        '_id': new ObjectID(),
        'username': req.session.username,
        'content': req.body.cmnt
    }
    db.collection('Topics').updateOne({
            'posts._id': ObjectID(req.body.postid)
        }, {
            $push: {
                'posts.$[el].comments': cmnt
            }
        }, {
            arrayFilters: [{
                'el._id': ObjectID(req.body.postid)
            }]
        },
        function (err, result) {
            if (err) throw err
            if (result.result.nModified) res.sendStatus(200)
        }
    )
})

app.get('/getpost', function (req, res) {
    db.collection('Topics').findOne({
            'posts._id': ObjectID(req.query.postid)
        }, {
            projection: {
                posts: {
                    $elemMatch: {
                        _id: ObjectID(req.query.postid)
                    }
                }
            }
        },
        function (err, result) {
            if (err) throw err
            if (result != null)
                res.send(result.posts[0])
            else
                res.end()
        })
})

app.get('/latestposts', function (req, res) {
    db.collection('Topics').find({
        '_id': ObjectID(req.query.topicid)
    }).toArray(function (err, result) {
        res.send(result[0])
    })
})

app.get('/topusers', function (req, res) {
    let pipeline = [{
            $match: {
                _id: ObjectID(req.query.topicid)
            }
        },
        {
            $unwind: '$posts'
        },
        {
            $addFields: {
                likes: {
                    $size: {
                        $ifNull: ['$posts.likes', []]
                    }
                }
            }
        },
        {
            $group: {
                _id: '$posts.username',
                userLikes: {
                    $sum: '$likes'
                },
                name: {
                    $first: '$name'
                }
            }
        },
        {
            $sort: {
                'userLikes': -1
            }
        }
    ]
    db.collection('Topics').aggregate(pipeline).toArray(function (err, result) {
        res.send(result)
    })
})

app.get('/topposts', function (req, res) {
    let pipeline = [{
            $match: {
                _id: ObjectID(req.query.topicid)
            }
        },
        {
            $unwind: '$posts'
        },
        {
            $addFields: {
                likes: {
                    $size: {
                        $ifNull: ['$posts.likes', []]
                    }
                }
            }
        },
        {
            $sort: {
                'likes': 1,
                'posts._id': 1
            }
        },
        {
            $group: {
                _id: '$_id',
                name: {
                    $first: '$name'
                },
                posts: {
                    $push: {
                        _id: '$posts._id',
                        username: '$posts.username',
                        content: '$posts.content'
                    }
                }
            }
        }
    ]
    db.collection('Topics').aggregate(pipeline).toArray(function (err, result) {
        res.send(result[0])
    })
})

app.get('/commentlist', function (req, res) {
    db.collection('Topics').findOne({
            'posts._id': ObjectID(req.query.postid)
        }, {
            projection: {
                posts: {
                    $elemMatch: {
                        _id: ObjectID(req.query.postid)
                    }
                }
            }
        },
        function (err, result) {
            res.send(result.posts[0].comments)
        })
})

app.get('/likes', function (req, res) {
    let pipeline = [{
            $match: {
                'posts._id': ObjectID(req.query.postid)
            }
        },
        {
            $unwind: '$posts'
        },
        {
            $match: {
                'posts._id': ObjectID(req.query.postid)
            }
        },
        {
            $project: {
                _id: 0,
                likes: {
                    $size: {
                        $ifNull: ['$posts.likes', []]
                    }
                }
            }
        }
    ]
    db.collection('Topics').aggregate(pipeline).toArray(function (err, result) {
        if (err) throw err
        if (result[0]) res.send(result[0].likes.toString())
        res.end()
    })
})

app.get('/updatelikes', function (req, res) {
    db.collection('Topics').updateOne({
            'posts._id': ObjectID(req.query.postid)
        }, {
            $addToSet: {
                'posts.$[el].likes': req.session.username
            }
        }, {
            arrayFilters: [{
                'el._id': ObjectID(req.query.postid)
            }]
        },
        function (err, result) {
            if (err) throw err
            if (result.result.nModified) res.sendStatus(200)
        }
    )
})

app.get('/deletetopic', function (req, res) {
    db.collection('Topics').deleteOne({
        "_id": ObjectID(req.query.topicid)
    }, function (err, result) {
        res.send(result.result.n.toString())

    })
})

app.get('/listtopics', (req, res) => {
    db.collection('Topics').find({}, {
        projection: {
            name: 1
        }
    }).toArray((err, result) =>
        res.send(result)
    )
});

app.get('/addtopic', (req, res) => {
    db.collection('Topics').insertOne({
            name: req.query.name
        }, (err, result) =>
        res.send(result.ops)
    )
});

app.get('/deletepost', (req, res) => {
    db.collection('Topics').updateOne({
        'posts._id': ObjectID(req.query.postid)
    }, {
        '$pull': {
            posts: {
                _id: ObjectID(req.query.postid)
            }
        }
    }, function (err, result) {
        res.send(result.result.nModified.toString())
    })
})

app.get('/', function (req, res) {
    if (!req.session.loggedIn) {
        res.render("login", {
            title: "Login Page",
            style: "login"
        });
    } else {
        res.redirect('/topics')
    }
})

app.get('/signup', function (req, res) {
    res.render("signup", {
        title: "Signup Page",
        style: "login"
    });
})
app.get('/forgot', function (req, res) {

    res.render("forgot", {
        title: "Forgot Page",
        style: "login"
    });
})
app.get('/modifytopic', (req, res) => {
    db.collection('Topics').updateOne({
        _id: ObjectID(req.query.topicid)
    }, {
        '$set': {
            name: req.query.newname
        }

    }, function (err, result) {
        res.send(result.result.nModified.toString())

    })

})

app.get('/topics', function (req, res) {
    if (req.session.Admin == true) {

        res.render("topics.hbs", {
            title: "Topic Page",
            style: "styles",
            user: req.session.username,
            flag: true

        });

    } else if (req.session.Admin == false) {
        res.render("topics.hbs", {
            title: "Topic Page",
            style: "styles",
            user: req.session.username,
            flag: false
        });
    } else {
        res.render("topics.hbs", {
            title: "Topic Page",
            style: "styles"
        });
    }
})

app.get('/leaderboard', function (req, res) {
    res.render("leaderboard", {
        title: "LeaderBoard Page",
        style: "styles"
    });
})

app.get('/post', function (req, res) {
    res.render("post", {
        title: "Post Page",
        style: "styles"
    });
})


app.get('/*', function (req, res) {
    res.send('404 page Not Found')
})

app.listen(process.env.PORT || 3000, _ => console.log(`App running at ${process.env.PORT || 3000}`))