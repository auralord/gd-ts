// const
let fontDefault = {
	font: "24px serif",
	fill: "gray"
}
let fontLight = {
	font: "24px serif",
	fill: "white"
}
let ALLY: number = 0;
let ENEMY: number = 1;
let PREVIEW: number = 2;

// vars
let players: Player[];
let trading: Trading;
let active: number;
let enemy: number;
let hasDrawn: boolean;
let handSelected: boolean[];
let summonQueue: Card[];
let attacker: number;
let target: number;
let hasAttacked: boolean[];
let directAttack: boolean;
let swap: number;
let numOfSwaps: number;
let isSwapping: boolean;
let firstTurn: boolean;

// phaser objects
let game: Phaser.Game;
let bg: Phaser.Sprite;
let playerInfo: Phaser.Text;
let enemyInfo: Phaser.Text;
let drawButton: Phaser.Button;
let endTurnButton: Phaser.Button;
let handCards: Phaser.Group;
let attackButton: Phaser.Button;
let playerMonsters: Phaser.Group;
let enemyMonsters: Phaser.Group;
let summonPreview: Phaser.Group;
let playerHP: Phaser.Group;
let enemyHP: Phaser.Group;
let tradeCenter: Phaser.Group;
let freeCards: Phaser.Group;
let swapInfo: Phaser.Text;
let noPeeking: Phaser.Button;
let end: Phaser.Group;

// helpers
function createButton(text: string, style: { font: string, fill: string }, x: number, y: number, texture: string, callback: any, context: any): Phaser.Button {
	let btn: Phaser.Button = game.add.button(x, y, texture, callback, context);
	let txt: Phaser.Text = game.add.text(0, 0, text, style);
	txt.anchor.set(0.5, 0.5);
	txt.x = Math.floor(btn.width / 2);
	txt.y = Math.floor(btn.height / 2);
	btn.addChild(txt);
	return btn;
}

function createCard(card: Card, x: number, y: number, isFreeCard?: boolean): Phaser.Button {
	let colors: string[] = ["red", "green", "blue"];
	let type: number = card.type;
	let power: number = card.power;

	let callback;
	if (isFreeCard) {
		callback = selectFreeCard;
	} else {
		callback = selectHandCard;
	}

	let btn: Phaser.Button = game.add.button(x, y, "card", callback, this);
	let txt: Phaser.Text = game.add.text(0, 0, card.power.toString(), fontDefault);
	txt.anchor.set(0.5, 0.5);
	let atr: Phaser.Sprite = game.add.sprite(0, 0, "c_" + colors[type]);
	atr.anchor.set(0.5, 0.5);
	txt.x = atr.x = Math.floor(btn.width / 2);
	txt.y = 80;
	atr.y = 40;

	btn.addChild(txt);
	btn.addChild(atr);
	return btn;
}

function createMonster(monster: Monster, x: number, y: number, callback: any, context: any, side: number): Phaser.Button {
	let ap: number = 0;
	let hp: number = 0;
	let bp: number = 0;
	let t: number = monster.type;

	if (side === ALLY) {
		let index: number = players[active].field.monsters.indexOf(monster);
		ap = players[active].field.getAttackValue(index);
		hp = players[active].field.getHealthValue(index);
	} else if (side === ENEMY) {
		let index: number = players[enemy].field.monsters.indexOf(monster);
		ap = players[enemy].field.getAttackValue(index);
		hp = players[enemy].field.getHealthValue(index);
	} else {
		ap = monster.attack;
		hp = monster.health;
	}

	let render: Phaser.Button = game.add.button(x, y, "monster", callback, context, t, t, t, t);

	let atk: Phaser.Text = game.add.text(22, 118, ap.toString(), fontDefault);
	atk.anchor.set(0.5, 0.5);

	let hlt: Phaser.Text = game.add.text(81, 118, hp.toString(), fontDefault);
	hlt.anchor.set(0.5, 0.5);

	render.addChild(atk);
	render.addChild(hlt);

	if (monster.buffType > BUFF_NA) {
		let type: string[] = ["ATK", "HP", "ALL"];
		let i: number = monster.buffType;
		let power: number = monster.buffValue;
		let text: string = `${type[i]} +${power}`;
		let buf: Phaser.Text = game.add.text(50, 5, text, {font: "12px serif", fill: "white"});
		buf.anchor.set(0.5, 0.5);

		let bufBG: Phaser.Sprite = game.add.sprite(50, 0, 'buff');
		bufBG.anchor.set(0.5, 0.5);

		render.addChild(bufBG);
		render.addChild(buf);
	}
	return render;
}

function updateDrawButton() {
	let display: Phaser.Text = <Phaser.Text>drawButton.getChildAt(0);
	let left: number = players[active].deck.left;
	display.text = `Draw (${left})`;
}

function checkAttackButtonVisibility() {
	if (firstTurn) {
		attackButton.visible = false;
		return;
	}

	if (players[enemy].hasMonsters()) {
		let display: Phaser.Text = <Phaser.Text>attackButton.getChildAt(0);
		display.text = "Attack";

		directAttack = false;

		if (attacker >= 0 && target >= 0) {
			attackButton.visible = true;
		} else {
			attackButton.visible = false;
		}
	} else {
		let display: Phaser.Text = <Phaser.Text>attackButton.getChildAt(0);
		display.text = "Direct Attack";

		directAttack = true;

		if (attacker >= 0) {
			attackButton.visible = true;
		} else {
			attackButton.visible = false;
		}
	}
}

// callbacks
function closeNoPeeking() {
	noPeeking.visible = false;
}

function playerDrawCard(button: Phaser.Button) {
	if (!hasDrawn) {
		let draws: number = players[active].maxDrawsAllowed();
		let drawn: Card[] = players[active].draw(draws);
		for (let card of drawn) {
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

function selectHandCard(button: Phaser.Button) {
	let i: number = handCards.getChildIndex(button);

	if (isSwapping) {
		performSwap(i);
		return;
	}

	let card: Card = players[active].hand.cards[i];

	if (!handSelected[i]) {
		if (summonQueue.length < 3) {
			button.tint = 0x666666;
			handSelected[i] = true;
			summonQueue.push(card);
		}
	} else {
		button.tint = 0xffffff;
		handSelected[i] = false;
		let j: number = summonQueue.indexOf(card);
		summonQueue.splice(j, 1);
	}

	if (summonQueue.length === 3 && players[active].canSummonMonster()) {
		let monster: Monster = new Monster(summonQueue);
		if (monster.legit) {
			let x: number = 10 + players[active].field.monsters.length * 110;
			let y: number = 270;
			let render: Phaser.Button = createMonster(monster, 0, 0, summonPreviewedMonster, this, PREVIEW);
			let info: Phaser.Text = game.add.text(50, -15, "click to summon", { font: "18px serif", fill: "white", align: "center" })
			info.anchor.set(0.5, 0.5);
			summonPreview.addChild(render);
			summonPreview.addChild(info);
			summonPreview.x = x;
			summonPreview.y = y;
		} else {
			summonPreview.removeAll();
		}
	} else {
		summonPreview.removeAll();
	}
}

function summonPreviewedMonster(button: Phaser.Button) {
	let newMonster = new Monster(summonQueue);
	players[active].field.summon(newMonster);

	let child: Phaser.Button = createMonster(newMonster, button.x, button.y, selectOwnMonster, this, ALLY);
	playerMonsters.addChild(child);

	summonPreview.removeAll();
	summonQueue = [];

	let deleted: number[] = [];
	for (let i = 0, max = players[active].hand.cards.length; i < max; i++) {
		if (handSelected[i]) {
			handSelected[i] = false;
			deleted.push(i);
		}
	}
	deleted.sort();
	deleted.reverse();
	for (let i of deleted) {
		players[active].hand.use(i);
	}

	handCards.removeAll();
	renderHandCard();

	playerMonsters.removeAll();
	renderOwnField();
}

function selectOwnMonster(button: Phaser.Button) {
	if (attacker > -1) {
		let old: Phaser.Button = <Phaser.Button>playerMonsters.getChildAt(attacker);
		old.tint = 0xffffff;
	}

	let index: number = playerMonsters.getIndex(button);

	if (!hasAttacked[index]) {
		button.tint = 0x666666;
		attacker = index;
		checkAttackButtonVisibility();
	} else {
		
	}
}

function selectEnemyMonster(button: Phaser.Button) {
	if (target > -1) {
		let old: Phaser.Button = <Phaser.Button>enemyMonsters.getChildAt(target);
		old.tint = 0xffffff;
	}

	let index: number = enemyMonsters.getIndex(button);
	button.tint = 0x666666;
	target = index;
	checkAttackButtonVisibility();
}

function performAttack(button: Phaser.Button) {
	if (players[enemy].hasMonsters()) {
		let damage: number = players[active].field.getAttackValue(attacker);
		let destroyed: boolean = players[enemy].field.damage(target, damage);

		if (destroyed) {
			target = -1;
			attackButton.visible = false;
		}
	} else {
		let defeat: boolean = players[enemy].receiveDirectAttack();
		console.log(defeat + ": " + players[enemy].hp);
		if (defeat) {
			end.addChild(game.add.sprite(0, 0, 'p' + (active + 1), 0));
		}
	}

	hasAttacked[attacker] = true;

	let monster: Phaser.Button = <Phaser.Button>playerMonsters.getChildAt(attacker);
	monster.tint = 0xffffff;
	attacker = -1;
	checkAttackButtonVisibility();

	enemyMonsters.removeAll();
	renderEnemyField();

	updateHealth();
}

function selectFreeCard(button: Phaser.Button) {
	isSwapping = false;
	swapInfo.visible = false;
	freeCards.children.forEach(element => {
		let b: Phaser.Button = <Phaser.Button>element;
		b.tint = 0xFFFFFF
	});
	if (numOfSwaps < 1) {
		return;
	}

	let i: number = freeCards.getIndex(button);
	if (swap === i) {
		swap = -1;
	} else {
		swap = i;
		button.tint = 0x666666;
		isSwapping = true;
		swapInfo.visible = true;
	}
}

function performSwap(hand: number) {
	trading.swap(players[active], hand, swap);
	handCards.removeAll();
	renderHandCard();
	updateFreeCards();
	numOfSwaps--;
	swapInfo.visible = false;
	isSwapping = false;
	swap = -1;
}

// game mechanics
function initTurn(player: number) {
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
	} else {
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

	playerInfo.text = `Player ${active + 1}`;

	hasAttacked = [false, false, false, false, false, false, false, false];

	swap = -1;
	numOfSwaps = players[active].maxSwap;
	isSwapping = false;
	swapInfo.visible = false;
	trading.new();
	updateFreeCards();
}

function renderHandCard() {
	let total: number = players[active].hand.cards.length;
	for (let i = 0; i < total; i++) {
		let x: number = 10 + (i * 100);
		let y: number = 420;
		let card: Card = players[active].hand.cards[i];
		let render: Phaser.Button = createCard(card, x, y);
		handCards.add(render);
	}
}

function addToHandCard(card: Card) {
	let total: number = players[active].hand.cards.length - 1;
	let x: number = 10 + total * 100;
	let y: number = 420;
	let render: Phaser.Button = createCard(card, x, y);
	handCards.addChild(render);
}

function renderOwnField() {
	let total: number = players[active].field.monsters.length;
	for (let i = 0; i < total; i++) {
		let x: number = 10 + i * 110;
		let y: number = 270;
		let monster: Monster = players[active].field.monsters[i];
		let render: Phaser.Button = createMonster(monster, x, y, selectOwnMonster, this, ALLY);
		playerMonsters.addChild(render);
	}
}

function renderEnemyField() {
	let total: number = players[enemy].field.monsters.length;
	for (let i = 0; i < total; i++) {
		let x: number = 10 + i * 110;
		let y: number = 10;
		let monster: Monster = players[enemy].field.monsters[i];
		let render: Phaser.Button = createMonster(monster, x, y, selectEnemyMonster, this, ENEMY);
		enemyMonsters.addChild(render);
	}
}

function renderHealth() {
	for (let i = 0; i < 3; i++) {
		playerHP.add(game.add.sprite(i * 42, 0, 'heart', 0));
		enemyHP.add(game.add.sprite(i * 42, 0, 'heart', 0));
	}
	playerHP.x = 120;
	playerHP.y = 545;
	enemyHP.x = 575;
	enemyHP.y = 15;
}

function updateHealth() {
	let hp1: number = players[active].hp;
	for (var i = 0; i < 3; i++) {
		let frame: number;
		if (i < hp1) {
			frame = 0;
		} else {
			frame = 1;
		}
		let heart: Phaser.Sprite = <Phaser.Sprite>playerHP.getChildAt(i);
		heart.frame = frame;
	}

	let hp2: number = players[enemy].hp;
	for (var i = 0; i < 3; i++) {
		let frame: number;
		if (i < hp2) {
			frame = 0;
		} else {
			frame = 1;
		}
		let heart: Phaser.Sprite = <Phaser.Sprite>enemyHP.getChildAt(i);
		heart.frame = frame;
	}
}

function renderFreeCards() {
	tradeCenter.x = 600;
	tradeCenter.y = 75;

	game.add.sprite(0, 0, 'trade_bg', 0, tradeCenter);
	tradeCenter.add(freeCards);

	let info: Phaser.Text = game.add.text(12, 30, "Discarded\non\n end turn", { 
		font: "14px serif",
		fill: "white",
		align: "center"
	 }, tradeCenter);

	let t2: Phaser.Text = game.add.text(50, 150, "2", fontLight, tradeCenter);
	let t3: Phaser.Text = game.add.text(50, 250, "3", fontLight, tradeCenter);
	let t4: Phaser.Text = game.add.text(-5, 195, "Trade Card", { font: "14px serif", fill: "white" }, tradeCenter);
	t4.angle = -90;

	swapInfo = game.add.text(250, 400, "Select card to swap", { font: "14px serif", fill: "white" });
	swapInfo.anchor.x = 0.5;
}

function updateFreeCards() {
	freeCards.removeAll();
	for (var i = 0; i < trading.queue.length; i++) {
		freeCards.add(
			createCard(trading.queue[i], 80, 10 + i * 105, true)
		);
	}
}

// phaser methods
function preload() {
	game.load.spritesheet('button', "assets/button.png", 190, 49);
	game.load.spritesheet('heart', "assets/heart copy.png", 40, 34)
	game.load.image('nopeek', "assets/nopeek.JPG");
	game.load.spritesheet('monster', "assets/monster.PNG", 100, 135);
	game.load.image('card', "assets/card.png");
	game.load.image('c_red', "assets/red.png");
	game.load.image('c_green', "assets/green.png");
	game.load.image('c_blue', "assets/blue.png");
	game.load.image('trade_bg', "assets/tradepanel.png");
	game.load.image('bg', 'assets/bg.JPG');
	game.load.image('p1', "assets/p1v.jpg");
	game.load.image('p2', "assets/p2v.jpg");
	game.load.image('buff', "assets/buff.png")
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

// LOOK AT IT GO
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

window.onload = () => {
	initGameStates();
	game = new Phaser.Game(800, 600, Phaser.AUTO, 'content', { preload: preload, create: create });
}