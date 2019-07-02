const express = require('express')
const app = express()
const session = require('express-session')
const mongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID

var url
if (process.env.database_url) {
    url = process.env.database_url
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

app.post('/register', function (req, res) {
    db.collection('Users').findOne({$or: [{'username': req.body.username}, {'email': req.body.email}]}, function (err, result) {
        if (err) throw err
        if(result != null) {
            res.send(`<script>alert('Username or Email already exist');window.location='/signup'</script>`)
        }
        else
        {
            db.collection('Users').insertOne(req.body, function (err, result) {
                if (err) throw err
                res.send(`<script>alert('Account created!');window.location='/'</script>`)
            })
        }
    })
})

app.post('/auth', (req, res) => {

    db.collection('Users').findOne({ "username": req.body.username}, function (err, result) {
        if (err) throw err;
        if (result != null) {
            if (req.body.password == result.password) {
                req.session.loggedIn=true;
                req.session.username=result.username;
                if (result.username == "yashpal") {
                    res.redirect('/topics')
                } else {
                    res.redirect('/topics')
                }
            }
            else {
                res.send(`<script>alert('wrong credentials!');window.location='/'</script>`);
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
    if (!req.session.loggedIn)
        res.sendFile('login.html', {
            root: __dirname + '/views'
        })
    else
        res.redirect("/topics")
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
    db.collection('Users').findOne({'username': req.body.username}, function (err, result) {
        if (err) throw err;

        if (result != null && req.body.password == req.body.ConfirmPassword)
        {
            db.collection('Users').updateOne({
                username: result.username
            }, {
                $set: {
                    password: req.body.password
                }
            }, function (err, result) {
                if (err) throw err;
                res.send(`<script>alert('Updated');window.location='/'</script>`);
            });

        } else {
            res.send(`<script>alert('Username or Password do not match');window.location='/forgot'</script>`);
        }
    })
})

app.post('/createpost', function (req, res) {
    let post = {
        '_id': new ObjectID(),
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
        'content': req.body.cmnt
    }
    db.collection('Topics').updateOne(
        {
        'posts._id': ObjectID(req.body.postid)
        }, 
        {
            $push: 
            {
                'posts.$[el].comments': cmnt
            }
        }, 
        {
            arrayFilters: [{ 'el._id': ObjectID(req.body.postid)}]
        },
        function (err, result) {
            if (err) throw err
            if(result.result.nModified) res.sendStatus(200)
        }
    )
})

app.get('/getpost', function (req, res) {
    db.collection('Topics').findOne({
        'posts._id': ObjectID(req.query.postid)
    },
    {
        projection: { posts: { $elemMatch: { _id: ObjectID(req.query.postid) }}}
    },
    function (err, result) {
        if (err) throw err
        if(result!=null)
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
    db.collection('Topics').find({
        '_id': ObjectID(req.query.topicid)
    }).toArray(function (err, result) {
        res.send(result[0])
    })
})

app.get('/topposts', function (req, res) {
    let pipeline = [
        {
            $match: 
            {
                _id: ObjectID(req.query.topicid)
            }
        },
        {
            $unwind: '$posts'
        },
        {
            $addFields: 
            {
                likes: 
                {
                    $size: {
                        $ifNull: ['$posts.likes', []]
                    }
                }
            }
        },
        {
            $sort:
            {
                'likes': 1,
                'posts._id': 1
            }
        },
        {
            $group: 
            {
                _id: '$_id',
                name: 
                {
                    $first: '$name'
                },
                posts: 
                {
                    $push: 
                    {
                        _id:'$posts._id',
                        content:'$posts.content'
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
        projection: { posts: { $elemMatch: { _id: ObjectID(req.query.postid)}}}
    },
    function (err, result) {
        res.send(result.posts[0].comments)
    })
})

app.put('/updatepost', function (req, res) {

})

app.delete('/deletepost', function (req, res) {
    db.collection()
   
})

app.get('/likes', function (req, res) {
    let pipeline = [
        { 
            $match: 
            {
                'posts._id': ObjectID(req.query.postid)
            }
        },
        {
            $unwind: '$posts'
        },
        { 
            $match: 
            {
                'posts._id': ObjectID(req.query.postid)
            }
        },
        {
            $project: 
            {   
                _id:0,
                likes: 
                {
                    $size: 
                    { 
                        $ifNull: [ '$posts.likes', [] ]
                    }
                }
            }
        }
    ]
    db.collection('Topics').aggregate(pipeline).toArray(function (err, result) {
        if (err) throw err
        if(result[0]) res.send(result[0].likes.toString())
        res.end()
    })
})

app.get('/updatelikes', function (req, res) {
    db.collection('Topics').updateOne(
        {
        'posts._id': ObjectID(req.query.postid)
        }, 
        {
            $addToSet: 
            {
                'posts.$[el].likes': req.session.username
            }
        }, 
        {
            arrayFilters: [{ 'el._id': ObjectID(req.query.postid)}]
        },
        function (err, result) {
            if (err) throw err
            if(result.result.nModified) res.sendStatus(200)
        }
    )
})       

app.get('/deletetopic',function(req,res){
    db.collection('Topics').deleteOne({'name' : req.query.name},function(err,result){
        //if(err) throw err; 
        //console.log(result)
        res.send(result)
    })
})

app.get('/listtopics', (req, res) => {
    db.collection('Topics').find({}, {
        projection: {name:1}
    }).toArray((err, result)=>
        res.send(result)
    )
});

app.get('/addtopic', (req, res) => {
    db.collection('Topics').insertOne({name: req.query.name}, (err, result)=>
        res.send(result.ops)
    )
});

app.get('/*', function (req, res) {
    res.send('404 page Not Found')
})

app.listen(process.env.PORT || 3000, function () {
    console.log('app listening on port 3000!')
})