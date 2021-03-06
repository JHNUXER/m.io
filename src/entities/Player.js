var Hammer = require('../weapon/Hammer');
var Items = require('../utils/Items');

class Player {
	static getId() {
		// Example ID: _nHpPQT_l0zYRzjUAABL
		var res = "";
		for (var i = 0; i < Player.ID_LEN; ++i) {
			res += Player.ID_CHARS[Math.floor(Math.random() * Player.ID_CHARS_LEN)];
		}
		return res;
	}
	getData() {
		return  [
			this.id,
			this.sid,
			this.name,
			this.x,
			this.y,
			this.angle,
			this.health,
			this.maxHealth,
			this.scale
		];
	}
	getUpdateData() {
		this.dataCache = [
			this.sid,
			this.x,
			this.y,
			this.angle,
			this.buildCode,
			this.weaponCode,
			this.team,
			this.skinCode
		]
		return this.dataCache;
	}
	get attackingState() {
		return (this.autoAtk || this.attacking);
	}
	get canUpgrade() {
		return (this.upgradePoints >= 0);
	}
	gather(object, multiplier) {
		var me = this;
		var rate = me.gatherRate * multiplier;
		switch (object.constructor.name) {
			case "Stone":
				me.stone += rate;
				break;
			case "Tree":
				me.wood += rate;
				break;
			case "Bush":
				me.food += rate;
				break;
		}
		me.xp += this.xpGain;
		if (me.xp > me.maxXP) {
			// Level up
			me.maxXP += me.xpIncrease;
			me.xpIncrease *= 1.1;
			me.xp = 0;
			me.age++;
			me.onAge();
		}
	}
	onAge() {
		this.upgradePoints++;
		this.gameServer.manager.playerAge(this.socket);
	}
	hitFrom(attacker) {
		var me = this;
		me.health -= attacker.player.damage;
	}
	killScore(victim) {
		var inc = 0;
		if (victim.player) {
			if (victim.player.score === 0) {
				inc = 10;
			} else if (victim.player.score > 10) {
				inc = victim.player.score / 1.5;
			}
		}
		this.score = inc;
	}
	get isDead() {
		return (this.health <= 0);
	}
	hasHat(id) {
		for (var i = 0; i < this.hats.length; ++i) {
			if (this.hats[i].id == id)
				return true;
		}
		return false;
	}
	getHat(id) {
		for (var i = 0; i < this.hats.length; ++i) {
			if (this.hats[i].id == id)
				return this.hats[i];
		}
		return null;
	}
	addHat(hat) {
		this.hats.push(hat);
	}
	equiptHat(hat) {
		this.hat = hat;
		this.skinCode = hat.id;
	}
	unequipt() {
		this.hat = null;
		this.skinCode = 0;
	}
	alertDeath() {
		this.socket.emit("11");
	}
	resetPlayer(preserveStats) {
		this.health = 100;
		this.maxHealth = 100;
		this.alive = true;
		this.downX = false;
		this.downY = false;
		this.damage = 5;

		if (preserveStats === false) {
			this.score = 0;
			this.stone = 0;
			this.wood = 0;
			this.food = 0;
			this.gatherRate = 1;
			this.angle = 0;
			this.age = 0;
			this.xp = 0;
			this.maxXP = 100;
			this.xpIncrease = 60;
			this.hats = [];
			this.hat = null;
		}
	}
	setWeapon(weapon) {
		var me = this;
		me.weapon = weapon;
		me.weapon.effect.call(me, me);
	}
	canBuild(item) {
		var me = this;
		return (
				me.stone >= item.costs.stone &&
				me.wood >= item.costs.wood &&
				me.food >= item.costs.food
			);
	}
	useCurrentItem() {
		var me = this;
		var item = Items.items[me.items[me.buildCode]];
		if (item) {
			item.use(me);
		}
		me.gameServer.manager.updateHealth(me.socket);
	}
	constructor(socket, sid, gameServer) {
		var me = this;

		// Enviroment based properties
		this.playersNear = [];
		this.objsNear = [];
		this.dataCache = null;
		this.angle = 0;
		this.x = -1;
		this.y = -1;

		// Connection based properties
		this.sid = sid;
		this.id = Player.getId();
		this.socket = socket;
		this.connected = false;
		this.spawned = false;
		this.alive = false;
		this.gameServer = gameServer;

		// Player statistics based properties
		this.health = 100;
		this.maxHealth = 100; // TODO: make this customizable
		this.name = "unknown";
		this.scale = 35; // default
		this.stone = 0;
		this.wood = 0;
		this.food = 0;
		this.score = 0; // Score is the same as gold
		this.gatherRate = 2;

		// Item based properties
		this.weaponCode = 0; // 0 == Default hammer
		this.buildCode = -1; // -1 == No build item
		this.skinCode = 0; // 0 == No skin / hat
		this.hat = null;
		this.hats = [];
		this.upgradePoints = 0;
		this.items = [ // Array of the player's items as IDs
			0, 2, 4, 6
		];
		this.weapons = [
			0
		];

		// Movement based properties
		this.dirX = null;
		this.dirY = null;
		this.downX = false;
		this.downY = false;

		// Clan based properties
		this.team = null;
		this.clan = null;
		this.joiningClan = false;

		// PvP based properties
		this.attackDist = 10;
		this.xpGain = 1;
		this.autoAtk = false;
		this.attacking = false;
		this.hitObj = false;
		this.xp = 0;
		this.maxXP = 100;
		this.xpIncrease = 60;
		this.age = 1;
		this.damage = 5;

		this.setWeapon(new Hammer); // Set weapon to hammer (default)
	}
}
Player.ID_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+-=[]{}.,<>';:/";
Player.ID_CHARS_LEN = Player.ID_CHARS.length; // The length of ID_CHARS doesn't need to be calculated more than once
Player.ID_LEN = 20;
module.exports = Player;