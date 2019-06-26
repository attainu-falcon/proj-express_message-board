var express = require('express');
var app = express();
var mongoClient = require('mongodb').MongoClient;
var db;
var session = require('express-session');
mongoClient.connect("mongodb://127.0.0.1:27017", function (err, client) {

    if (err) throw err;
    db = client.db("MessageBoard");
});
app.use(express.static('public'))
app.use(express.urlencoded())
app.use(session({
    secret: "message board app"
}))
app.post('/create', function (req, res) {
    db.collection('Users').find({}).toArray(function(err,result){
        x=0;
        if(err) throw err;
        for(var i=0;i<result.length;i++){
if(req.body.username==result[i].username||req.body.email==result[i].email){
x=1;
}}

if(x==1){  res.send(`<script>alert('Username or Email already exist');window.location='/signup'</script>`);}
else{
    db.collection('Users').insertOne(req.body, function (err, result) {
        if (err) throw err;
        res.send(`<script>alert('Account created!');window.location='/'</script>`);
    });
}
})
;})
app.post('/auth', (req, res) => {
    db.collection('Users').find({}).toArray(function(err,result){
        var x=0;
        if(err) throw err;
        for(var i=0;i<result.length;i++){
if(req.body.username==result[i].username&&req.body.password==result[i].password){
    var y=result[i].username;
    var z=result[i].password;
x=1;
}
}
if(x==1){
           if (y=="yashpal") {
            res.sendFile('admin.topic.html', {root: __dirname + '/views'});
        }
         else {
        res.sendFile('user.topic.html', {root: __dirname + '/views'});
    }
}
else {
    res.send(`<script>alert('wrong credentials!');window.location='/'</script>`);
}
});
});

app.post('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/');

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
        });
    //  else
    //   res.redirect("/topics")
});

app.post('/topics', function (req, res) {
    res.sendFile('topics.html', {
        root: __dirname + '/views'
    });
});

app.post('/leaderboard', function (req, res) {
    res.sendFile('leaderboard.html', {
        root: __dirname + '/views'
    });
});

app.post('/post', function (req, res) {
    res.sendFile('post.html', {
        root: __dirname + '/views'
    });
});
app.get('/forgot', function (req, res) {
    res.sendFile('forgot.html', {
        root: __dirname + '/views'
    });
});
app.post('/authPass', (req, res) => {


    db.collection('Users').find({}).toArray(function(err,result){
        var x=0;
        if(err) throw err;
        for(var i=0;i<result.length;i++){
if(req.body.username==result[i].username&&req.body.password==req.body.ConfirmPassword){
    var y=result[i].username;
    var z=req.body.password;
x=1;
}
}
if(x==1){
    db.collection('Users').updateOne( { username : y},{$set :{ password: z}}  ,function(err,result){
        if(err) throw err;
      });
      res.send(`<script>alert('Updated');window.location='/forgot'</script>`);
}
else {
    res.send(`<script>alert('Username or Password do not match');window.location='/forgot'</script>`);
}
});

});
app.get('/*', function (req, res) {
    res.send('404 page Not Found');
});
app.listen(3000)