var RED = 0;
var GREEN = 1;
var BLUE = 2;
var BUFF_NA = -1;
var BUFF_ATTACK = 0;
var BUFF_HEALTH = 1;
var BUFF_BOTH = 2;
var Card = (function () {
    function Card(type, power) {
        this.type = type;
        this.power = power;
    }
    return Card;
}());
var Monster = (function () {
    function Monster(cards) {
        this.legit = true;
        if (cards.length !== 3) {
            throw new Error("3 Card object needed");
        }
        var num = [0, 0, 0];
        var pow = [0, 0, 0];
        for (var i in cards) {
            num[cards[i].type] += 1;
            pow[cards[i].type] += cards[i].power;
        }
        if (num[RED] === 3) {
            this.type = 0;
            this.attack = pow[RED];
            this.health = 1;
            this.buffType = BUFF_NA;
            this.buffValue = 0;
        }
        else if (num[RED] === 2 && num[GREEN] === 1) {
            this.type = 1;
            this.attack = pow[RED];
            this.health = pow[GREEN];
            this.buffType = BUFF_NA;
            this.buffValue = 0;
        }
        else if (num[RED] === 2 && num[BLUE] === 1) {
            this.type = 2;
            this.attack = pow[RED];
            this.health = 1;
            this.buffType = BUFF_ATTACK;
            this.buffValue = pow[BLUE];
        }
        else if (num[GREEN] === 3) {
            this.type = 3;
            this.attack = 1;
            this.health = pow[GREEN];
            this.buffType = BUFF_NA;
            this.buffValue = 0;
        }
        else if (num[GREEN] === 2 && num[RED] === 1) {
            this.type = 4;
            this.attack = pow[RED];
            this.health = pow[GREEN];
            this.buffType = BUFF_NA;
            this.buffValue = 0;
        }
        else if (num[GREEN] === 2 && num[BLUE] === 1) {
            this.type = 5;
            this.attack = 1;
            this.health = pow[GREEN];
            this.buffType = BUFF_HEALTH;
            this.buffValue = pow[BLUE];
        }
        else if (num[BLUE] === 3) {
            this.type = 6;
            this.attack = 1;
            this.health = 1;
            this.buffType = BUFF_BOTH;
            this.buffValue = pow[BLUE];
        }
        else if (num[BLUE] === 2 && num[RED] === 1) {
            this.type = 7;
            this.attack = Math.ceil(pow[BLUE] / 2);
            this.health = 1;
            this.buffType = BUFF_ATTACK;
            this.buffValue = 2 * pow[RED];
        }
        else if (num[BLUE] === 2 && num[GREEN] === 1) {
            this.type = 8;
            this.attack = 1;
            this.health = Math.ceil(pow[BLUE] / 2);
            this.buffType = BUFF_HEALTH;
            this.buffValue = 2 * pow[GREEN];
        }
        else {
            this.legit = false;
        }
    }
    return Monster;
}());
var Deck = (function () {
    function Deck() {
        this.left = 45;
        this.cards = [];
        for (var i = 0; i < 45; i++) {
            var type = Math.floor(i / 15);
            var power = i % 5 + 1;
            this.cards[i] = new Card(type, power);
        }
        var curr = this.left;
        var temp;
        var rand;
        while (curr !== 0) {
            rand = Math.floor(Math.random() * curr);
            curr -= 1;
            temp = this.cards[curr];
            this.cards[curr] = this.cards[rand];
            this.cards[rand] = temp;
        }
    }
    Deck.prototype.draw = function () {
        this.left -= 1;
        return this.cards.pop();
    };
    return Deck;
}());
var Hand = (function () {
    function Hand() {
        this.cards = [];
    }
    Hand.prototype.use = function (index) {
        return this.cards.splice(index, 1)[0];
    };
    Hand.prototype.get = function (index) {
        return this.cards[index];
    };
    Hand.prototype.add = function (card) {
        this.cards.push(card);
    };
    return Hand;
}());
var Field = (function () {
    function Field() {
        this.monsters = [];
        this.attackBuffInstances = [];
        this.healthBuffInstances = [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ];
        this.healthBuffActive = [0, 0, 0, 0, 0];
    }
    Field.prototype.summon = function (monster) {
        var buff = monster.buffType;
        var value = monster.buffValue;
        var index = this.monsters.length;
        if (buff === BUFF_BOTH || buff === BUFF_ATTACK) {
            this.attackBuffInstances[index] = {
                value: value,
                origin: index
            };
        }
        if (buff === BUFF_BOTH || buff === BUFF_HEALTH) {
            this.healthBuffInstances[index] = [value, value, value, value, value];
            this.healthBuffInstances[index][index] = 0;
            this.healthBuffActive[index] = value;
        }
        this.monsters.push(monster);
    };
    Field.prototype.damage = function (index, value) {
        var hp = this.monsters[index].health;
        for (var i = 4; i >= 0; i--) {
            if (value > this.healthBuffInstances[i][index]) {
                value -= this.healthBuffInstances[i][index];
                this.healthBuffInstances[i][index] = 0;
            }
            else {
                this.healthBuffInstances[i][index] -= value;
                value = 0;
                break;
            }
        }
        hp -= value;
        if (hp <= 0) {
            var type = this.monsters[index].buffType;
            var value_1 = this.monsters[index].buffValue;
            if (type === BUFF_BOTH || type === BUFF_ATTACK) {
                for (var i = 0; i < this.attackBuffInstances.length; i++) {
                    if (this.attackBuffInstances[i] === undefined || this.attackBuffInstances[i] === null) {
                        continue;
                    }
                    if (this.attackBuffInstances[i].origin === index) {
                        this.attackBuffInstances.splice(i, 1);
                    }
                }
            }
            if (type === BUFF_BOTH || type === BUFF_HEALTH) {
                this.healthBuffInstances[index] = [0, 0, 0, 0, 0];
                for (var i = 0; i < this.healthBuffInstances.length; i++) {
                    this.healthBuffInstances[i].splice(index, 1);
                    this.healthBuffInstances[i].push(0);
                }
            }
            this.monsters.splice(index, 1);
            return true;
        }
        else {
            this.monsters[index].health = hp;
            return false;
        }
    };
    Field.prototype.getAttackValue = function (index) {
        var attack = this.monsters[index].attack;
        for (var _i = 0, _a = this.attackBuffInstances; _i < _a.length; _i++) {
            var instance = _a[_i];
            if (instance === undefined || instance === null || instance.origin === index) {
                continue;
            }
            attack += instance.value;
        }
        return attack;
    };
    Field.prototype.getHealthValue = function (index) {
        var health = this.monsters[index].health;
        for (var _i = 0, _a = this.healthBuffInstances; _i < _a.length; _i++) {
            var instance = _a[_i];
            health += instance[index];
        }
        return health;
    };
    return Field;
}());
var Player = (function () {
    function Player() {
        this.hp = 3;
        this.deck = new Deck();
        this.maxDraw = 1;
        this.field = new Field();
        this.maxField = 5;
        this.hand = new Hand();
        this.maxHand = 6;
        this.maxSwap = 1;
        for (var i = 0; i < 5; i++) {
            this.hand.add(this.deck.draw());
        }
    }
    Player.prototype.maxDrawsAllowed = function () {
        var difference = this.maxHand - this.hand.cards.length;
        var drawn = this.maxDraw;
        if (drawn < difference) {
            return drawn;
        }
        else {
            return difference;
        }
    };
    Player.prototype.canSummonMonster = function () {
        return this.field.monsters.length < 5;
    };
    Player.prototype.hasMonsters = function () {
        return this.field.monsters.length > 0;
    };
    Player.prototype.receiveDirectAttack = function () {
        this.hp--;
        this.maxDraw++;
        this.maxHand++;
        this.maxSwap++;
        return this.hp <= 0;
    };
    Player.prototype.draw = function (amount) {
        var drawn = [];
        for (var i = 0; i < amount; i++) {
            var card = this.deck.draw();
            this.hand.add(card);
            drawn.push(card);
        }
        return drawn;
    };
    return Player;
}());
var Trading = (function () {
    function Trading() {
        this.deck = new Deck();
        this.queue = [];
        for (var i = 0; i < 3; i++) {
            this.queue.push(this.deck.draw());
        }
    }
    Trading.prototype.new = function () {
        this.queue.shift();
        this.queue.push(this.deck.draw());
    };
    Trading.prototype.swap = function (player, hIndex, fIndex) {
        if (hIndex > player.maxHand - 1 || hIndex < 0) {
            throw new Error("Tidak bisa menukar kartu tangan dengan index: " + hIndex);
        }
        if (fIndex > 2 || fIndex < 0) {
            throw new Error("Tidak bisa menukar free card dengan index: " + fIndex);
        }
        var handCard = player.hand.get(hIndex);
        var freeCard = this.queue[fIndex];
        player.hand.cards[hIndex] = freeCard;
        this.queue[fIndex] = handCard;
    };
    return Trading;
}());
var fontDefault = {
    font: "24px serif",
    fill: "gray"
};
var fontLight = {
    font: "24px serif",
    fill: "white"
};
var ALLY = 0;
var ENEMY = 1;
var PREVIEW = 2;
var players;
var trading;
var active;
var enemy;
var hasDrawn;
var handSelected;
var summonQueue;
var attacker;
var target;
var hasAttacked;
var directAttack;
var swap;
var numOfSwaps;
var isSwapping;
var firstTurn;
var game;
var bg;
var playerInfo;
var enemyInfo;
var drawButton;
var endTurnButton;
var handCards;
var attackButton;
var playerMonsters;
var enemyMonsters;
var summonPreview;
var playerHP;
var enemyHP;
var tradeCenter;
var freeCards;
var swapInfo;
var noPeeking;
var end;
function createButton(text, style, x, y, texture, callback, context) {
    var btn = game.add.button(x, y, texture, callback, context);
    var txt = game.add.text(0, 0, text, style);
    txt.anchor.set(0.5, 0.5);
    txt.x = Math.floor(btn.width / 2);
    txt.y = Math.floor(btn.height / 2);
    btn.addChild(txt);
    return btn;
}
function createCard(card, x, y, isFreeCard) {
    var colors = ["red", "green", "blue"];
    var type = card.type;
    var power = card.power;
    var callback;
    if (isFreeCard) {
        callback = selectFreeCard;
    }
    else {
        callback = selectHandCard;
    }
    var btn = game.add.button(x, y, "card", callback, this);
    var txt = game.add.text(0, 0, card.power.toString(), fontDefault);
    txt.anchor.set(0.5, 0.5);
    var atr = game.add.sprite(0, 0, "c_" + colors[type]);
    atr.anchor.set(0.5, 0.5);
    txt.x = atr.x = Math.floor(btn.width / 2);
    txt.y = 80;
    atr.y = 40;
    btn.addChild(txt);
    btn.addChild(atr);
    return btn;
}
function createMonster(monster, x, y, callback, context, side) {
    var ap = 0;
    var hp = 0;
    var bp = 0;
    var t = monster.type;
    if (side === ALLY) {
        var index = players[active].field.monsters.indexOf(monster);
        ap = players[active].field.getAttackValue(index);
        hp = players[active].field.getHealthValue(index);
    }
    else if (side === ENEMY) {
        var index = players[enemy].field.monsters.indexOf(monster);
        ap = players[enemy].field.getAttackValue(index);
        hp = players[enemy].field.getHealthValue(index);
    }
    else {
        ap = monster.attack;
        hp = monster.health;
    }
    var render = game.add.button(x, y, "monster", callback, context, t, t, t, t);
    var atk = game.add.text(22, 118, ap.toString(), fontDefault);
    atk.anchor.set(0.5, 0.5);
    var hlt = game.add.text(81, 118, hp.toString(), fontDefault);
    hlt.anchor.set(0.5, 0.5);
    render.addChild(atk);
    render.addChild(hlt);
    if (monster.buffType > BUFF_NA) {
        var type = ["ATK", "HP", "ALL"];
        var i = monster.buffType;
        var power = monster.buffValue;
        var text = type[i] + " +" + power;
        var buf = game.add.text(50, 5, text, { font: "12px serif", fill: "white" });
        buf.anchor.set(0.5, 0.5);
        var bufBG = game.add.sprite(50, 0, 'buff');
        bufBG.anchor.set(0.5, 0.5);
        render.addChild(bufBG);
        render.addChild(buf);
    }
    return render;
}
function updateDrawButton() {
    var display = drawButton.getChildAt(0);
    var left = players[active].deck.left;
    display.text = "Draw (" + left + ")";
}
function checkAttackButtonVisibility() {
    if (firstTurn) {
        attackButton.visible = false;
        return;
    }
    if (players[enemy].hasMonsters()) {
        var display = attackButton.getChildAt(0);
        display.text = "Attack";
        directAttack = false;
        if (attacker >= 0 && target >= 0) {
            attackButton.visible = true;
        }
        else {
            attackButton.visible = false;
        }
    }
    else {
        var display = attackButton.getChildAt(0);
        display.text = "Direct Attack";
        directAttack = true;
        if (attacker >= 0) {
            attackButton.visible = true;
        }
        else {
            attackButton.visible = false;
        }
    }
}
function closeNoPeeking() {
    noPeeking.visible = false;
}
function playerDrawCard(button) {
    if (!hasDrawn) {
        var draws = players[active].maxDrawsAllowed();
        var drawn = players[active].draw(draws);
        for (var _i = 0, drawn_1 = drawn; _i < drawn_1.length; _i++) {
            var card = drawn_1[_i];
            addToHandCard(card);
        }
        drawButton.frame = 1;
        hasDrawn = true;
        updateDrawButton();
        handCards.removeAll();
        renderHandCard();
    }
}
function playerEndTurn() {
    active = (active + 1) % 2;
    firstTurn = false;
    initTurn(active);
}
function selectHandCard(button) {
    var i = handCards.getChildIndex(button);
    if (isSwapping) {
        performSwap(i);
        return;
    }
    var card = players[active].hand.cards[i];
    if (!handSelected[i]) {
        if (summonQueue.length < 3) {
            button.tint = 0x666666;
            handSelected[i] = true;
            summonQueue.push(card);
        }
    }
    else {
        button.tint = 0xffffff;
        handSelected[i] = false;
        var j = summonQueue.indexOf(card);
        summonQueue.splice(j, 1);
    }
    if (summonQueue.length === 3 && players[active].canSummonMonster()) {
        var monster = new Monster(summonQueue);
        if (monster.legit) {
            var x = 10 + players[active].field.monsters.length * 110;
            var y = 270;
            var render = createMonster(monster, 0, 0, summonPreviewedMonster, this, PREVIEW);
            var info = game.add.text(50, -15, "click to summon", { font: "18px serif", fill: "white", align: "center" });
            info.anchor.set(0.5, 0.5);
            summonPreview.addChild(render);
            summonPreview.addChild(info);
            summonPreview.x = x;
            summonPreview.y = y;
        }
        else {
            summonPreview.removeAll();
        }
    }
    else {
        summonPreview.removeAll();
    }
}
function summonPreviewedMonster(button) {
    var newMonster = new Monster(summonQueue);
    players[active].field.summon(newMonster);
    var child = createMonster(newMonster, button.x, button.y, selectOwnMonster, this, ALLY);
    playerMonsters.addChild(child);
    summonPreview.removeAll();
    summonQueue = [];
    var deleted = [];
    for (var i = 0, max = players[active].hand.cards.length; i < max; i++) {
        if (handSelected[i]) {
            handSelected[i] = false;
            deleted.push(i);
        }
    }
    deleted.sort();
    deleted.reverse();
    for (var _i = 0, deleted_1 = deleted; _i < deleted_1.length; _i++) {
        var i = deleted_1[_i];
        players[active].hand.use(i);
    }
    handCards.removeAll();
    renderHandCard();
    playerMonsters.removeAll();
    renderOwnField();
}
function selectOwnMonster(button) {
    if (attacker > -1) {
        var old = playerMonsters.getChildAt(attacker);
        old.tint = 0xffffff;
    }
    var index = playerMonsters.getIndex(button);
    if (!hasAttacked[index]) {
        button.tint = 0x666666;
        attacker = index;
        checkAttackButtonVisibility();
    }
    else {
    }
}
function selectEnemyMonster(button) {
    if (target > -1) {
        var old = enemyMonsters.getChildAt(target);
        old.tint = 0xffffff;
    }
    var index = enemyMonsters.getIndex(button);
    button.tint = 0x666666;
    target = index;
    checkAttackButtonVisibility();
}
function performAttack(button) {
    if (players[enemy].hasMonsters()) {
        var damage = players[active].field.getAttackValue(attacker);
        var destroyed = players[enemy].field.damage(target, damage);
        if (destroyed) {
            target = -1;
            attackButton.visible = false;
        }
    }
    else {
        var defeat = players[enemy].receiveDirectAttack();
        console.log(defeat + ": " + players[enemy].hp);
        if (defeat) {
            end.addChild(game.add.sprite(0, 0, 'p' + (active + 1), 0));
        }
    }
    hasAttacked[attacker] = true;
    var monster = playerMonsters.getChildAt(attacker);
    monster.tint = 0xffffff;
    attacker = -1;
    checkAttackButtonVisibility();
    enemyMonsters.removeAll();
    renderEnemyField();
    updateHealth();
}
function selectFreeCard(button) {
    isSwapping = false;
    swapInfo.visible = false;
    freeCards.children.forEach(function (element) {
        var b = element;
        b.tint = 0xFFFFFF;
    });
    if (numOfSwaps < 1) {
        return;
    }
    var i = freeCards.getIndex(button);
    if (swap === i) {
        swap = -1;
    }
    else {
        swap = i;
        button.tint = 0x666666;
        isSwapping = true;
        swapInfo.visible = true;
    }
}
function performSwap(hand) {
    trading.swap(players[active], hand, swap);
    handCards.removeAll();
    renderHandCard();
    updateFreeCards();
    numOfSwaps--;
    swapInfo.visible = false;
    isSwapping = false;
    swap = -1;
}
function initTurn(player) {
    active = player;
    enemy = (active + 1) % 2;
    if (!firstTurn) {
        noPeeking.visible = true;
    }
    updateHealth();
    summonQueue = [];
    handSelected = [false, false, false, false, false, false, false, false];
    handCards.removeAll();
    renderHandCard();
    updateDrawButton();
    if (players[active].maxDrawsAllowed() > 0) {
        drawButton.frame = 0;
    }
    else {
        drawButton.frame = 1;
    }
    hasDrawn = false;
    attackButton.visible = false;
    attacker = -1;
    target = -1;
    playerMonsters.removeAll();
    enemyMonsters.removeAll();
    summonPreview.removeAll();
    renderOwnField();
    renderEnemyField();
    playerInfo.text = "Player " + (active + 1);
    hasAttacked = [false, false, false, false, false, false, false, false];
    swap = -1;
    numOfSwaps = players[active].maxSwap;
    isSwapping = false;
    swapInfo.visible = false;
    trading.new();
    updateFreeCards();
}
function renderHandCard() {
    var total = players[active].hand.cards.length;
    for (var i = 0; i < total; i++) {
        var x = 10 + (i * 100);
        var y = 420;
        var card = players[active].hand.cards[i];
        var render = createCard(card, x, y);
        handCards.add(render);
    }
}
function addToHandCard(card) {
    var total = players[active].hand.cards.length - 1;
    var x = 10 + total * 100;
    var y = 420;
    var render = createCard(card, x, y);
    handCards.addChild(render);
}
function renderOwnField() {
    var total = players[active].field.monsters.length;
    for (var i = 0; i < total; i++) {
        var x = 10 + i * 110;
        var y = 270;
        var monster = players[active].field.monsters[i];
        var render = createMonster(monster, x, y, selectOwnMonster, this, ALLY);
        playerMonsters.addChild(render);
    }
}
function renderEnemyField() {
    var total = players[enemy].field.monsters.length;
    for (var i = 0; i < total; i++) {
        var x = 10 + i * 110;
        var y = 10;
        var monster = players[enemy].field.monsters[i];
        var render = createMonster(monster, x, y, selectEnemyMonster, this, ENEMY);
        enemyMonsters.addChild(render);
    }
}
function renderHealth() {
    for (var i = 0; i < 3; i++) {
        playerHP.add(game.add.sprite(i * 42, 0, 'heart', 0));
        enemyHP.add(game.add.sprite(i * 42, 0, 'heart', 0));
    }
    playerHP.x = 120;
    playerHP.y = 545;
    enemyHP.x = 575;
    enemyHP.y = 15;
}
function updateHealth() {
    var hp1 = players[active].hp;
    for (var i = 0; i < 3; i++) {
        var frame = void 0;
        if (i < hp1) {
            frame = 0;
        }
        else {
            frame = 1;
        }
        var heart = playerHP.getChildAt(i);
        heart.frame = frame;
    }
    var hp2 = players[enemy].hp;
    for (var i = 0; i < 3; i++) {
        var frame = void 0;
        if (i < hp2) {
            frame = 0;
        }
        else {
            frame = 1;
        }
        var heart = enemyHP.getChildAt(i);
        heart.frame = frame;
    }
}
function renderFreeCards() {
    tradeCenter.x = 600;
    tradeCenter.y = 75;
    game.add.sprite(0, 0, 'trade_bg', 0, tradeCenter);
    tradeCenter.add(freeCards);
    var info = game.add.text(12, 30, "Discarded\non\n end turn", {
        font: "14px serif",
        fill: "white",
        align: "center"
    }, tradeCenter);
    var t2 = game.add.text(50, 150, "2", fontLight, tradeCenter);
    var t3 = game.add.text(50, 250, "3", fontLight, tradeCenter);
    var t4 = game.add.text(-5, 195, "Trade Card", { font: "14px serif", fill: "white" }, tradeCenter);
    t4.angle = -90;
    swapInfo = game.add.text(250, 400, "Select card to swap", { font: "14px serif", fill: "white" });
    swapInfo.anchor.x = 0.5;
}
function updateFreeCards() {
    freeCards.removeAll();
    for (var i = 0; i < trading.queue.length; i++) {
        freeCards.add(createCard(trading.queue[i], 80, 10 + i * 105, true));
    }
}
function preload() {
    game.load.spritesheet('button', "assets/button.png", 190, 49);
    game.load.spritesheet('heart', "assets/heart copy.png", 40, 34);
    game.load.image('nopeek', "assets/nopeek.jpg");
    game.load.spritesheet('monster', "assets/monster.png", 100, 135);
    game.load.image('card', "assets/card.png");
    game.load.image('c_red', "assets/red.png");
    game.load.image('c_green', "assets/green.png");
    game.load.image('c_blue', "assets/blue.png");
    game.load.image('trade_bg', "assets/tradepanel.png");
    game.load.image('bg', 'assets/bg.JPG');
    game.load.image('p1', "assets/p1v.jpg");
    game.load.image('p2', "assets/p2v.jpg");
    game.load.image('buff', "assets/buff.png");
}
function create() {
    bg = game.add.sprite(0, 0, 'bg');
    playerInfo = game.add.text(15, 550, "Player's turn ", fontLight);
    enemyInfo = game.add.text(700, 20, "Enemy", fontLight);
    handCards = game.add.group();
    playerMonsters = game.add.group();
    enemyMonsters = game.add.group();
    summonPreview = game.add.group();
    playerHP = game.add.group();
    enemyHP = game.add.group();
    tradeCenter = game.add.group();
    freeCards = game.add.group();
    endTurnButton = createButton("EndTurn", fontLight, 400, 540, "button", playerEndTurn, this);
    drawButton = createButton("Draw", fontLight, 600, 540, "button", playerDrawCard, this);
    attackButton = createButton("Attack", fontLight, 220, 180, "button", performAttack, this);
    end = game.add.group();
    noPeeking = game.add.button(0, 0, 'nopeek', closeNoPeeking, this);
    noPeeking.visible = false;
    renderHealth();
    renderFreeCards();
    updateFreeCards();
    initTurn(active);
}
function initGameStates() {
    players = [new Player(), new Player()];
    trading = new Trading();
    active = 0;
    enemy = 1;
    hasDrawn = false;
    firstTurn = true;
    handSelected = [false, false, false, false, false, false, false, false];
    summonQueue = [];
}
window.onload = function () {
    initGameStates();
    game = new Phaser.Game(800, 600, Phaser.AUTO, 'content', { preload: preload, create: create });
};
