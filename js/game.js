//-----------------------------------
// Játék indítása
//-----------------------------------

// a játék intro indítása az oldal betöltés után
window.addEventListener('load', () => {
  // click eseményre indul a játék
  document.getElementById('start').addEventListener("click", intro);

  function intro(e) {
    document.querySelector('.intro').classList.add('hide');
    document.querySelector('.lastStage').classList.add('hide');
    document.querySelector('.origo').classList.remove('hide');
    // start game
    initGame();
  }
});

// a játék indítása
let interval;
function initGame() {
  // billentyűzet figyelés w,s,a,d,space
  window.addEventListener('keydown', function (e) {
    myGameArea.keys = (myGameArea.keys || []);
    // ha a SHIP nekimegy az ASTORIOD-nak akkor előre nem lehet menni
    if (ship.crash === 1) {
      if (e.keyCode !== 87) myGameArea.keys[e.keyCode] = true;
    }
    else myGameArea.keys[e.keyCode] = true;
    // W - hátsó lángcsóva megjelenítése
    if (e.keyCode === 87) shipPlumeShow(true, ['Bottom']);
    // A - első lángcsóvák megjelenítése
    if (e.keyCode === 83) shipPlumeShow(true, ['TopLeft', 'TopRight']);
  });
  window.addEventListener('keyup', function (e) {
    myGameArea.keys[e.keyCode] = false;
    // a lángcsóvák eltünteése
    if (e.keyCode === 87) shipPlumeShow(false, ['Bottom']);
    if (e.keyCode === 83) shipPlumeShow(false, ['TopLeft', 'TopRight']);
  });

  // a játéktér létrehozása
  myGameArea.start();

  // a játéktér frissítése 20ms-onként
  interval = setInterval(updateGameArea, 20);
}

//-----------------------------------
// MAP
//-----------------------------------

// a játéktér adatai
let myGameArea = {
  start : function() {
    this.mapWidth = 1000;
    this.mapHeight = 1000;
    this.mapX = 0;
    this.mapY = 0;
    this.mapDist = 0;
    this.mapAngle = 0;
    this.speed = 1.5;
    this.speedRotate = 1.5;
    this.keys;
    this.interval;

    // ASTEROIDs léterhozása
    asteroid();
    // MORSELs léterhozása
    morsel();
    // FLYs léterhozása
    createFly();
    // a MAP területén léveő árnyék hasjó mozgatása
    shadowShipMove();
    
    // hogy ne legyen ASTEROID jump
    let my = getShipCoord(); 
    let id = astoriodCrash(my);
    if (id) document.getElementById(id).remove();
   
    },
  // új kordináta kiszámolása
  coord : function(dist) {
      this.mapX += Math.cos((90 + this.mapAngle) * Math.PI / 180) * dist; 
      this.mapY += Math.sin((90 + this.mapAngle) * Math.PI / 180) * dist;
    },
  // MAP elmozgatása
  changeMapPos: function() {
      let map = document.querySelector('.map');
      map.style.transformOrigin =  (this.mapHeight/2) + "px " + (this.mapHeight/2) + "px";
      map.style.transform = "rotateZ(" + -this.mapAngle + "deg) translate(" + this.mapX + "px, " + this.mapY + "px) ";
      // árnyékhajó elmozgatása
      shadowShipMove();
    }
}

// árnyék SHIP mozgatása a látható SHIP pozíciójába
function shadowShipMove() {
  let coordShip = shadowShipCoord();
  let shadowShip = document.getElementById('s1');
  shadowShip.style.left = coordShip.left;
  shadowShip.style.top  = coordShip.top;
}

// az árnyék SHIP koordinátái
function shadowShipCoord() {  
  return {left: (myGameArea.mapWidth / 2 - myGameArea.mapX) + "px", top: (myGameArea.mapHeight / 2 - myGameArea.mapY) + "px"};
}

// a SHIP lángcsóvájának megjelenítése és eltünteése
function shipPlumeShow(show, op) {  
  for (let i = 0; i < op.length; i++) {
    let className = '.shipPlume' + op[i];
    let plume = document.querySelector(className);
    if (show === true) plume.classList.add('shipPlumeShow');
    else plume.classList.remove('shipPlumeShow');
  }
}

//-----------------------------------
// számlálók (Máté)
//-----------------------------------

// SHIP adatai
let ship = {
  health: 3,
  shield: 100,
  shieldOut: 0.01,
  shieldIn: 5,
  crash: 0,
  size: 10,
  morsel: 20,
  // számlálók frissítése 100ms-onként
  interval: setInterval(updateScore, 100)
}

// a számlálók frissítése
function updateScore() {
  let shield = Math.round(ship.shield);

  // ha a SHILD 0 akkor egy HEALTH levonás 
  if (shield <= 0) {
    ship.health -= 1;
    // SHIELD újra 100 egység
    ship.shield = 100;
  }
  // ha HEALTH 0 akkor vesztettél
  if (ship.health === 0) gameOver('lose');
  // ha miden MORSEL-t összeszedtél, nyertél
  if (ship.morsel === 0) gameOver('win');

  // a számlálók frissítése
  document.querySelector("#healthScore span").innerHTML = ship.health; 
  document.querySelector("#shieldScore span").innerHTML = shield; 
  document.querySelector("#morselScore span").innerHTML = ship.morsel;
}

// a nyertél és vesztetél oldal megjelenítése
function gameOver(op) {
  document.querySelector('.origo').classList.add('hide');
  document.querySelector('.lastStage').classList.remove('hide');
  if (op === 'lose') document.querySelector('.lose').classList.remove('hide');
  if (op === 'win') document.querySelector('.win').classList.remove('hide');
}

//-----------------------------------
// BULLET
//-----------------------------------

// BULETT léterhozása
let bullet = {
  dist: 100,
  change: 0,
  direction: 0,
  left: 0,
  top: 0,
  size: 8,
  objectAngle: 0,
  objectDist: 0,
  objectLeftDist: 0,
  objectTopDist: 0,
  speed: 3,
  interval: 0,
  fire: function () {

     // ha tüzeltünk akkor elindul a golyó
    if (bullet.direction === 0) {
      // amig tüzelünk addig nem lehet új golyót indítani
      this.change = 1; 
      // a hajó koordinátája 
      let coordShip = shadowShipCoord();
      this.left = parseInt(coordShip.left) - ship.size / 2;
      this.top = parseInt(coordShip.top) - ship.size / 2;
      
      // a mozgatás adatai
      this.objectDist = 100; 
      this.objectAngle = myGameArea.mapAngle - 90; 
      this.objectLeftDist = Math.cos((this.objectAngle) * Math.PI / 180) * this.speed;
      this.objectTopDist = Math.sin((this.objectAngle) * Math.PI / 180) * this.speed;    
      this.interval = setInterval(bullet.move, 10);

      // láthatóvá teszem a BULLET-et
      bulletShow(1);
    }
    else {
      // visszaindul a golyó
      let s1OrigoCoord = objectOrigo(s1);
      this.objectDist = Math.floor(distance(s1OrigoCoord.left, this.left, s1OrigoCoord.top, this.top));
      this.objectAngle = Math.atan2(s1OrigoCoord.top - this.top - this.size / 2, s1OrigoCoord.left - this.left - this.size / 2) * 180 / Math.PI;;
      this.objectLeftDist = Math.cos((this.objectAngle) * Math.PI / 180) * this.speed;
      this.objectTopDist = Math.sin((this.objectAngle) * Math.PI / 180) * this.speed;   
    }
  },
  // a BULLET mozgatása
  move: function () {
    // mozgatás a cél pont felé
    if (bullet.objectDist > 5) {
      bullet.left += bullet.objectLeftDist;
      bullet.top += bullet.objectTopDist;
      bullet.objectDist -= bullet.speed;
      let bulletDiv = document.getElementById('bullet');
      bulletDiv.style.left = bullet.left + "px";
      bulletDiv.style.top = bullet.top + "px";
    }
    // ha elérte a célpontot akkor visszafordul
    else if (bullet.direction === 0) {
        bullet.direction = 1;
      }
    // visszaérkezett, az adatok visszaálíltása
    else {
        bullet.change = 0;
        bullet.direction = 0;
        clearInterval(bullet.interval);
        bulletShow(0);
      }
    // ha visszafele tart a BULLET, akkor minden frissítésnél újraszámolja a célpontot
    if (bullet.direction === 1) {
      bullet.fire();
    }

  }
}

// a BULLET megjelenítése
function bulletShow(opa) {
  let bulletDiv = document.getElementById('bullet');
  bulletDiv.style.opacity = opa;
}


//-----------------------------------
// ASTEROIDs (Albert)
//-----------------------------------

// egy ASTEROID-ot létrehozása
function asteroid () {
  // a random geneálás alapadatai
  let maximumPoz = 999;
  let minimumPoz = 1;
  let maximumSize = 100;
  let minimumSize = 5;

  for(x = 0; x <60; x++) {
    // az ASTEROID div létrehozása
    let createAsteroid = document.createElement("div");
    createAsteroid.classList.add("asteroid");
    createAsteroid.setAttribute('id', 'a' + x);
    
    // hozzáadása a MAP-hoz
    document.querySelector('.map').appendChild(createAsteroid);
    
    // a random pozíciója és méretei
    let randomnumberTop = Math.floor(Math.random() * (maximumPoz - minimumPoz + 1)) + minimumPoz;
    let randomnumberLeft = Math.floor(Math.random() * (maximumPoz - minimumPoz + 1)) + minimumPoz;
    let randomnumberWidth = Math.floor(Math.random() * (maximumSize - minimumSize + 1)) + minimumSize;
    let randomnumberHeight = Math.floor(Math.random() * (maximumSize - minimumSize + 1)) + minimumSize;

    // pozíció és méret hozzáadása
    createAsteroid.style.height = randomnumberHeight+'px';
    createAsteroid.style.width = randomnumberWidth+'px';
    createAsteroid.style.left = randomnumberLeft+'px';
    createAsteroid.style.top = randomnumberTop+'px'; 
  }
}

//-----------------------------------
// MORSELs (Albert)
//-----------------------------------

// egy MORSEL léterhozása
function morsel () {

  // a MORSEL max és min poziciója
  let morselPozMax = 999;
  let morselPozMin = 1;
  
  // MORSELs létrehozása
  for(x = 0; x < ship.morsel; x++) {
    // a MORSEL DIV létrehozása
    let createMorsel = document.createElement("div");
    createMorsel.classList.add("morsel");
    createMorsel.setAttribute('id', 'm' + x);
    
    // hozzáadás a MAP-hoz
    document.querySelector('.map').appendChild(createMorsel);

    // a random pozíciója és méretei
    let randomnumberTop = Math.floor(Math.random() * (morselPozMax - morselPozMin + 1)) + morselPozMin;
    let randomnumberLeft = Math.floor(Math.random() * (morselPozMax - morselPozMin + 1)) + morselPozMin;

    // pozíció és méret hozzáadása
    createMorsel.style.left = randomnumberLeft+'px';
    createMorsel.style.top = randomnumberTop+'px';
  }
}

//-----------------------------------
// FLY
//-----------------------------------

// alapparaméterek
let flys = new Array();
let flySize = 10;
let flysNumber = 40; 

// egy FLY léterhozása
class fly {
  constructor(left, top, id, objectId) {
    this.left = left,
    this.top = top,
    this.id = id,
    this.objectId = objectId,
    this.objectNewId = '',
    this.objectAngle = 0,
    this.objectDist = 0,
    this.objectLeftDist = 0,
    this.objectTopDist = 0,
    this.speed = 1,
    this.area = 150,
    this.stop = 0,
    this.del = 0,
    // ugrik az egyik ASTEROID-ról a másikra
    this.jump = function () {
      // ha nincs célpont akkor keres egy ASTEROID-át
      if (!this.objectNewId) {
        // ASTEROID-ok
        let objects = document.querySelectorAll(".asteroid");
        let length = objects.length;
        // egy véletlen célpont
        let jump = Math.floor(Math.random() * length);
        
        // a random ASTEROID a célpont 
        this.objectNewId = objects[jump].id;
        // a koordinátái
        let objectOrigoCoord = objectOrigo(objects[jump]);
        // távolság a FLY és ASTEROD között        
        this.objectDist = distance(objectOrigoCoord.left, this.left, objectOrigoCoord.top, this.top);
        // a mozgatás szöge
        this.objectAngle = Math.atan2(objectOrigoCoord.top - this.top - flySize / 2, objectOrigoCoord.left - this.left - flySize / 2) * 180 / Math.PI;;
        // egységnyi left és top távolság
        this.objectLeftDist = Math.cos((this.objectAngle) * Math.PI / 180) * this.speed;
        this.objectTopDist = Math.sin((this.objectAngle) * Math.PI / 180) * this.speed;
      }
      else if (this.objectDist > 0) {
        // légy mozgatása
        this.left += this.objectLeftDist;
        this.top += this.objectTopDist;
        this.objectDist -= this.speed;
        let flyDiv = document.getElementById(this.id);
        flyDiv.style.left = this.left + "px";
        flyDiv.style.top = this.top + "px";

        // a hajó figyelése
        let dist = distance(myGameArea.mapWidth / 2 - myGameArea.mapX, this.left, myGameArea.mapHeight / 2 - myGameArea.mapY, this.top);
        if (dist < this.area && this.objectNewId !== 's1') {
          this.objectNewId = 's1';
          let s1 = document.getElementById('s1');
          
          // árnyékhajó a célban
          let s1OrigoCoord = objectOrigo(s1);
          
          this.objectDist = distance(s1OrigoCoord.left, this.left, s1OrigoCoord.top, this.top);
          this.objectAngle = Math.atan2(s1OrigoCoord.top - this.top - flySize / 2, s1OrigoCoord.left - this.left - flySize / 2) * 180 / Math.PI;;
          this.objectLeftDist = Math.cos((this.objectAngle) * Math.PI / 180) * this.speed;
          this.objectTopDist = Math.sin((this.objectAngle) * Math.PI / 180) * this.speed;   
        }
      }
      else {
        // ha elérte az ASTEROID-ot akkor az lesz a bázis
        this.objectId = this.objectNewId;
        this.objectNewId = '';
      }
    };
  }
}

// a FLY-ok léterhozása
function createFly() {
  // az ASTEROID div létrehozása
  let asteroids = document.querySelectorAll('.asteroid');
  let asteroidsNumber = asteroids.length;
  for (let i = 0; i <= flysNumber; i++) {
    
    // melyik aszterodidán tapadjon meg
    let number =  Math.floor(Math.random() * asteroidsNumber);

    // az aszteroida koordinátái 
    let objectOrigoCoord = objectOrigo(asteroids[number]);
    
    // a FLY új koordinátái
    let flyLeft = objectOrigoCoord.left - flySize / 2;
    let flyTop = objectOrigoCoord.top - flySize / 2;
        
    // a légy ID-je
    let id = "f" + i;
    
    // létrehozom a FLY-t
    flys.push(new fly(flyLeft, flyTop, id, asteroids[number].id));
    
    // létrehozom a legyet a DOM-ban
    let element = document.createElement("div");
    element.style.left = flyLeft + 'px'; 
    element.style.top = flyTop + 'px'; 
    element.classList.add('fly', 'object');
    element.setAttribute('id', id);
    document.getElementById('map').appendChild(element);     
  }
}

// a FLYs frissítése
function updateFly() {
  for (let i = 0; i < flys.length; i++) {
    // ugrás
    flys[i].jump();
  }
}

//-----------------------------------
// MAP frissítése
//-----------------------------------

function updateGameArea() {
  // A balra
  if (myGameArea.keys && myGameArea.keys[68]) {
    myGameArea.mapAngle += myGameArea.speed * myGameArea.speedRotate;
    myGameArea.coord(0);
    myGameArea.changeMapPos();
  }
  // D jobbra
  if (myGameArea.keys && myGameArea.keys[65]) {
    myGameArea.mapAngle -= myGameArea.speed * myGameArea.speedRotate;
    myGameArea.coord(0);
    myGameArea.changeMapPos();
  }
  // W előre
  if (myGameArea.keys && myGameArea.keys[87]) {
    myGameArea.coord(myGameArea.speed);
    myGameArea.changeMapPos();
    
  }
  // S hátra
  if (myGameArea.keys && myGameArea.keys[83]) {
    myGameArea.coord(-myGameArea.speed);
    myGameArea.changeMapPos();
    ship.crash = 0;
  }
  // SPACE fire
  if (myGameArea.keys && myGameArea.keys[32] && bullet.change === 0) {
    bullet.fire();
  }

  // a FLYs mozgatása
  updateFly();

  //-----------------------------------
  // ütközések vizsgálata
  //-----------------------------------

  let my = new Object;
  let other = new Object;

  // ha mozog a BULLET kell a mérete
  if (bullet.change === 1 && bullet.direction === 0) {
    my.left = bullet.left;
    my.right = bullet.left + bullet.size;
    my.top = bullet.top;
    my.bottom = bullet.top + bullet.size;
  }

  // a FLY és BULLET ütközés vizsgálat
  //-----------------------------------

  let follow = 0;
  for (let i = 0; i < flys.length; i++) {
    let fly = flys[i];
    let id = fly.objectNewId;
    // ha rátapad akkor növeli
    if (id === "s1") follow++; 
    
    // ha mozog a BULLET akkor nézi az ütközést
    if (bullet.change === 1 && bullet.direction === 0) {
      // fly keret      
      other.left = fly.left;
      other.right = fly.left + flySize;
      other.top = fly.top;
      other.bottom = fly.top + flySize;
      // ütközés a FLY és a BULLET között
      if (crash(my, other)) {
        // ha ütközés van akkor nő a SHIELD
        ship.shield += ship.shieldIn;
        flys.splice(i, 1);
        document.getElementById(fly.id).remove();
      }        
    }
  }
  
  // ha FLY követ, akkor csökken a SHIELD
  if (follow > 0) {
      ship.shield -= follow * ship.shieldOut;
  } 

  // MORSEL ütközés és összegyűjtés
  //-----------------------------------

  // a MORSELs
  let morsels = document.querySelectorAll('.morsel');
  // a SHIP koordinátái
  my = getShipCoord();
  
  // ütközésvizsgálat az egyes MORSEL-eknél
  for (let c = 0; c < morsels.length; c++) {
    let morsel =  morsels[c];
    other.left = parseInt(morsel.style.left);
    other.right = other.left + 10;
    other.top = parseInt(morsel.style.top);
    other.bottom = other.top + 10;

    // ütközés vizsgálat a SHIP és a MORSEL között
    if (crash(my, other)) {
      // ütközés esetén egyel kevesebb MORSEL
      ship.morsel -= 1;
      // törlés a MAP-ról
      document.getElementById(morsel.id).remove();
    } 
  }

  // ASTEROID és SHIP ütközés vizsgálat
  //-----------------------------------

  // a SHIP koordinátái
  my = getShipCoord(); 
  let cr = astoriodCrash(my);
  if (cr) {
      myGameArea.keys[87] = false;
      ship.crash = 1;      
  }

  // a SHIP a MAP-on van
  other = {left: 5, right: myGameArea.mapHeight - 5, top: 5, bottom: myGameArea.mapWidth - 5};
  if (!crash(my, other)) {
    myGameArea.keys[87] = false;
    ship.crash = 1;
    // ship.shield -= 10;
  }

}

// SHIP és ASTERIOD ütközés
//-----------------------------------

function astoriodCrash(my, op) { 
  // a ASTEROID-ok
  let asteroids = document.querySelectorAll('.asteroid'); 
  for (let a = 0; a < asteroids.length; a++) {
    const asteroid = asteroids[a];
    other  = getAsteroidCoord(asteroid);
    // ha nekimegy az ASTEROID-nak akkor ne menjen előre
    if (crash(my, other)) {
      return asteroids[a].id;
    }
  }
  return false;
}

//-----------------------------------
// kiegészítő függvények
//-----------------------------------

// a SHIP sarokpontjai
function getShipCoord() {
  let ob = new Object;
  let shipDiv = document.getElementById('s1');
  ob.left = parseInt(shipDiv.style.left) - 5;
  ob.right = parseInt(shipDiv.style.left) + 5;
  ob.top = parseInt(shipDiv.style.top);
  ob.bottom =  parseInt(shipDiv.style.top) + 10;
  return ob;
}

// a ASTEROID sarokpontjai
function getAsteroidCoord(asteroid) {
  let ob = new Object;
  ob.left = parseInt(asteroid.style.left);
  ob.right = parseInt(asteroid.style.left) + parseInt(asteroid.style.width);
  ob.top = parseInt(asteroid.style.top);
  ob.bottom =  parseInt(asteroid.style.top)  + parseInt(asteroid.style.height);
  return ob;
}

// két elem ütközésének vizsgálata
function crash(my, other) {
  if ((my.bottom < other.top) || (my.top > other.bottom) || (my.right < other.left) || (my.left > other.right)) {
    return false;
  }
  return true;
}

// kiszámolja két koordináta között a távolságot, irányt, és left, top mozgatást
function objectDirection(targetLeft, targetTop, size, obj) {  
  let distN = distance(targetLeft, obj.left, targetTop, obj.top);
  let angleN = Math.atan2(targetTop - obj.top - size / 2, targetLeft - obj.left - size / 2) * 180 / Math.PI;;
  let leftDistN = Math.cos(obj.objectAngle * Math.PI / 180) * obj.speed;
  let topDistN = Math.sin(obj.objectAngle * Math.PI / 180) * obj.speed;
  return {dist: distN, angle: angleN, leftDist: leftDistN, topDist: topDistN}
}

// két koordináta közötti távolság
function distance(x1, x2, y1, y2) {
  return Math.sqrt((x1 - x2 - flySize / 2) ** 2 + (y1 - y2 - flySize / 2) ** 2);        
}

// origó kiszámítása
function objectOrigo(object) {
  let left = parseInt(object.style.left) + parseInt(object.style.width)/2;
  let top  = parseInt(object.style.top) + parseInt(object.style.height)/2;

  return {left: left, top: top}
}
