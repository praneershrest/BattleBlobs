const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const PORT = process.env.PORT || 5000
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

const bcrypt = require('bcrypt');

const { Pool } = require('pg');

var pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'mantiS7326510#',
  database: 'cloud5'
});



app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('pages/login');
});

app.get("/forgotPwd", function (req, res) {
  res.render("pages/forgotPwd");
});


app.post('/home', (req,res) => {
    res.render('pages/home');
});

app.post('/signUp', (req,res) => {
    res.render('pages/signUp');
});

app.post('/rules', (req,res) => {
    res.render('pages/rules');
});

app.post('/pregame', (req,res) => {
    res.render('pages/pregame');
});

var blockGamersFlag = false; 

app.post('/waitForPlayers', (req,res) => {
  //var selectedCharacter = req.body.character;
  //console.log(selectedCharacter);
  res.render('pages/gameStaging');
});


var trapSecs = 60; var gameSecs = 120;
var totalGameTime = trapSecs + gameSecs;

app.post('/game', (req,res) => {
  // var selectedCharacter = req.body.colorGame;
  // console.log(selectedCharacter);
  //res.render('pages/game', {character: selectedCharacter, gameTime: gameSecs, trapTime: trapSecs});
  res.render('pages/game', {gameTime: gameSecs, trapTime: trapSecs});
});

app.post('/postgame', (req,res) => {
    blockGamersFlag = false;
    console.log(blockGamersFlag);
    res.render('pages/postgame');
});

app.post('/logout', (req,res) =>{
  res.render('pages/login');
})

app.post('/login', (req, res) => {
    var userID = req.body.username;
    var userpwd = req.body.pwd;
    var loginQuery = `SELECT * FROM logindb WHERE username='${userID}'`;
    pool.query(loginQuery, async (error, result) => {
        if (error)
            res.end(error);
        if (result.rows.length === 0)
            res.render('pages/login', {loginMessage: 'Username entered does not match any accounts! Please sign up for a new account below.'});
        else{
            if(await bcrypt.compare(userpwd, result.rows[0].password)){
                if ((result.rows[0].usertype == 'User'))
                    res.render('pages/home', {message: 'Successfully logged in!'});
                else{ // result.row[0].usertype == 'Admin'


                    var usersQuery=`SELECT username, email, usertype FROM logindb ORDER BY usertype, username`;
                    pool.query(usersQuery, (error, result) =>{
                        if (error)
                            res.end(error);
                        var allUsers = {'rows': result.rows};
                        res.render('pages/admin', allUsers);
                    });
                }
            }
            else
                res.render('pages/login', {loginMessage: 'Password entered is incorrect! Please try again.'});
        }
    });
});


app.post('/signUpForm', async (req,res) => {
    var insertUsername = req.body.username;
    var insertPassword = req.body.password;
    var confirm = req.body.confirmPassword;
    var insertEmail = req.body.email;
    const mailCode = randomstring.generate(20);
    if(insertPassword !== confirm){
        res.render('pages/signUp', {message: 'Passwords do not match!'});
    }

    else{
      getAllquery =  `SELECT * FROM logindb WHERE username='${insertUsername}'`;
      pool.query(getAllquery, (error, result) => {
        if(error)
          res.end(error);
        if (result.rows.length === 0){
          let transporter  = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user: 'cloud5sfu@gmail.com',
              pass: 'cmpt276cloud5'
            }
          });
          let mailOptions = {
            from: '"Cloud5" cloud5sfu@gmail.com',
            to: insertEmail,
            subject: "Email confirmation",
            text: "Please confirm your email to finish creating your account. Your confirmation code is: " + mailCode
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error){
              return console.log(error);
            }
            console.log('Message %s sent: %s', info.messageId, info.response);
          });
          res.render('pages/mailConfirm', {insertUsername, insertPassword, insertEmail, mailCode});
        }
        else{
            res.render('pages/signUp', {usernameMessage: 'Username already exists!'});
        }
      });
    }
});

app.post('/mailCodeForm', async(req,res) => {
  var mailCode = req.body.code;
  var insertUsername = req.body.name;
  var insertEmail = req.body.email;
  var pwd = req.body.pwd;
  var codeInput = req.body.mailCodeInput;
  const salt = await bcrypt.genSalt();
  const insertPassword = await bcrypt.hash(pwd, salt);
  if(codeInput === mailCode){
    var insertquery = `INSERT INTO logindb(username, password, email, confirmation_code) VALUES ('${insertUsername}', '${insertPassword}', '${insertEmail}', '${mailCode}');`;
    pool.query(insertquery, (error, result) => {
        if(error)
          res.end(error);
    res.render('pages/login',{signupMessage: 'Account created!'});
    });
  }
  else{
    res.render('pages/mailConfirm', {confirmationErr: 'Wrong confirmation code', insertUsername, insertPassword, insertEmail, mailCode});
    }
});

app.post('/forgotPwdAction', (req,res) => {
  var codeInput = req.body.forgotPwdCodeInput;
  var name = req.body.forgotPwdName;
  var newPwd = req.body.newPwd;
  const forgotPwdCode = randomstring.generate(20);
  var loginQuery = `SELECT * FROM logindb WHERE username='${name}'`;
  pool.query(loginQuery, async (error, result) => {
      if (error)
          res.end(error);
      if (result.rows.length === 0)
          res.render('pages/forgotPwd', {loginMessage: 'Username entered does not match any accounts! Please try again.'});
      else{
        var getMailQuery=`SELECT email FROM logindb WHERE username = '${name}'`;
        pool.query(getMailQuery, (error, result) => {
            if (error)
                res.end(error);
              console.log(result.rows[0].email);
              let transporter  = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                  user: 'cloud5sfu@gmail.com',
                  pass: 'cmpt276cloud5'
                }
              });
              console.log(result.rows[0].email);
              console.log(name);
              let mailOptions = {
                from: '"Cloud5" cloud5sfu@gmail.com',
                to: result.rows[0].email,
                subject: "Change password",
                text: "Your confirmation code for changing your password: " + forgotPwdCode
              };

              transporter.sendMail(mailOptions, (error, info) => {
                if (error){
                  return console.log(error);
                }
                console.log('Message %s sent: %s', info.messageId, info.response);
              });
              res.render("pages/forgotPwdConfirmation", {forgotPwdCode, name, newPwd});
            });
          }
        });
});


app.post('/forgotPwdConfirmationAction', async (req,res) => {
  var name = req.body.name;
  var newPwd = req.body.newPwd;
  var forgotPwdCode = req.body.forgotPwdCode;
  var codeInput = req.body.forgotPwdCodeInput;
  const salt = await bcrypt.genSalt();
  const hashedNewPwd = await bcrypt.hash(newPwd, salt);
  if (forgotPwdCode === codeInput){
    var forgotPwd = `UPDATE logindb SET password = '${hashedNewPwd}' WHERE username = '${name}'`
    pool.query(forgotPwd, (error, result) => {
      if (error)
       res.end(error);
    res.render('pages/login',{forgotMessage: 'Password changed!'});
  });
}
  else{
    res.render('pages/forgotPwdConfirmation', {confirmationErr: 'Wrong confirmation code', name, newPwd, forgotPwdCode});
  }
});


app.get('/removeUser/:userID', (req,res) => {
    var deleteUserQuery=`DELETE FROM logindb WHERE userid = ${req.params.userID}`;

    pool.query(deleteUserQuery, (error, result) => {
        if (error)
            res.end(error);

        var usersQuery=`SELECT userid, username, email, usertype FROM logindb ORDER BY usertype, username`;

        pool.query(usersQuery, (error, result) => {
            if (error)
                res.end(error);

            var allUsers = {'rows': result.rows};
            res.render('pages/admin', allUsers);
        });
    });
});

var playerCount = 0;
var playerAlive = 0;
var players = {};
var servBullets = [];
var servTraps = [];
var rankings = [];
var isDraw = 0;

io.on('connection', function (socket) {
  playerCount++;
  playerAlive = playerCount;
  //Empty rankings array
  rankings = [];
  isDraw = 0;
  console.log('a user connected. Num of players: ' + playerCount);
  io.sockets.emit('numPlayers', playerCount);
  // create a new player and add it to our players object
  players[socket.id] = {
    //x: 1400,
    //y: 1325,
    x: Math.floor(Math.random() * 326) + 1075,
    y: Math.floor(Math.random() * 326) + 1000,
    colour: socket.colour,
    playerId: socket.id,
    playerUsername: socket.username
  }

  //send players object to new player
  socket.emit('currentPlayers', players);

  //update all other players of new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  socket.on('updateColour', function (colourData) {
    socket.colour = colourData.colour;
    players[socket.id].colour = colourData.colour;
    socket.broadcast.emit('updateSprite', players[socket.id]);
  });

  socket.on('username', function(username){
    socket.username = username;
    players[socket.id].playerUsername = username;
  });

  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('message', function(data){
    console.log("catched")
    console.log(data);
    io.emit('message', data);
  });


  socket.on('bulletFire', function (bulletInit) {
    var newBullet = bulletInit;
    newBullet.x = bulletInit.x;
    newBullet.y = bulletInit.y;
    newBullet.initX = bulletInit.initX;
    newBullet.initY = bulletInit.initY;
    newBullet.owner = socket.id;
    servBullets.push(newBullet);
  });

  socket.on('bulletMovement', function (bulletsInfo){
    for(var i = 0; i < bulletsInfo.length; i++){
      servBullets[i].x = bulletsInfo[i].x;
      servBullets[i].y = bulletsInfo[i].y;
    }
  });

  socket.on('trapSet', function (trapInit) {
    var newTrap = trapInit;
    newTrap.x = trapInit.x;
    newTrap.y = trapInit.y;
    newTrap.owner = socket.id;
    servTraps.push(newTrap);
  });

  socket.on('playerDied', function (deadPlayer){
    //console.log("insockect on server: " + deadPlayer.username);
    console.log("player died. Players alive (unupdated): " + playerAlive )
    playerAlive--;
    console.log("player died. Players joined (updated): " + playerAlive );
    console.log("Players joined: " + playerCount)
    var username = deadPlayer.username;
    console.log(username + " was killed");
    //Push dead player username to rankings array
    rankings.push(username);
    console.log(rankings);
    io.sockets.emit('numPlayers', playerAlive);
    io.emit('died', deadPlayer);
    var counter = 0;
    delete players[deadPlayer.id];
    /*for(var id in players){
      if(id === deadPlayer.id){
        players.splice(counter, 1);

      }
      counter ++;
    }*/
  });

  socket.on('disconnect', function () {
    playerCount--;
    console.log('user disconnected. Players joined: ' + playerCount);
    var username = socket.username;
    for(var i = 0; i < 4; i++) {
      if(!(rankings[i] != null)) {
        if(rankings[i] !== username) {
          rankings.push(username);
          isDraw += 1;
          console.log("isDraw: " + isDraw);
        }
      }
    }
    console.log(rankings);
    for(var i = 0; i < servTraps.length; i++){
      if(servTraps[i].owner == socket.id){
        servTraps.splice(i,1);
        i--;
      }
    }
    delete players[socket.id];
    io.sockets.emit('numPlayers', playerCount);
    io.emit('disconnect', socket.id);
  });

});

function gameLoop(){
  for(var i = 0; i < servBullets.length; i++){
    var currBullet = servBullets[i];
    if(currBullet && servBullets[i]){
      currBullet.x += currBullet.xSpeed;
      currBullet.y += currBullet.ySpeed;

      for(var id in players){
        if(currBullet.owner != id){
          var dx = players[id].x - currBullet.x;
          var dy = players[id].y - currBullet.y;
          var dist = Math.sqrt(dx*dx + dy*dy);
          if(dist < 30){
            io.emit('playerHit', id);
            servBullets.splice(i,1);
            i--;
          }
        }
      }

      if(currBullet.x < -10 || currBullet.x < currBullet.initX - 500 || currBullet.x > currBullet.initX + 500 || currBullet.y < -10 || currBullet.y < currBullet.initY - 500 || currBullet.y > currBullet.initY + 500){
        servBullets.splice(i,1);
        i--;
      }
    }
  }

  for(var i = 0; i < servTraps.length; i++){
    var currTrap = servTraps[i];
    if(currTrap && servTraps[i]){
      for(var id in players){
        if(currTrap.owner != id){
          var dx = players[id].x - currTrap.x;
          var dy = players[id].y - currTrap.y;
          var dist = Math.sqrt(dx*dx + dy*dy);
          if(dist < 20){
            io.emit('trapHit', id);
            servTraps.splice(i,1);
            i--;
          }
        }
      }
    }
  }

  io.emit('bulletsUpdate', servBullets);
  io.emit('trapsUpdate', servTraps);
}

setInterval(gameLoop, 16);

if(!module.parent){
  server.listen(PORT, () => console.log(`Listening on ${ PORT }`));
}


//testing
module.exports = {
  players: players,
  playerCount: playerCount,
  app: app,
}
