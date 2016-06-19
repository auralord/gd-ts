let RED = 0;
let GREEN = 1;
let BLUE = 2;

let BUFF_NA = -1;
let BUFF_ATTACK = 0;
let BUFF_HEALTH = 1;
let BUFF_BOTH = 2;

class Card {
    type: number;
    power: number;

    constructor(type: number, power: number) {
        this.type = type;
        this.power = power;
    }
}

class Monster {
    type: number;
    attack: number;
    health: number;
    buffType: number;
    buffValue: number;
    legit: boolean = true;

    constructor(cards: Card[]) {
        if (cards.length !== 3) {
            throw new Error("3 Card object needed");
        }

        let num: number[] = [0, 0, 0];
        let pow: number[] = [0, 0, 0];
        for (let i in cards) {
            num[cards[i].type] += 1;
            pow[cards[i].type] += cards[i].power;
        }
        if (num[RED] === 3) {
            this.type = 0;
            this.attack = pow[RED];
            this.health = 1;
            this.buffType = BUFF_NA;
            this.buffValue = 0;
        } else if (num[RED] === 2 && num[GREEN] === 1) {
            this.type = 1;
            this.attack = pow[RED];
            this.health = pow[GREEN];
            this.buffType = BUFF_NA;
            this.buffValue = 0;
        } else if (num[RED] === 2 && num[BLUE] === 1) {
            this.type = 2;
            this.attack = pow[RED];
            this.health = 1;
            this.buffType = BUFF_ATTACK;
            this.buffValue = pow[BLUE];
        } else if (num[GREEN] === 3) {
            this.type = 3;
            this.attack = 1;
            this.health = pow[GREEN];
            this.buffType = BUFF_NA;
            this.buffValue = 0;
        } else if (num[GREEN] === 2 && num[RED] === 1) {
            this.type = 4;
            this.attack = pow[RED];
            this.health = pow[GREEN];
            this.buffType = BUFF_NA;
            this.buffValue = 0;
        } else if (num[GREEN] === 2 && num[BLUE] === 1) {
            this.type = 5;
            this.attack = 1;
            this.health = pow[GREEN];
            this.buffType = BUFF_HEALTH;
            this.buffValue = pow[BLUE];
        } else if (num[BLUE] === 3) {
            this.type = 6;
            this.attack = 1;
            this.health = 1;
            this.buffType = BUFF_BOTH;
            this.buffValue = pow[BLUE];
        } else if (num[BLUE] === 2 && num[RED] === 1) {
            this.type = 7;
            this.attack = Math.ceil(pow[BLUE] / 2);
            this.health = 1;
            this.buffType = BUFF_ATTACK;
            this.buffValue = 2 * pow[RED];
        } else if (num[BLUE] === 2 && num[GREEN] === 1) {
            this.type = 8;
            this.attack = 1;
            this.health = Math.ceil(pow[BLUE] / 2);
            this.buffType = BUFF_HEALTH;
            this.buffValue = 2 * pow[GREEN]
        } else {
            this.legit = false;
        }
    }
}

class Deck {
    left: number;
    cards: Card[];

    constructor() {
        this.left = 45;
        this.cards = [];
        for (let i = 0; i < 45; i++) {
            let type = Math.floor(i / 15);
            let power = i % 5 + 1;
            this.cards[i] = new Card(type, power);
        }

        let curr = this.left;
        let temp;
        let rand;
        while (curr !== 0) {
            rand = Math.floor(Math.random() * curr);
            curr -= 1;
            temp = this.cards[curr];
            this.cards[curr] = this.cards[rand];
            this.cards[rand] = temp;
        }
    }

    draw(): Card {
        this.left -= 1;
        return this.cards.pop();
    }
}

class Hand {
    cards: Card[];

    constructor() {
        this.cards = [];
    }

    use(index: number): Card {
        return this.cards.splice(index, 1)[0];
    }

    get(index: number): Card {
        return this.cards[index];
    }

    add(card: Card) {
        this.cards.push(card);
    }
}

class Field {
    monsters: Monster[];

    attackBuffInstances: { value: number, origin: number }[];
    healthBuffInstances: [number][];
    healthBuffActive: number[];

    constructor() {
        this.monsters = [];

        // [source][target]
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

    summon(monster: Monster) {
        let buff: number = monster.buffType;
        let value: number = monster.buffValue;
        let index: number = this.monsters.length;

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
    }

    damage(index: number, value: number): boolean {
        let hp: number = this.monsters[index].health;
        for (var i = 4; i >= 0; i--) {
            if (value > this.healthBuffInstances[i][index]) {
                value -= this.healthBuffInstances[i][index];
                this.healthBuffInstances[i][index] = 0;
            } else {
                this.healthBuffInstances[i][index] -= value;
                value = 0;
                break;
            }
        }
        hp -= value;

        if (hp <= 0) {
            let type: number = this.monsters[index].buffType;
            let value: number = this.monsters[index].buffValue;
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
                // TODO untested
                this.healthBuffInstances[index] = [0, 0, 0, 0, 0];
                for (var i = 0; i < this.healthBuffInstances.length; i++) {
                    this.healthBuffInstances[i].splice(index, 1);
                    this.healthBuffInstances[i].push(0);
                }
            }
            this.monsters.splice(index, 1);
            return true;
        } else {
            this.monsters[index].health = hp;
            return false;
        }
    }

    getAttackValue(index: number): number {
        let attack: number = this.monsters[index].attack;
        for (let instance of this.attackBuffInstances) {
            if (instance === undefined || instance === null || instance.origin === index) {
                continue;
            }
            attack += instance.value;
        }
        return attack;
    }

    getHealthValue(index: number): number {
        let health = this.monsters[index].health;
        for (let instance of this.healthBuffInstances) {
            health += instance[index];
        }
        return health;
    }
}

class Player {
    hp: number;
    deck: Deck;
    maxDraw: number;
    field: Field;
    maxField: number;
    hand: Hand;
    maxHand: number;
    maxSwap: number;

    constructor() {
        this.hp = 3;
        this.deck = new Deck();
        this.maxDraw = 1;
        this.field = new Field();
        this.maxField = 5;
        this.hand = new Hand();
        this.maxHand = 6;
        this.maxSwap = 1;

        for (let i = 0; i < 5; i++) {
            this.hand.add(this.deck.draw());
        }
    }

    maxDrawsAllowed(): number {
        let difference: number = this.maxHand - this.hand.cards.length;
        let drawn: number = this.maxDraw;

        if (drawn < difference) {
            return drawn;
        } else {
            return difference;
        }
    }

    canSummonMonster(): boolean {
        return this.field.monsters.length < 5;
    }

    hasMonsters(): boolean {
        return this.field.monsters.length > 0;
    }

    receiveDirectAttack(): boolean {
        this.hp--;
        this.maxDraw++;
        this.maxHand++;
        this.maxSwap++;
        return this.hp <= 0;
    }

    draw(amount: number): Card[] {
        let drawn: Card[] = [];
        for (let i = 0; i < amount; i++) {
            let card = this.deck.draw();
            this.hand.add(card);
            drawn.push(card);
        }
        return drawn;
    }
}

class Trading {
    deck: Deck;
    queue: Card[];

    constructor() {
        this.deck = new Deck();
        this.queue = [];

        for (var i = 0; i < 3; i++) {
            this.queue.push(this.deck.draw());
        }
    }

    new() {
        this.queue.shift();
        this.queue.push(this.deck.draw());
    }

    swap(player: Player, hIndex: number, fIndex: number) {
        if (hIndex > 4 || hIndex < 0) {
            throw new Error("Tidak bisa menukar kartu tangan dengan index: " + hIndex)
        }
        if (fIndex > 2 || fIndex < 0) {
            throw new Error("Tidak bisa menukar free card dengan index: " + fIndex);
        }

        let handCard: Card = player.hand.get(hIndex);
        let freeCard: Card = this.queue[fIndex];
        player.hand.cards[hIndex] = freeCard;
        this.queue[fIndex] = handCard;
    }
}