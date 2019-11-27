var config = {
    type: Phaser.WEBGL,
    width: 950,
    height: 600,
    parent: 'phaser',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: {y: 0},
        debug: false
      }
    },
    scene: {
      key: 'main',
      preload: preload,
      create: create,
      update: update
    }
  }

  var game = new Phaser.Game(config);

  var map;
  var collideLayer;
  var groundLayer;
  var bridgeLayer;
  var player;
  var bullets;
  var bulletInitX;
  var bulletInitY;
  var shootButton;
  var lastFired = 0;
  var lastBomb = 0;
  var facing = 1;
  var ammunition = 100;
  var trapAmmo = 10;
  var x;
  var y;


  //parameters to control music+sound
  var bgmusic;
  var shootSound;
  var musicFlag = true;
  var soundFlag = true;

  var musicButton = document.querySelector("[id='music']");
  var soundButton = document.querySelector("[id='sound']");

  // parameters to control weather
  var currentWeather;
  var weatherFlag = false; var weatherToggle = false;
  var rainParticles; var snowParticles; var fog;

  // Functions to control weather parameters
  function updateWeatherFlag(){
    weatherFlag = !weatherFlag;
  }
  function updateWeatherToggle(){
    weatherToggle = !weatherToggle;
  }

  // Variable for weather button
  var weatherButton = document.querySelector("[id='toggleWeather']");

  async function fetchWeather(){
      const ipRequest = await fetch('https://json.geoiplookup.io/');
      const ipResponse = await ipRequest.json();
      const weatherRequest = await fetch('https://api.openweathermap.org/data/2.5/weather?q='
                                          + ipResponse.city + ',' + ipResponse.country_code + '&appid=fa452ec635e9759a07cab7433d42104f');
      const weatherResponse = await weatherRequest.json();

      // Control Weather button and weather status
      // based on current weather condition
      if (weatherResponse.weather[0].main == "Rain" ||
          weatherResponse.weather[0].main == "Drizzle" ||
          weatherResponse.weather[0].main == "Snow" ||
          weatherResponse.weather[0].main == "Haze" ||
          weatherResponse.weather[0].main == "Mist" ||
          weatherResponse.weather[0].main == "Fog"
          // || weatherResponse.weather[0].main == "Clouds"
          ){
            weatherButton.removeAttribute("hidden");
            weatherButton.addEventListener('click', function(){
              updateWeatherFlag();
            //   if (weatherButton.innerHTML == "WEATHER ON")
            //     weatherButton.innerHTML = "WEATHER OFF";
            //   else
            //     weatherButton.innerHTML = "WEATHER ON";
             });
            weatherFlag = true; weatherToggle = true;
            // weatherButton.innerHTML = "WEATHER OFF";
          }
      return weatherResponse;
  }

  function preload(){
    //preloader
    var progressBar = this.add.graphics();
    var progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(315,270,320,50);

    var width = this.cameras.main.width;
    var height = this.cameras.main.height;

    var loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '30px Neucha',
        fill: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5,0.5);

    var percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: {
        font: '18px Neucha',
        fill: '#ffffff'
      }
    });
    percentText.setOrigin(0.5,0.5);


    //event listeners (events emitted from Phaser's LoaderPlugin)
    this.load.on('progress', function(value){
      console.log(value);
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(325,280,300*value,30);

      percentText.setText(parseInt(value*100) + '%');
    });

    this.load.on('complete', function(value){
      console.log('complete');
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });


    //map tiles
    this.load.image('overworld', 'assets/overworld.png');
    this.load.image('combinedTiles', 'assets/combinedTiles.png');
    //map in json format
    this.load.tilemapTiledJSON('map', 'assets/map.json');

    //sprites
    this.load.image('pinkPlayer','assets/alienPink.png');
    this.load.image('greenPlayer','assets/alienGreen.png');
    this.load.image('yellowPlayer','assets/alienYellow.png');
    this.load.image('bluePlayer','assets/alienBlue.png');
    this.load.image('beigePlayer','assets/alienBeige.png');

    this.load.image('healthbar_green', 'assets/healthbar_green.png');
    this.load.image('healthbar_red', 'assets/healthbar_red.png');

    this.load.image('bulletImg','assets/testBullet.png');
    this.load.image('bomb','assets/mushroom_red.png');
  
    this.load.image('rain', 'assets/rain.png');
    this.load.image('snow', 'assets/snowflake-pixel.png');
    this.load.image('fog', 'assets/fog.png');

    this.load.audio('bgmusic', 'assets/audio/bgmusic.mp3');
    this.load.audio('shootSound', 'assets/audio/shoot.mp3');
  }

  class Bullet extends Phaser.Physics.Arcade.Sprite{
    constructor(scene){
      super(scene, x, y, 'bulletImg');
      scene.add.existing(this);
      scene.physics.world.enable(this);
      if(facing == 1){
        this.xSpeed = Phaser.Math.GetSpeed(0,1);
        this.ySpeed = Phaser.Math.GetSpeed(-4000,1);
      }
      else if(facing == 2){
        this.xSpeed = Phaser.Math.GetSpeed(0,1);
        this.ySpeed = Phaser.Math.GetSpeed(4000,1);
      }
      else if(facing == 3){
        this.xSpeed = Phaser.Math.GetSpeed(-4000,1);
        this.ySpeed = Phaser.Math.GetSpeed(0,1);
      }
      else if(facing == 4){
        this.xSpeed = Phaser.Math.GetSpeed(4000,1);
        this.ySpeed = Phaser.Math.GetSpeed(0,1);
      }
    }
    fire(x,y){
      this.setPosition(x,y);
      this.bulletInitX = x;
      this.bulletInitY = y;
      this.setActive(true);
      this.setVisible(true);
    }
    update(time, delta){
      if(this){
        this.x += this.xSpeed;
        this.y += this.ySpeed;
        this.setPosition(this.x, this.y);
      }

      if(this.x > this.bulletInitX + 500 || this.x < this.bulletInitX - 500 || this.x < -10 || this.x > groundLayer.width ||
        this.y > this.bulletInitY + 500 || this.y < this.bulletInitY - 500 || this.y < -10 || this.y > groundLayer.width){
        this.destroy();
      }
    }
  }

  function create(){
    //add map
    map = this.add.tilemap('map');

    var bridgeTiles = map.addTilesetImage('overworld');
    var combinedTiles = map.addTilesetImage('combinedTiles');
    groundLayer = map.createStaticLayer('Below Player', combinedTiles, 0, 0);
    bridgeLayer = map.createStaticLayer('Overworld', bridgeTiles,0,0);
    collideLayer = map.createStaticLayer('World', combinedTiles, 0, 0);

    //music
    shootSound = this.sound.add('shootSound');
    bgmusic = this.sound.add('bgmusic');

    if(game.sound.context.state === 'suspended') {
      game.sound.context.resume();
    }

    bgmusic.play();
    bgmusic.loop = true;

    musicButton.addEventListener('click', function() {
      musicFlag = !musicFlag;
      console.log(musicFlag);
      if(musicFlag == false) {
        //musicButton.innerHTML = "MUSIC ON";
        bgmusic.pause();
      }
      else {
       // musicButton.innerHTML = "MUSIC OFF";
        bgmusic.resume();
      }
    })
    soundButton.addEventListener('click', function() {
      soundFlag = !soundFlag;
      console.log(soundFlag);
      if(soundFlag == false) {
       // soundButton.innerHTML = "SOUND ON";
      }
      else {
       // soundButton.innerHTML = "SOUND OFF";
      }
    })

    //weather
    rainParticles = this.add.particles('rain');
    snowParticles = this.add.particles('snow');
    fog = this.add.image(1350, 1308, 'fog').setAlpha(0);
      if(navigator.onLine)
        fetchWeather()
          .then(weatherResponse => {
            currentWeather = weatherResponse.weather[0].main;
            console.log(currentWeather);
            if(currentWeather == "Rain")
              addRain(rainParticles, map.widthInPixels, map.heightInPixels);

            else if(currentWeather == "Drizzle")
              addDrizzle(rainParticles, map.widthInPixels, map.heightInPixels);

            else if(currentWeather == "Snow")
              addSnow(snowParticles, map.widthInPixels, map.heightInPixels);

            else if(currentWeather == "Mist")
              changeAtmos(this, fog, "Misty");

            else if(currentWeather == "Haze")
              changeAtmos(this, fog, "Hazy");

            else if(currentWeather == "Fog")
              changeAtmos(this, fog, "foggy");
          });

    //set boundaries of game world
    this.physics.world.bounds.width = groundLayer.width;
    this.physics.world.bounds.height = groundLayer.height;

    map.setCollisionBetween(1,999,true,collideLayer);

    //display text
    playerCountText = this.add.text(10,20,'',{ fontFamily: 'Neucha', fontSize:'20px' });
    playerCountText.setScrollFactor(0);
    ammoCount = this.add.text(10, 40,"Ammunition Count:" + ' ' + ammunition + "/100",{ fontFamily: 'Neucha', fontSize:'20px' });
    ammoCount.setScrollFactor(0);
    trapCount = this.add.text(10, 60,"Trap Count:" + ' ' + trapAmmo + "/10",{ fontFamily: 'Neucha', fontSize:'20px' });
    trapCount.setScrollFactor(0);

    //timer
    //this.totalTime = 180;

    //timerText = this.add.text(10, 450, 'Countdown: ' + formatTime(this.totalTime));
    // console.log(document.getElementById('trapTime').value);
    // timerText = this.add.text(40, 40, 'Timer: ' + formatTime(document.getElementById('trapTime').value));

    // timedEvent = this.time.addEvent({
    //   delay: 1000,
    //   callback: timer,
    //   callbackScope: this,
    //   loop: true
    // });


    var self = this;
    var sessionId;
    this.socket = io();
    this.otherPlayers = this.physics.add.group();
    this.redBars = this.physics.add.group();

    //character selection
    // var selected = document.getElementById("colorGame").value;
    // console.log("color selected " + selected);

    this.socket.on('numPlayers', (playerCount) =>{
        playerCountText.setText([
          playerCount+' players joined',
        ]);
      });

    this.socket.on('connect', () => {
      sessionId = this.socket.id;
    });

    this.socket.on('currentPlayers', function (players) {
      Object.keys(players).forEach(function (id) {
        if (players[id].playerId === self.socket.id) {
          addPlayer(self, players[id]);
        } else {
          addOtherPlayers(self, players[id]);
        }
      });
    });

    this.socket.on('newPlayer', function (playerInfo) {
      addOtherPlayers(self, playerInfo);
    }.bind(this));

    this.socket.on('updateSprite', function (playerInfo) {
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (playerInfo.playerId === otherPlayer.playerId) {
          otherPlayer.colour = playerInfo.colour;
        }
      });
    });


    this.socket.on('disconnect', function (playerId) {
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (playerId === otherPlayer.playerId) {
          otherPlayer.usernameText.destroy();
          otherPlayer.healthbar_green.destroy();
          otherPlayer.healthbar_red.destroy();
          otherPlayer.destroy();
        }
      }.bind(this));
    }.bind(this));

    this.socket.on('playerHit', function(id){
      if(id === sessionId){
        self.player.health -= 10;
      }
      else{
        self.otherPlayers.getChildren().forEach(function (otherPlayer){
          if(id === otherPlayer.playerId){
            otherPlayer.health -= 10;
          }
        })
      }
    });

    this.socket.on('trapHit', function(id){
      if(id === sessionId){
        self.player.health -= 10;
      }
      else{
        self.otherPlayers.getChildren().forEach(function (otherPlayer){
          if(id === otherPlayer.playerId){
            otherPlayer.health -= 10;
          }
        })
      }
    });

    this.socket.on('bulletsUpdate', function(servBullets){
      var counter = 0;
      bullets.getChildren().forEach(child => {
        if(servBullets[counter]){
          child.x = servBullets[counter].x;
          child.y = servBullets[counter].y;
        }
        counter++;
        if(counter > servBullets.length){
          child.destroy();
        }
      })
      for(var i = counter; i < servBullets.length; i++){
        addBullets(self, servBullets[i]);
      }
    });

    this.socket.on('trapsUpdate', function(servTraps){
      var counter = 0;
      traps.getChildren().forEach(child => {
        if(servTraps[counter]){
          child.x = servTraps[counter].x;
          child.y = servTraps[counter].y;
        }
        counter++;
        if(counter > servTraps.length){
          child.destroy();
        }
      })
      for(var i = counter; i < servTraps.length; i++){
        addTraps(self, servTraps[i]);
      }
    });

    this.socket.on('playerMoved', function (playerInfo) {
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerInfo.playerId === otherPlayer.playerId) {
              otherPlayer.setPosition(playerInfo.x, playerInfo.y);
              var usernameLength = playerInfo.playerUsername.length;
              console.log("length", usernameLength);
              var offset = usernameLength*2.5;
              console.log(offset);
              
              otherPlayer.healthbar_red.x = playerInfo.x;
              otherPlayer.healthbar_red.y = playerInfo.y - 32;
              otherPlayer.healthbar_green.x = playerInfo.x;
              otherPlayer.healthbar_green.y = playerInfo.y - 32;

              otherPlayer.usernameText.x = playerInfo.x - offset;
              otherPlayer.usernameText.y = playerInfo.y + 8;
              otherPlayer.usernameText.setText(playerInfo.playerUsername);

              if (playerInfo.colour == "pink"){
                otherPlayer.setTexture('pinkPlayer');
              }
              else if (playerInfo.colour == "green"){
                otherPlayer.setTexture('greenPlayer');
              }
              else if (playerInfo.colour == "blue"){
                otherPlayer.setTexture('bluePlayer');
              }
              else if (playerInfo.colour == "yellow"){
                otherPlayer.setTexture('yellowPlayer');
              }
              else if (playerInfo.colour== 'beige'){
                otherPlayer.setTexture('beigePlayer');
              }
            }
      });
    });
    var username = document.getElementById("nameGame").value;

    //chat
    // When we receive a message
    // it will be like { user: 'username', message: 'text' }

    $("#messageText").keyup(function(event){
      if(event.keyCode == 90){
    console.log("asd");
          $("#messageText").val($("#messageText").val()+ 'Z');
      }
    });

    $("#messageText").keyup(function(event){
      if(event.keyCode == 122){
          $("#messageText").val($("#messageText").val()+ 'z');
      }
    });

    $("#messageText").keyup(function(event){
      if(event.keyCode == 32){
          $("#messageText").val($("#messageText").val()+' ');
      }
    });

    $("#messageText").keyup(function(event){
      if(event.keyCode == 27){
          $("#messageText").blur();
      }
    });

    $('.chatForm').submit(function (e) {
      console.log("sent")
      // Avoid submitting it through HTTP
      e.preventDefault();
      // Retrieve the message from the user
      var message = $(e.target).find('#messageText').val();
      console.log(message);
      console.log(username);
      // Send the message to the server
      self.socket.emit('message', {
        user: username,
        message: message
      });
      // Clear the input and focus it for a new message
      e.target.reset();
      $(e.target).find('input').focus();
    });

    this.socket.on('message', function (data) {
      console.log("client catched");
      console.log("data user is" + data.user);
      $('#messages').append($('<li>').text(data.user + ': ' + data.message));
    });

    this.socket.on('died', function (deadPlayer) {
      console.log("died");
      console.log(deadPlayer.username);
      $('#messages').append($('<li>').html('<b>' + deadPlayer.username + ' was killed!</b>'));
    });

    this.socket.emit('username',username);

    bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true
    });
    bullets.enable = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;

    traps = this.physics.add.group({
      classType: Phaser.GameObjects.Sprite
    })

  //   const debugGraphics = this.add.graphics().setAlpha(0.75);
  //   collideLayer.renderDebug(debugGraphics, {
  //     tileColor: null, // Color of non-colliding tiles
  //     collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
  //     faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
  //   });

    //set player movement input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.bombButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    camera = this.cameras.main;

    //set bounds for camera (game world)
    camera.setBounds(0,0,map.widthInPixels, map.heightInPixels);
  }

  function update(time){
    if(this.player){
      if(this.player.health > 0){
        if (this.cursors.up.isDown){
          this.player.body.position.y -=4;
          this.player.flipY = true;
          facing = 1;
        }
        if (this.cursors.down.isDown){
          this.player.body.position.y +=4;
          this.player.flipY = false;
          facing = 2;
        }
        if (this.cursors.left.isDown){
          this.player.body.position.x -=4;
          this.player.flipX = true;
          facing = 3;
        }
        if (this.cursors.right.isDown){
          this.player.body.position.x +=4;
          this.player.flipX = false;
          facing = 4;
        }

        if (this.player.health > 0) {
          var usernameLength = document.getElementById("nameGame").value.length;
          var offset = 12.5-usernameLength*2.5;

          this.healthbar_green.displayWidth = (this.player.health/100)*100;
          this.healthbar_green.x = this.player.body.position.x + 12;
          this.healthbar_green.y = this.player.body.position.y - 20;
          this.healthbar_red.x = this.player.body.position.x + 12;
          this.healthbar_red.y = this.player.body.position.y - 20;

          this.usernameText.x = this.player.body.position.x + offset;
          this.usernameText.y = this.player.body.position.y + 24;
        }

        if (this.cursors.space.isDown && ammunition > 0 && lastFired == 0 && document.activeElement !== messageText && time/1000 >= 30){
          var bullet = bullets.get();

          if(bullet){
            if(soundFlag == true) {
              shootSound.play();
            }
            bullet.fire(this.player.body.position.x, this.player.body.position.y);
            lastFired = 20;
            ammunition --;
            ammoCount.setText("Ammunition Count:" + ' '+ ammunition +"/100");
            this.socket.emit('bulletFire', { x: this.player.body.position.x, y: this.player.body.position.y, xSpeed:bullet.xSpeed, ySpeed:bullet.ySpeed, initX: bullet.bulletInitX, initY: bullet.bulletInitY});
            }
        }
        if(lastFired > 0){
          lastFired --;
        }

        if (this.bombButton.isDown && trapAmmo > 0 && lastBomb == 0 &&  document.activeElement !== messageText && time/1000 < 30){
          if(!this.physics.overlap(this.player,traps)){
            var trap = traps.create(this.player.body.position.x, this.player.body.position.y, 'bomb');
            trap.body.setImmovable();
            lastBomb = 30;
            trapAmmo --;
            trapCount.setText("Trap Count:" + ' ' + trapAmmo + "/10");
            this.socket.emit('trapSet', { x: this.player.body.position.x, y: this.player.body.position.y });
          }
        }
        if(lastBomb > 0){
          lastBomb --;
        }

        if (time/1000 >= 33){
          traps.getChildren().forEach(child => {
            child.visible = false;
          })
        }

        this.physics.collide(this.player,collideLayer);
        this.physics.collide(this.player,this.otherPlayers);

        this.otherPlayers.getChildren().forEach(child => {
          child.body.immovable = true;
          if(child.health <= 0){
            //this.socket.emit('playerDied', {id:child.playerId, username: child.playerUsername});
            child.health = -5;
            console.log("player id" + child.playerId);
            console.log("username" + child.playerUsername)
            console.log("in update1");
            playerDeath(child);
            child.usernameText.destroy();
            child.healthbar_green.destroy();
            child.healthbar_red.destroy();
          }
          else{
            child.healthbar_green.displayWidth = (child.health/100)*100;
          }
        })

        x = this.player.x;
        y = this.player.y;
        if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y)) {
          this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y});
        }

        this.player.oldPosition = {
          x: this.player.x,
          y: this.player.y,
        }
      }
      else if(this.player.health == 0){
        this.player.health = -5;
        console.log("username in els" + this.player.playerUsername);
        console.log("id in els" + this.player.playerId);
        this.socket.emit('playerDied', {id: this.player.playerId, username: this.player.playerUsername});
        console.log("in update2");
        playerDeath(this.player);
        this.healthbar_green.destroy();
        this.healthbar_red.destroy();
        this.usernameText.destroy();
      }
    }

      if (weatherFlag && !weatherToggle){
        updateWeatherToggle();
        if (currentWeather == "Rain")
          addRain(rainParticles, map.widthInPixels, map.heightInPixels);

        else if (currentWeather == "Drizzle")
          addDrizzle(rainParticles, map.widthInPixels, map.heightInPixels);

        else if(currentWeather == "Snow")
          addSnow(snowParticles, map.widthInPixels, map.heightInPixels);

        else if(currentWeather == "Mist")
          changeAtmos(this, fog, "Misty");

        else if(currentWeather == "Haze")
          changeAtmos(this, fog, "Hazy");

        else if(currentWeather == "Fog")
          changeAtmos(this, fog, "foggy");
      }

      else if (!weatherFlag && weatherToggle){
        updateWeatherToggle();
        if (currentWeather == "Rain")
          removeRain();

        else if (currentWeather == "Drizzle")
          removeDrizzle();

        else if(currentWeather == "Snow")
          removeSnow();

        else if(currentWeather == "Mist" ||
                currentWeather == "Haze" ||
                currentWeather == "Fog")
          changeAtmos(this, fog, "Clear");
      }
      //timerText.setText(40, 10, 'Timer: ' + formatTime(document.getElementById('trapTime').value));
  }

  // function formatTime(seconds){
  //   //Minutes
  //   var minutes = Math.floor(seconds/60);
  //   //seconds
  //   var secondsPart = seconds%60;
  //   //add zeros to left of seconds
  //   secondsPart = secondsPart.toString().padStart(2,'0');
  //   //return formatted time
  //   return `${minutes}:${secondsPart}`;
  // }

  // function timer(){
  //   this.totalTime-=1;
  //   timerText.setText('Countdown: '+formatTime(this.totalTime));
  // }

  function addPlayer(self, playerInfo) {
    var username = document.getElementById("nameGame").value;
    playerInfo.playerUsername = username;
    console.log(username.length);
    var selected = document.getElementById("colorGame").value;
    console.log("color selected " + selected);
    playerInfo.colour = selected;
    console.log("selected colour: ", playerInfo.colour);
    self.socket.emit('updateColour', {colour: playerInfo.colour});

    self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, selected).setOrigin(0.5, 0.5);
    self.player.playerUsername = playerInfo.playerUsername;
    if (selected == 'pink'){
      self.player.setTexture('pinkPlayer');
    }
    else if (selected == 'yellow'){
      self.player.setTexture('yellowPlayer');
    }
    else if (selected == 'green'){
      self.player.setTexture('greenPlayer');
    }
    else if (selected == 'blue'){
      self.player.setTexture('bluePlayer');
    }
    else if (selected == 'beige'){
      self.player.setTexture('beigePlayer');
    }

    self.player.setCollideWorldBounds(true);
    self.player.health = 100;
    self.healthbar_red = self.physics.add.sprite(self.player.body.position.x + 12, self.player.body.position.y - 20, 'healthbar_red');
    self.healthbar_green = self.physics.add.sprite(self.player.body.position.x + 12, self.player.body.position.y - 20, 'healthbar_green');
    self.healthbar_green.setScale(.4);
    self.healthbar_red.setScale(.4);
    self.healthbar_red.displayWidth = (self.player.health/100) * 100;
    self.usernameText = self.add.text(self.player.body.position.x, self.player.body.position.y,username,
      {
      fontFamily:'Neucha',
      color:'#000000',
      align:'center',
      fontSize: '12px'
    });

    self.cameras.main.startFollow(self.player, true,0.5,0.5,0.5,0.5);
  }

  function addOtherPlayers(self, playerInfo) {
    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'pinkPlayer').setOrigin(0.5, 0.5);
    otherPlayer.health = 100;
    otherPlayer.healthbar_red = self.physics.add.sprite(playerInfo.x, playerInfo.y - 32, 'healthbar_red');
    otherPlayer.healthbar_green = self.physics.add.sprite(playerInfo.x, playerInfo.y - 32, 'healthbar_green');
    otherPlayer.healthbar_green.setScale(.4);
    otherPlayer.healthbar_red.setScale(.4);
    otherPlayer.healthbar_green.displayWidth = (otherPlayer.health/100) * 100;
    otherPlayer.usernameText = self.add.text(playerInfo.x, playerInfo.y,playerInfo.playerUsername,
      {
      fontFamily:'Neucha',
      color:'#000000',
      align:'center',
      fontSize: '12px'
    });

    if (playerInfo.colour == "pink"){
       otherPlayer.setTexture('pinkPlayer');
    }
    else if (playerInfo.colour == "green"){
      otherPlayer.setTexture('greenPlayer');
    }
    else if (playerInfo.colour == "blue"){
      otherPlayer.setTexture('bluePlayer');
    }
    else if (playerInfo.colour == "yellow"){
      otherPlayer.setTexture('yellowPlayer');
    }
    else if (playerInfo.colour== 'beige'){
      otherPlayer.setTexture('beigePlayer');
    }

    otherPlayer.playerId = playerInfo.playerId;
    otherPlayer.playerUsername = playerInfo.playerUsername;
    self.otherPlayers.add(otherPlayer);
  }

  function addBullets(self, bulletInfo){
    const nBullet = self.add.sprite(bulletInfo.x, bulletInfo.y, 'bulletImg');
    bullets.add(nBullet);
  }

  function addTraps(self, trapInfo){
    const nTrap = self.add.sprite(trapInfo.x, trapInfo.y, 'bomb');
    traps.add(nTrap);
  }

  playerDeath = function(deadPlayer){
    deadPlayer.destroy();
    deadPlayer = null;
  }
