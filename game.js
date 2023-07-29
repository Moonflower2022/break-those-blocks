// info:
// on board nested array 0 is nothing, blocks are numbers and power ups are strings
// blocks space x is from 0 to 1440 y is from 10 to 663
// for board coords, board[y][x] maps to x: (x+1/2)*rectSize.x, y: (y+1/2)*rectSize.y + topMarginSpace

// bugs

//TODO

// maybe add another buttons stats
// why lag T_T
// add hover explainations for buttons in top right
// finish menu buttons

// MAIN MENU
// idea in ipad freeform (a moment in the game but the blocks are buttons)
// buttons:
// -> play
// -> info
//    -> include all the hotkeys
// use ctrl/cmd + and - to adjust screen size
// -> f to fullscreen
// -> x to skip to next round
// -> left and right arrows to aim
// -> enter to shoot
// -> space to speed up balls
// -> p to pause/resume
//    -> write a blurb
//    -> contanct maybe?
// -> leaderboards & stats
//    -> when clicked display smth saying this feature is coming soon!
//    -> an input to display user's name on the scoreboard (either monitor it for extreme profanity or add some kind of check)
//    -> normal, hard, and power scores and blocks broken
//    -> life time stats (dont put on leader boards, just display them under)
//       -> total blocks broken
//       -> total damage dealt
//       -> total balls picked up
//       -> total rounds survived


// ANIMATION:
// -> use of powerups
// -> ball moving trail
// -> collecting balls (balls that hit the floor 
// stay on the floor and when round over all them converge onto shooting point)

// game over screen
// -> play again button on right
// -> home button on left

// GAME
// hamburger menu top right
// -> tutorial
//    -> how to play
//    -> "try out the different power ups!"

// modes
// -> power (higher powerup spawn rate, more health for blocks and start with more balls)
// -> normal
// -> hard

// sound
// -> ball hitting block
// -> round passing
// -> losing
// -> clicking buttons
// -> music

// misc
// -> achievements
// -> skins for the balls?

const windowWidth = 1440
const windowHeight = 739
const gameWindowWidth = 1440
const gameWindowHeight = 584
const blockColors = [[0, 45, 104], [2, 62, 138], [0, 119, 182], [0, 150, 199], [0, 180, 216]]
const ballColor = [66, 173, 245]
const poweredBallColor = [92, 92, 92]
const gameOverDropDownColor = [102, 178, 255]
const powerupBannerColor = [255, 255, 102]
const modeRotation = ["Normal", "Hard", "Power"]
const modeDescriptions = {Normal: "A (somewhat but not really) classic", Hard: "I actually don't expect you to get past 20 score on this one :)", Power: "Extra powerups, extra health on blocks. Have fun!"}
const framesPerBallShot = 5
const rowNum = 10
const colNum = 12
const rectSize = {
	x: gameWindowWidth / colNum,
	y: gameWindowHeight / rowNum
}
const powerupSpawnRates = {
	ball: 1,
	split: 0.1,
	double: 0.1,
	power: 0.1,
	ghost: 0.1
}
const powerupRoundEffectiveness = {
	double: 5,
	power: 5,
	ghost: 5
}
const powerupDiameter = 45
const ballDiameter = 15
const ballSpeed = 15
const topMarginSpace = 100
const board_description = `
xxxxxxxxxxxx
xxxxxxxxxxxx
xxxxxxxxxxxx
xxxxxxxxxxxx
xxxxxxxxxxxx
xxxxxxxxxxxx
xxxxxxxxxxxx
xxxxxxxxxxxx
xxxxxxxxxxxx
xxxxxxxxxxxx
`;
//testing board
// const board_description = `
// xxxxxxxxxxx1
// xxxxxxxxxxx1
// xxxxxxxxxxx1
// xxxxxxxxxxx1
// 111111111111
// 111111111111
// 111111111111
// xxxxxxxxxx1x
// xxxxxxxxxxxx
// xxxxxxxxxxxx
// `;
const demoDescription = `
xxxxxxxxxxxx
xxxxxxxxxxxx
xxxxxxxxxxxx
xxxxxxxxmxxx
xlxixpsxdxbx
xxxxxxxxxxxx
xxxxxxxxxxxx
xxx5xxxxx3x2
xxxxxxxxxxxx
xxxxxxxxxxxx
`;
const mouseAngleCutoff = 5
const slowMultiplier = 16
const exceptionBlocks = ["x", "p", "i", "l", "m", "b", "s", "d"]

var balls, walls, blocks, testingWalls,
	leftWall, rightWall, upWall,
	downWall, powerups,
	playButton, infoButton, leaderboardsButton,
	scoreDisplay, blocksBrokenDisplay, modeDisplay, modeDescription,
	gameOverDropdown, demoSpriteGroups, demoBalls,
	demoBlocks, demoBoard, musicButton,
	soundButton, pauseButton, tutorialButton,
	autoSkipButton, // sprites + sprite groups including some signs and buttons
	mouseAngle, board, firstX, randomNum, demoBallsShotFrame, demoBallsToShoot;// game logic


// phases can be ["menu", "options"] ["game"] ["game", "options"] ["game", "game over screen"]
let phase = ["menu"]
let difficulty = "easy"
let options = {
	sound: true,
	music: true,
	autoSkip: false,
	pause: false
}
let mode;
let allParticles = []

// game variables

let currentEffects = {
	double: 0,
	power: 0,
	ghost: 0
}
let roundNum = 0
let blocksBroken = 0

let ballCenterPos = {
	x: colNum / 2 * rectSize.x,
	y: windowHeight - 60 - 4
}
let ballNum = 1
let ballNumProxy = 1
let isFiring = false
let ballsShotFrame = 0;
let ballsToShoot = [];
let ballsInAir = false
let firstBallLanded = false;
let posToSetZero = []
let newBest = false
let effectsDrawQueue = []

// random useful stuff

function switchVisibility(bool) {
	balls.visible = bool
	downWall.visible = bool
	walls.visible = bool
	blocks.visible = bool
	powerups.visible = bool
	pauseButton.visible = bool
}

function turnSplitBack(splitSprite) {
	splitSprite.img = splitPowerupImage
}

// game flow logic

function resetGame() {
	currentEffects = {
		power: 0,
		double: 0,
		ghost: 0
	}
	roundNum = 0
	blocksBroken = 0
	ballCenterPos = {
		x: colNum / 2 * rectSize.x,
		y: windowHeight - 60 - 4
	}
	ballNum = 1
	ballNumProxy = 1
	isFiring = false
	ballsShotFrame = 0
	ballsToShoot = []
	ballsInAir = false
	firstBallLanded = false;
	randomNum = random()
	posToSetZero = []
	powerupsToKill = []
	newBest = false
	effectsDrawQueue = []
	balls.remove()
	board = generateBoardFromDescription(board_description, mainConvertFunction)
	roundIncrement(ballCenterPos.x)
	mouseAngle = atan2((mouseX - ballCenterPos.x), (mouseY - ballCenterPos.y))
	updateMousePos()
}

function genObjs() {
	let posOptions = []
	for (let i = 0; i < colNum; i++) {
		posOptions.push(i)
	}
	let blockGenPositions = []
	let blockGenNum;
	if (isBetween(roundNum, 0, 30)) {
		blockGenNum = floor(random(2, 5 + 1))
	} else if (isBetween(roundNum, 30, 50)) {
		blockGenNum = floor(random(2, 7 + 1))
	} else if (isBetween(roundNum, 50, 70)) {
		blockGenNum = floor(random(5, 11 + 1))
	} else if (isBetween(roundNum, 70, 100)) {
		blockGenNum = floor(random(7, 11 + 1))
	} else if (roundNum >= 100) {
		blockGenNum = floor(random(9, 11 + 1))
	} else {
		gameOn = false
		alert("error! use find command to see where this came from.")
	}
	for (let i = 0; i < blockGenNum; i++) {
		let blockPos = random(posOptions)
		blockGenPositions.push(blockPos)
		posOptions.splice(posOptions.indexOf(blockPos), 1)
	}
	for (let index of blockGenPositions) {
		board[0][index] = roundNum
	}
	for (let powerupType in powerupSpawnRates) {
		if (random() < powerupSpawnRates[powerupType]) {
			let insertPos = random(posOptions)
			board[0][insertPos] = powerupType
			posOptions.splice(posOptions.indexOf(insertPos), 1)
		}
	}
}

function shiftBoard() {
	let newLine = []
	for (let x = 0; x < colNum; x++) {
		newLine[x] = 0
	}
	board.unshift(newLine)
	board.pop()
	blocks.move(rectSize.y, "down", 5)
	powerups.move(rectSize.y, "down", 5)
}

function checkWin() {
	let gameOver = false
	for (let i = 0; i < colNum; i++) {
		if (typeof board[rowNum - 2][i] === "number" && board[rowNum - 2][i] != 0) {
			gameOver = true
		}
	}
	if (gameOver) {
		phase = ["game", "game over screen"]
		balls.collider = "none"
		gameOverDropdown.visible = true
		gameOverHomeButton.visible = true
		gameOverPlayAgainButton.visible = true
		let direction = random(["left", "right", "up", "down"])
		let shiftAmount = {
			left: windowWidth,
			right: rectSize.x * 11,
			up: windowHeight,
			down: rectSize.y * 10

		}[direction]
		switch (direction) {
			case "left":
				gameOverDropdown.x = rectSize.x * 6 + shiftAmount
				break
			case "right":
				gameOverDropdown.x = rectSize.x * 6 - shiftAmount
				break
			case "up":
				gameOverDropdown.y = rectSize.y * 5 + shiftAmount + topMarginSpace
				break
			case "down":
				gameOverDropdown.y = rectSize.y * 5 - shiftAmount + topMarginSpace
				break
		}
		gameOverDropdown.move(shiftAmount, direction, 10)

	}
}

function roundIncrement(ballXPos) {
	// for split powerups
	if (posToSetZero != []) {
		for (let pos of posToSetZero) {
			board[pos.y][pos.x] = 0
			ballpowerupExplosion(pos.x, pos.y, "split")
		}
		posToSetZero = []
	}

	for (let powerupType in currentEffects) {
		if (currentEffects[powerupType] != 0) {
			currentEffects[powerupType]--
			currentEffects[powerupType] === 0 ? effectsDrawQueue.splice(effectsDrawQueue.indexOf(powerupType), 1) : null;
		}
	}

	roundNum++
	if (parseInt(localStorage.getItem(mode)) < roundNum - 1 || !localStorage.getItem(mode)) {
		localStorage.setItem(mode, (roundNum - 1).toString())
		if (!newBest) {
			newBest = true
		}
	}
	firstX = null;
	firstBallLanded = false;
	ballCenterPos.x = ballXPos

	// check if a power up has reached last row
	for (let i = 0; i < colNum; i++) {
		for (let powerupType of ["ball", "split", "power", "double", "ghost"]) {
			if (board[8][i] === powerupType) {
				board[8][i] = 0
				switch (powerupType) {
					case "ball":
						currentEffects.double != 0 ? ballNumProxy += 2 : ballNumProxy++
						break
					case "power":
					case "double":
					case "ghost":
						currentEffects[powerupType] += powerupRoundEffectiveness[powerupType]
						break

				}
				ballpowerupExplosion(i, 9, powerupType)
			}
		}
	}
	if (ballNumProxy != ballNum) {
		ballNum = ballNumProxy
	}
	updateBalls(balls, ballNum, ballCenterPos.x)

	genObjs()
	updateBlocks()
	updatePowerups()
	checkWin()
	shiftBoard()
	updateMousePos()
}

function applySpeedToGroup(group, n, angle, timeMultiplier) {
	if (n >= 1 && isFiring) {
		group[n - 1].addSpeed(ballSpeed, angle)
		setTimeout(applySpeedToGroup, 50 * timeMultiplier, group, n - 1, angle, timeMultiplier)
	} else {
		isFiring = false
	}
}

// explosion animations

function blockExposion(block) {
	let particleGroup = new Group()
	let particleSize = {
		x: block.w / 8,
		y: block.h / 4
	}
	for (let x = 0; x < 8; x++) {
		for (let y = 0; y < 4; y++) {
			let particle = new Sprite(block.x - block.w / 2 + (x + 1 / 2) * particleSize.x, block.y - block.h / 2 + (y + 1 / 2) * particleSize.y, particleSize.x, particleSize.y, "dynamic")
			particle.color = block.color
			particle.direction = random(0, 360)
			particle.speed = 5
			particle.strokeWeight = 0
			particleGroup.add(particle)
		}
	}

	for (let group of [balls, downWall, blocks, powerups, gameOverHomeButton, gameOverPlayAgainButton, demoBalls, demoBlocks, playButton, infoButton, leaderboardsButton, scoreDisplay, blocksBrokenDisplay, modeDisplay, modeDescription]){
		particleGroup.overlap(group)
	}
	particleGroup.collide(walls)
	allParticles.push({group: particleGroup, n: 30, start: frameCount})
	//slowlySelfDestruct(particleGroup, 0, timeMultiplier, phase[0])
}

function ballpowerupExplosion(x, y, type) {

}

function slowlySelfDestruct(group, n, timeMultiplier, originPhase) {
	if (n <= 30) {
		for (let sprite of group) {
			sprite.vel.y = sprite.vel.y + 1
			sprite.w = sprite.w - sprite.w / 30
			sprite.h = sprite.h - sprite.h / 30
		}
		setTimeout(slowlySelfDestruct, 100 * timeMultiplier/3, group, n + 1, timeMultiplier, originPhase)
	} else {
		group.removeAll()
	}
}

function showTutorial() {

}

function updateMousePos() {
	mouseAngle = atan2((mouseX - ballCenterPos.x), (mouseY - ballCenterPos.y))
	if (mouseAngle > -(90 + mouseAngleCutoff) && mouseAngle < 0) {
		mouseAngle = -(90 + mouseAngleCutoff)
	}
	if (mouseAngle >= 0 && mouseAngle < 90 + mouseAngleCutoff) {
		mouseAngle = 90 + mouseAngleCutoff
	}
}

function shootBalls(){
	ballsInAir = true
	isFiring = true
	ballsShotFrame = frameCount
	for (let i = 0; i < balls.length; i ++){
		ballsToShoot[i] = i
	}
}

function skip() {
	balls.remove()
	roundIncrement(colNum / 2 * rectSize.x)
	ballsInAir = false
	isFiring = false
}

function pauseButtonCalls(){
	options.pause = !options.pause
	pauseButton.img = options.pause ? resumeButtonImage : pauseButtonImage
	if (!options.pause && !isFiring) {
		updateMousePos()
	}
}

function switchPhase() {
	for (let particleObj of allParticles) {
		particleObj.group.remove()
	}
	allParticles = []
}

function resetDemoBlocks() {
	demoBoard = generateBoardFromDescription(demoDescription, x => x)
	textFont(oswald, 18)
	for (let x = 0; x < colNum; x++) {
		for (let y = 0; y < rowNum; y++) {
			if (parseInt(demoBoard[y][x]) && parseInt(demoBoard[y][x]) > 0) {
				let block = new Sprite(rectSize.x * (x + 1 / 2), rectSize.y * (y + 1 / 2) + topMarginSpace, rectSize.x, rectSize.y, "kinematic")
				if (parseInt(demoBoard[y][x]) / 5 === 1) {
					block.color = color(...blockColors[0])
				} else {
					for (let i = 0; i < blockColors.length; i++) {
						if (isBetween(parseInt(demoBoard[y][x]) / 5, i * 1 / blockColors.length, (i + 1) * 1 / blockColors.length)) {
							block.color = color(...blockColors[blockColors.length - i - 1])
							break;
						}
					}
				}
				block.textColor = color(255)
				block.text = demoBoard[y][x]
				block.strokeWeight = 0
				demoBlocks.add(block)
			}
		}
	}
}

function menuCalls() {
	blocks.remove()
	powerups.remove()
	currentEffects = {
		power: 0,
		double: 0,
		ghost: 0
	}
	mode = localStorage.getItem("mode") ? localStorage.getItem("mode") : "Normal"
	demoBalls = new Group();
	demoBlocks = new Group();
	let demoWalls = new Group();
	let demoButtons = new Group();
	let demoDisplays = new Group();

	let demoTopWall = new Sprite(windowWidth / 2, 240, windowWidth, 10, "static")
	demoTopWall.color = color(0, 0, 0)
	demoWalls.add(demoTopWall)
	//const exceptionBlocks = ["x", "p", "i", "l", "m", "b", "s", "d"]
	// 	const demoDescription = `
	// xxxxxxxxxxxx
	// xxxxxxxxxxxx
	// xxxxxxxxxxxx
	// xxxxxxxxmxxx
	// xlxixpsxdxbx
	// xxxxxxxxxxxx
	// xxxxxxxxxxxx
	// xxx5xxxbx3x2
	// xxxxxxxxxxxx
	// xxxxxxxxxxxx
	// `;
	demoBoard = generateBoardFromDescription(demoDescription, x => x)

	demoBalls.collide(walls)
	demoBalls.collide(demoTopWall)
	demoBalls.overlap(demoBalls)
	demoBalls.overlap(gameOverHomeButton)
	demoBalls.overlap(gameOverPlayAgainButton)
	demoBlocks.collide(demoBalls, ballBlockCollisionDemo)
	updateBalls(demoBalls, 7, colNum / 2 * rectSize.x)
	for (let x = 0; x < colNum; x++) {
		for (let y = 0; y < rowNum; y++) {
			if (parseInt(demoBoard[y][x]) && parseInt(demoBoard[y][x]) > 0) {
				textFont(oswald, 18)
				let block = new Sprite(rectSize.x * (x + 1 / 2), rectSize.y * (y + 1 / 2) + topMarginSpace, rectSize.x, rectSize.y, "kinematic")
				if (parseInt(demoBoard[y][x]) / 5 === 1) {
					block.color = color(...blockColors[0])
				} else {
					for (let i = 0; i < blockColors.length; i++) {
						if (isBetween(parseInt(demoBoard[y][x]) / 5, i * 1 / blockColors.length, (i + 1) * 1 / blockColors.length)) {
							block.color = color(...blockColors[blockColors.length - i - 1])
							break;
						}
					}
				}
				block.textColor = color(255)
				block.text = demoBoard[y][x]
				block.strokeWeight = 0
				demoBlocks.add(block)
			} else if (demoBoard[y][x] === "p") {
				playButton = new Sprite(rectSize.x * (x + 1), rectSize.y * (y + 1) + topMarginSpace, rectSize.x, rectSize.y * 2, "kinematic")
				playButton.img = playButtonImage
				demoButtons.add(playButton)
			} else if (demoBoard[y][x] === "i") {
				infoButton = new Sprite(rectSize.x * (x + 1), rectSize.y * (y + 1) + topMarginSpace, rectSize.x, rectSize.y * 2, "kinematic")
				infoButton.img = infoButtonImage
				demoButtons.add(infoButton)
			} else if (demoBoard[y][x] === "l") {
				leaderboardsButton = new Sprite(rectSize.x * (x + 1), rectSize.y * (y + 1) + topMarginSpace, rectSize.x, rectSize.y * 2, "kinematic")
				leaderboardsButton.img = leaderboardsButtonImage
				demoButtons.add(leaderboardsButton)
			} else if (demoBoard[y][x] === "s") {
				textFont(oswald, 18)
				scoreDisplay = new Sprite(rectSize.x * (x + 1.625), rectSize.y * (y + 1) + topMarginSpace, rectSize.x*1.25, rectSize.y, "kinematic")
				scoreDisplay.text = localStorage.getItem(mode) ? "Highscore: " + localStorage.getItem(mode) : "Highscore: None :P"
				demoDisplays.add(scoreDisplay)
			} else if (demoBoard[y][x] === "b") {
				textFont(oswald, 18)
				blocksBrokenDisplay = new Sprite(rectSize.x * (x + 0.875), rectSize.y * (y + 1) + topMarginSpace, rectSize.x*1.25, rectSize.y, "kinematic")
				blocksBrokenDisplay.text = localStorage.getItem(mode + "Blocks") ? "Most blocks broken: " + localStorage.getItem(mode + "Blocks") : "Most blocks broken: Zero"
				demoDisplays.add(blocksBrokenDisplay)
			} else if (demoBoard[y][x] === "m") {
				textFont(oswald, 26)
				modeDisplay = new Sprite(rectSize.x * (x + 1.25), rectSize.y * (y + 1.25) + topMarginSpace, rectSize.x*1.5, rectSize.y, "kinematic")
				modeDisplay.text = "Mode: " + mode
				modeDisplay.color = color(0, 102, 204)
				demoDisplays.add(modeDisplay)
			} else if (demoBoard[y][x] === "d") {
				switch (mode){
					case "Normal":
						textFont(oswald, 26)
						break
					case "Hard":
						textFont(oswald, 16)
						break
					case "Power":
						textFont(oswald, 18)
						break
				}
				modeDescription = new Sprite(rectSize.x * (x + 1.25), rectSize.y * (y + 1.75) + topMarginSpace, rectSize.x*1.5, rectSize.y*1.5, "kinematic")
				modeDescription.text = modeDescriptions[mode]
				demoDisplays.add(modeDescription)
			} 
			// ADD MODE BUTTON AND THE MODE SCORE DISPLAYERS 
			
		}
	}
	demoBallsShotFrame = frameCount
	demoBallsToShoot = []
	for (let i = 0; i < demoBalls.length; i ++){
		demoBallsToShoot[i] = i
	}
	//applySpeedToGroup(demoBalls, 7, -20, slowMultiplier)
	demoSpriteGroups.push(demoBalls, demoBlocks, demoWalls, demoButtons, demoDisplays)
}

// updating sprites

function updateBalls(ballGroup, n, xPos) {
	for (let i = 0; i < n; i++) {
		let ball = new Sprite(xPos, ballCenterPos.y, ballDiameter)
		if (currentEffects.power != 0) {
			ball.color = color(...poweredBallColor)
		} else {
			ball.color = color(...ballColor)
		}

		ball.friction = 0
		ball.bounciness = 1
		ball.strokeWeight = 0
		ballGroup.add(ball)
	}
}

function updateBlocks() {
	blocks.remove()
	textFont(oswald, 18)
	for (let x = 0; x < colNum; x++) {
		for (let y = 0; y < rowNum; y++) {
			if (board[y][x] != 0 && typeof board[y][x] === "number") {
				let block = new Sprite(rectSize.x * (x + 1 / 2), rectSize.y * (y + 1 / 2) + topMarginSpace, rectSize.x, rectSize.y, "kinematic")
				if (board[y][x] / roundNum === 1) {
					block.color = color(...blockColors[0])
				} else {
					for (let i = 0; i < blockColors.length; i++) {
						if (isBetween(board[y][x] / roundNum, i * 1 / blockColors.length, (i + 1) * 1 / blockColors.length)) {
							block.color = color(...blockColors[blockColors.length - i - 1])
							break;
						}
					}
				}
				block.textColor = color(255)
				block.text = board[y][x].toString()
				block.strokeWeight = 0
				block.layer = 0
				blocks.add(block)
			}
		}
	}
}

function updatePowerups() {
	powerups.remove()
	for (let x = 0; x < colNum; x++) {
		for (let y = 0; y < rowNum; y++) {
			if (typeof board[y][x] === "string") {
				let powerup = new Sprite(rectSize.x * (x + 1 / 2), rectSize.y * (y + 1 / 2) + topMarginSpace, "kinematic")
				switch (board[y][x]) {
					case "ball":
						powerup.addAni(ballPowerupAnimation)
						powerup.ani.scale = powerupDiameter * 0.55 / 30
						break;
					case "split":
						powerup.img = splitPowerupImage
						powerup.scale = powerupDiameter * 2 / 560
						break;
					case "double":
						powerup.img = doublePowerupImage
						powerup.scale = powerupDiameter / 90
						break;
					case "power":
						powerup.img = powerPowerupImage
						powerup.scale = powerupDiameter * 0.5 / 30
						break;
					case "ghost":
						powerup.addAni(ghostPowerupAnimation)
						powerup.ani.scale = powerupDiameter * 45 / (500 * 30)
						break;
				}
				powerup.d = powerupDiameter
				powerup.layer = 0
				for (let ball of balls) {
					powerup.overlaps(ball, ballpowerupCollision)
				}
				powerups.add(powerup)
			}
		}
	}
}

// collision logic

function ballDownWallCollision(ball) {
	if (!firstBallLanded) {
		firstX = ball.x
		firstBallLanded = true
	}
	ballsToShoot.splice(balls.indexOf(ball), 1)
	ballsToShoot = ballsToShoot.map(function (x){
		return x === null ? x : x - 1
	})
	ball.remove()
	if (balls.length === 0) {
		roundIncrement(firstX)
		ballsShotFrame = 0
		ballsInAir = false
	}
}


function ballBlockCollisionDemo(block) {
	demoBoard[floor((block.y - topMarginSpace) / rectSize.y)][floor(block.x / rectSize.x)] = (parseInt(demoBoard[floor((block.y - topMarginSpace) / rectSize.y)][floor(block.x / rectSize.x)]) - 1).toString()
	let blockNum = parseInt(demoBoard[floor((block.y - topMarginSpace) / rectSize.y)][floor(block.x / rectSize.x)])
	if (blockNum > 0) {
		block.text = blockNum
		if (blockNum / 5 === 1) {
			block.color = color(...blockColors[0])
		} else {
			for (let i = 0; i < blockColors.length; i++) {
				if (isBetween(blockNum / 5, i * 1 / blockColors.length, (i + 1) * 1 / blockColors.length)) {
					block.color = color(...blockColors[blockColors.length - i - 1])
					break;
				}
			}
		}
	} else if (blockNum <= 0) {
		demoBoard[floor((block.y - topMarginSpace) / rectSize.y)][floor(block.x / rectSize.x)] = "x"
		block.remove()
		blockExposion(block)
		if (checkEmpty(demoBoard, exceptionBlocks)) {
			setTimeout(resetDemoBlocks, 6000)
		}
	}
}

function ballBlockCollision(block) {
	currentEffects.power != 0 ? board[floor((block.y - topMarginSpace) / rectSize.y)][floor(block.x / rectSize.x)] -= 2 : board[floor((block.y - topMarginSpace) / rectSize.y)][floor(block.x / rectSize.x)]--
	let blockNum = board[floor((block.y - topMarginSpace) / rectSize.y)][floor(block.x / rectSize.x)]
	if (blockNum > 0) {
		block.text = blockNum.toString()
		if (blockNum / roundNum === 1) {
			block.color = color(...blockColors[0])
		} else {
			for (let i = 0; i < blockColors.length; i++) {
				if (isBetween(blockNum / roundNum, i * 1 / blockColors.length, (i + 1) * 1 / blockColors.length)) {
					block.color = color(...blockColors[blockColors.length - i - 1])
					break;
				}
			}
		}
	} else if (blockNum <= 0) {
		board[floor((block.y - topMarginSpace) / rectSize.y)][floor(block.x / rectSize.x)] = 0
		blocksBroken++
		if (parseInt(localStorage.getItem(mode + "Blocks")) < blocksBroken || !localStorage.getItem(mode + "Blocks")) {
			localStorage.setItem(mode + "Blocks", blocksBroken.toString())
			if (!newBest) {
				newBest = true
			}
		}
		block.remove()
		//floor(block.x / rectSize.x), floor((block.y-topMarginSpace ) / rectSize.y), board[floor((block.y-topMarginSpace )/ rectSize.y)][floor(block.x / rectSize.x)], 
		blockExposion(block)
		if (checkEmpty(board, [0, "split"]) && options.autoSkip) {
			skip()
		}
	} else {
		gameOn = false
		alert("error! use find command to see where this came from.")
	}
}

function ballpowerupCollision(powerup, ball) {
	let powerupTag = board[floor((powerup.y - topMarginSpace) / rectSize.y)][floor(powerup.x / rectSize.x)]
	if (powerupTag === "ball") {
		board[floor((powerup.y - topMarginSpace) / rectSize.y)][floor(powerup.x / rectSize.x)] = 0
		currentEffects.double != 0 ? ballNumProxy += 2 : ballNumProxy++
		ballpowerupExplosion(floor(powerup.x / rectSize.x), floor((powerup.y - topMarginSpace) / rectSize.y), "ball")
		powerup.remove()
		if (checkEmpty(board, [0, "split"]) && options.autoSkip) {
			skip()
		}
	} else if (powerupTag === "split") {
		powerup.img = splitPowerupBigImage
		setTimeout(turnSplitBack, 50, powerup)
		ball.direction = random(-170, -10)
		if (!xyContains(posToSetZero, { x: floor(powerup.x / rectSize.x), y: floor((powerup.y - topMarginSpace) / rectSize.y) })) {
			posToSetZero.push({ x: floor(powerup.x / rectSize.x), y: floor((powerup.y - topMarginSpace) / rectSize.y) })
		}
		powerupsToKill[powerupsToKill.length] = powerup
		if (checkEmpty(board, [0, "split"]) && options.autoSkip) {
			skip()
		}
	} else if (powerupTag === "double" || powerupTag === "power" || powerupTag === "ghost") {
		board[floor((powerup.y - topMarginSpace) / rectSize.y)][floor(powerup.x / rectSize.x)] = 0
		currentEffects[powerupTag] += powerupRoundEffectiveness[powerupTag]
		if (powerupTag === "power") {
			for (let ball of balls) {
				ball.color = color(...poweredBallColor)
			}
		}
		if (effectsDrawQueue.indexOf(powerupTag) === -1) {
			effectsDrawQueue.push(powerupTag)
		}
		ballpowerupExplosion(floor(powerup.x / rectSize.x), floor((powerup.y - topMarginSpace) / rectSize.y), powerupTag)
		powerup.remove()
		if (checkEmpty(board, [0, "split"]) && options.autoSkip) {
			skip()
		}
	}
}

// control

function mouseMoved() {
	if (phase[0] === "game" && !phase[1] && !isFiring && mouseY > 100 && !options.pause) {
		updateMousePos()
	}
}

function mousePressed(event) {
	if (event.button === 0){
		if (((mouseX - ballCenterPos.x) ** 2 + (mouseY - ballCenterPos.y) ** 2) > (ballDiameter / 2) ** 2 &&
			!ballsInAir &&
			mouseY > 100 &&
			phase[0] === "game" &&
			!phase[1] &&
			!options.pause) {
			shootBalls()
		}
		if (phase[0] === "game" && phase[1] === "game over screen" && gameOverHomeButton.mouse.hovering()) {
			phase = ["menu"]
			menuCalls()
			switchVisibility(false)
			gameOverDropdown.visible = false
			gameOverHomeButton.visible = false
			gameOverPlayAgainButton.visible = false
			gameOverDropdown.x = rectSize.x * 6
			gameOverDropdown.y = rectSize.y * 5 + topMarginSpace
			switchPhase()
		}
		if (phase[0] === "game" && phase[1] === "game over screen" && gameOverPlayAgainButton.mouse.hovering()) {
			phase = ["game"]
			resetGame()
			gameOverDropdown.visible = false
			gameOverHomeButton.visible = false
			gameOverPlayAgainButton.visible = false
			gameOverDropdown.x = rectSize.x * 6
			gameOverDropdown.y = rectSize.y * 5 + topMarginSpace
			switchPhase()
		}
		if (phase[0] === "menu" && !phase[1]){
			if (playButton.mouse.hovering()) {
				phase = ["game"]
				switchVisibility(true)
				resetGame()
				for (let demoSpriteGroup of demoSpriteGroups) {
					demoSpriteGroup.removeAll()
				}
				demoSpriteGroups = []
				switchPhase()
				if (!localStorage.getItem("seenTutorial")) {
					showTutorial()
					//localStorage.setItem("seenTutorial", "true")
				}
			}
			if (infoButton.mouse.hovering()) {
				phase = ["menu", "info"]
			}
			if (modeDisplay.mouse.hovering()){
				mode = modeRotation[(modeRotation.indexOf(mode) + 1) % 3]
				modeDisplay.text = "Mode: " + mode
				switch (mode){
					case "Normal":
						modeDescription.textSize = 26
						break
					case "Hard":
						modeDescription.textSize = 16
						break
					case "Power":
						modeDescription.textSize = 18
						break
				}
				modeDescription.text = modeDescriptions[mode]
				scoreDisplay.text = localStorage.getItem(mode) ? "Highscore: " + localStorage.getItem(mode) : "Highscore: None :P"
				blocksBrokenDisplay.text = localStorage.getItem(mode + "Blocks") ? "Most blocks broken: " + localStorage.getItem(mode + "Blocks") : "Most blocks broken: Zero"
				localStorage.setItem("mode", mode)
			}
		}
		if (musicButton.mouse.hovering()) {
			options.music = !options.music
			musicButton.img = options.music ? musicButtonOnImage : musicButtonOffImage
			let tempOptions = JSON.parse(localStorage.getItem("options"))
			tempOptions.music = options.music
			localStorage.setItem("options", JSON.stringify(tempOptions))
		}
		if (soundButton.mouse.hovering()) {
			options.sound = !options.sound
			soundButton.img = options.sound ? soundButtonOnImage : soundButtonOffImage
			let tempOptions = JSON.parse(localStorage.getItem("options"))
			tempOptions.sound = options.sound
			localStorage.setItem("options", JSON.stringify(tempOptions))
		}
		if (autoSkipButton.mouse.hovering()) {
			options.autoSkip = !options.autoSkip
			autoSkipButton.img = options.autoSkip ? autoSkipButtonImage : noAutoSkipButtonImage
			if (phase[0] === "game" && !phase[1] && checkEmpty(board, [0, "split"]) && options.autoSkip) {
				skip()
			}
			let tempOptions = JSON.parse(localStorage.getItem("options"))
			tempOptions.autoSkip = options.autoSkip
			localStorage.setItem("options", JSON.stringify(tempOptions))
		}
		if (tutorialButton.mouse.hovering()) {
			showTutorial()
		}
		if (phase[0] === "game" && !phase[1] && pauseButton.mouse.hovering()) {
			pauseButtonCalls()
		}
	}
}

function keyPressed() {
	if (key === "f") {
		document.documentElement.requestFullscreen()
	} else if (key === "2") {

		gameOverDropdown.visible = false
		gameOverHomeButton.visible = false

	}
	if (key === "p" && phase[0] === "game" && !phase[1]) {
		pauseButtonCalls()
	}
	if (phase[0] === "game" && !phase[1] && !options.pause) {
		if (key === "x") {
			skip()
		}
		if (keyCode === 32 && ballsInAir && !isFiring){
			for (let ball of balls) {
				ball.addSpeed(2)
			}
		}
		if (keyCode === 13 && !ballsInAir) { // enter
			shootBalls()
		}
	}
	// console.log("key", key)
	// console.log("keyCode", keyCode)
}

let ballPowerupAnimation, ghostPowerupAnimation,
splitPowerupBigImage, splitPowerupImage,
powerPowerupImage, doublePowerupImage, homeButtonImage,
homeButtonHighlightedImage, restartButtonImage, restartButtonHighlightedImage, playButtonImage,
musicButtonOnImage, musicButtonOffImage,
soundButtonOnImage, soundButtonOffImage,
pauseButtonImage, resumeButtonImage, autoskipButtonImage,
noAutoskipButtonImage, oswald // resources

function preload() {
	//powerup graphics
	ballPowerupAnimation = loadAnimation("assets/powerups/ball powerup.png", { frameSize: [70, 70], frames: 11 })
	ballPowerupAnimation.frameDelay = 6
	ghostPowerupAnimation = loadAnimation("assets/powerups/ghost powerup.png", { frameSize: [500, 500], frames: 14 })
	ghostPowerupAnimation.frameDelay = 5
	splitPowerupBigImage = loadImage("assets/powerups/split powerup big.png")
	splitPowerupImage = loadImage("assets/powerups/split powerup.png")
	powerPowerupImage = loadImage("assets/powerups/power powerup.png")
	doublePowerupImage = loadImage("assets/powerups/double powerup.png")
	// button graphics
	homeButtonImage = loadImage("assets/buttons/home button.png")
	homeButtonHighlightedImage = loadImage("assets/buttons/home button highlighted.png")
	infoButtonImage = loadImage("assets/buttons/info button.png")
	infoButtonHighlightedImage = loadImage("assets/buttons/info button highlighted.png")
	leaderboardsButtonImage = loadImage("assets/buttons/leaderboards.png")
	leaderboardsButtonHighlightedImage = loadImage("assets/buttons/leaderboards highlighted.png")
	restartButtonImage = loadImage("assets/buttons/restart button.png")
	restartButtonHighlightedImage = loadImage("assets/buttons/restart button highlighted.png")
	playButtonImage = loadImage("assets/buttons/play button.png")
	playButtonHighlightedImage = loadImage("assets/buttons/play button highlighted.png")
	musicButtonOnImage = loadImage("assets/buttons/music on.png")
	musicButtonOffImage = loadImage("assets/buttons/music off.png")
	soundButtonOnImage = loadImage("assets/buttons/sound on.png")
	soundButtonOffImage = loadImage("assets/buttons/sound off.png")
	pauseButtonImage = loadImage("assets/buttons/pause.png")
	resumeButtonImage = loadImage("assets/buttons/resume.png")
	autoSkipButtonImage = loadImage("assets/buttons/auto skip.png")
	noAutoSkipButtonImage = loadImage("assets/buttons/no auto skip.png")
	tutorialButtonImage = loadImage("assets/buttons/tutorial.png")
	oswald = loadFont("assets/oswald.ttf")
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	noStroke()
	angleMode(DEGREES)
	if (localStorage.getItem("options")){
		options = JSON.parse(localStorage.getItem("options"))
	} else {
		localStorage.setItem("options", JSON.stringify(options))
	}
	randomNum = random()
	demoSpriteGroups = []

	// initializing sprites
	balls = new Group();
	walls = new Group();
	blocks = new Group();
	powerups = new Group();
	upWall = new Sprite(windowWidth / 2, 5 + topMarginSpace, windowWidth, 10, "static")
	upWall.color = color(0, 0, 0)
	leftWall = new Sprite(-5, windowHeight / 2, 10, windowHeight + 40, "static")
	rightWall = new Sprite(windowWidth + 5, windowHeight / 2, 10, windowHeight + 40, "static")
	// top of down wall is at 679
	downWall = new Sprite(windowWidth / 2, windowHeight - 50, windowWidth, 10, "static")
	downWall.color = color(0, 0, 0)

	walls.add(upWall, rightWall, leftWall)

	// game over stuff
	gameOverDropdown = new Sprite(rectSize.x * 6, rectSize.y * 5 + topMarginSpace, rectSize.x * 5 - 20, rectSize.y * 7 - 20, "none")
	gameOverDropdown.storke = "black"
	gameOverDropdown.strokeWeight = 0
	gameOverDropdown.color = color(...gameOverDropDownColor)
	gameOverDropdown.visible = false
	gameOverHomeButton = new Sprite(rectSize.x * 6 - 190, rectSize.y * 5 + topMarginSpace, rectSize.x, rectSize.x, "kinematic")
	gameOverHomeButton.overlap(balls)
	gameOverHomeButton.img = homeButtonImage
	gameOverHomeButton.visible = false
	gameOverHomeButton.layer = 1
	gameOverPlayAgainButton = new Sprite(rectSize.x * 6 + 190, rectSize.y * 5 + topMarginSpace, rectSize.x, rectSize.x, "kinematic")
	gameOverPlayAgainButton.overlap(balls)
	gameOverHomeButton.img = restartButtonImage
	gameOverPlayAgainButton.visible = false
	gameOverPlayAgainButton.layer = 1

	// options buttons
	pauseButton = new Sprite(windowWidth - 295 + 20, 50, 40, 40, "kinematic")
	pauseButton.img = pauseButtonImage
	tutorialButton = new Sprite(windowWidth - 295 + 58 * 1 + 20, 50, 40, 40, "kinematic")
	tutorialButton.img = tutorialButtonImage
	autoSkipButton = new Sprite(windowWidth - 295 + 58 * 2 + 20, 50, 40, 40, "kinematic")
	if (JSON.parse(localStorage.getItem("options")).autoSkip === false){
		autoSkipButton.img = noAutoSkipButtonImage
	} else {
		autoSkipButton.img = autoSkipButtonImage
	}
	musicButton = new Sprite(windowWidth - 295 + 58 * 3 + 20, 50, 40, 40, "kinematic")
	if (JSON.parse(localStorage.getItem("options")).music === true){
		musicButton.img = musicButtonOnImage
	} else {
		musicButton.img = musicButtonOffImage
	}
	soundButton = new Sprite(windowWidth - 295 + 58 * 4 + 20, 50, 40, 40, "kinematic")
	if (JSON.parse(localStorage.getItem("options")).sound === true){
		soundButton.img = soundButtonOnImage
	} else {
		soundButton.img = soundButtonOffImage
	}
	
	// collision logic

	balls.collide(walls)
	balls.overlap(balls)
	balls.collide(downWall, ballDownWallCollision)
	blocks.collide(balls, ballBlockCollision)
	menuCalls()
	switchVisibility(false)
	mode = localStorage.getItem("mode") ? localStorage.getItem("mode") : "Normal"
}

//get blocks, the walls, the bottom as collision points

function draw() {
	background(180)
	let frameModulus = phase[0] === "menu" && !kb.pressing("space") ? 32 : 2
	for (let particleObj of allParticles){
		if (particleObj.n >= 0){
			if ((frameCount - particleObj.start) % frameModulus === 1 && !options.pause){
				for (let particle of particleObj.group) {
					particle.vel.y = particle.vel.y + 1
					particle.w = particle.w - particle.w / 30
					particle.h = particle.h - particle.h / 30
				}
				particleObj.n --
			}
		} else {
			particleObj.group.removeAll()
		}
	}
	if (phase[0] === "game") {
		if (phase[0] === "game" && !phase[1] && !isFiring) {
			if (kb.pressing("ArrowLeft")) {
				mouseAngle++
				if (mouseAngle > 180) {
					mouseAngle = -180
				}
				if (mouseAngle < 0 && mouseAngle > -(90 + mouseAngleCutoff)) {
					mouseAngle = -(90 + mouseAngleCutoff)
				}
			}
			if (kb.pressing("ArrowRight")) {
				mouseAngle--
				if (mouseAngle < -180) {
					mouseAngle = 180
				}
				if (mouseAngle >= 0 && mouseAngle < 90 + mouseAngleCutoff) {
					mouseAngle = 90 + mouseAngleCutoff
				}
			}
		}
		if (isFiring && ballsShotFrame != 0 && (frameCount - ballsShotFrame) % framesPerBallShot === 1 && !(ballsToShoot.every(x => x === null) || ballsToShoot.length === 0) && !options.pause){
			let i = 0
			while (ballsToShoot[i] === null){
				i ++
			}
			balls[ballsToShoot[i]].addSpeed(ballSpeed, -mouseAngle + 90)
			ballsToShoot[i] = null
			if (ballsToShoot.every(x => x === null) || ballsToShoot.length === 0){
				isFiring = false
			}
		}
		fill(0, 0, 0)
		textFont(oswald, 30)
		text("Score: " + (roundNum - 1).toString(), 20, 65)
		text("Blocks broken: " + blocksBroken.toString(), 160, 65)
		let drawPos = 410
		for (let i in effectsDrawQueue) {
			fill(...powerupBannerColor)
			noStroke()
			switch (effectsDrawQueue[i]) {
				case "power":
					rect(drawPos, 20, 240, 60, 10)
					break
				case "ghost":
					rect(drawPos, 20, 250, 60, 10)
					break
				case "double":
					rect(drawPos, 20, 185, 60, 10)
					break
			}
			fill(0, 0, 0)
			textFont(oswald, 20)
			if (parseInt(currentEffects[effectsDrawQueue[i]]) > 99){
				switch (effectsDrawQueue[i]) {
					case "power":
					case "ghost":
						text("Rounds left: >99", drawPos + 85, 66)
						break
					case "double":
						text("Rounds left: >99", drawPos + 50, 66)
						break
				}
			} else {
				switch (effectsDrawQueue[i]) {
					case "power":
					case "ghost":
						text("Rounds left: " + currentEffects[effectsDrawQueue[i]], drawPos + 85, 66)
						break
					case "double":
						text("Rounds left: " + currentEffects[effectsDrawQueue[i]], drawPos + 56, 66)
						break
				}
			}
			

			textFont(oswald, 15)
			switch (effectsDrawQueue[i]) {
				case "power":
					image(powerPowerupImage, drawPos + 15, 35, 30, 30)
					text("Double damage to all blocks", drawPos + 60, 40)
					fill(...powerupBannerColor)
					drawPos = drawPos + 260
					break
				case "double":
					image(doublePowerupImage, drawPos + 15, 35, 30, 30)
					text("Double ball gain", drawPos + 66, 40)
					fill(...powerupBannerColor)
					drawPos = drawPos + 200
					break
				case "ghost":
					animation(ghostPowerupAnimation, drawPos + 32, 50, 0, 2 / 3, 2 / 3)
					text("Hold left click for ghost mode", drawPos + 60, 40)
					fill(...powerupBannerColor)
					drawPos = drawPos + 270
					break
			}

		}
		if (!options.pause && phase[0] === "game" && !phase[1]){
			if (mouseIsPressed && currentEffects.ghost != 0 && mouseY > 100) {
				blocks.overlap(balls)
				for (let ball of balls) {
					ball.color = color(76, 249, 226)
				}
			} else {
				blocks.collide(balls, ballBlockCollision)
				if (currentEffects.power != 0) {
					for (let ball of balls) {
						ball.color = color(...poweredBallColor)
					}
				} else {
					for (let ball of balls) {
						ball.color = color(...ballColor)
					}
				}
			}
		}
		walls.draw()
		blocks.draw()
		powerups.draw()
		downWall.draw()
		if (!ballsInAir) {
			stroke(0)
			strokeWeight(2)
			line(ballCenterPos.x, ballCenterPos.y, 200 * cos(-mouseAngle + 90) + ballCenterPos.x, 200 * sin(-mouseAngle + 90) + ballCenterPos.y)
			noStroke()
			if (currentEffects.power != 0) {
				fill(...poweredBallColor)
			} else {
				fill(...ballColor)
			}
			textSize(17)
			text("x" + ballNum.toString(), ballCenterPos.x - 7 * ballNum.toString().length, ballCenterPos.y + 37)
		}
		balls.draw()
		if (phase[1] === "game over screen") {
			fill(0, 0, 0, 50)
			rect(0, 100, windowWidth, windowHeight)
			gameOverDropdown.draw()
			gameOverHomeButton.draw()
			gameOverPlayAgainButton.draw()
			strokeWeight(1)
			fill(0, 0, 0)
			stroke(3)
			textFont(oswald, 50)
			text("GAME OVER", gameOverDropdown.x - 117, gameOverDropdown.y - 125)
			textFont(oswald, 30)
			text("Mode: " + mode, gameOverDropdown.x - 80, gameOverDropdown.y - 75)
			text("Score: " + (roundNum - 1).toString(), gameOverDropdown.x - 45, gameOverDropdown.y - 15)
			textFont(oswald, 22)
			text('Highscore: ' + (localStorage.getItem(mode) ? localStorage.getItem(mode) : 'None'), gameOverDropdown.x - 57 - (localStorage.getItem(mode) ? localStorage.getItem(mode) : 'None :(').length * 3, gameOverDropdown.y + 15)
			textFont(oswald, 30)
			text("Blocks broken: " + blocksBroken.toString(), gameOverDropdown.x - 95, gameOverDropdown.y + 70)
			textFont(oswald, 22)
			text('Most blocks broken: ' + (localStorage.getItem(mode + 'Blocks') ? localStorage.getItem(mode + 'Blocks') : 'None :('), gameOverDropdown.x - 102 - (localStorage.getItem(mode + 'Blocks') ? localStorage.getItem(mode + 'Blocks') : 'None').length * 3, gameOverDropdown.y + 102)
			if (newBest) {
				text("New best!", gameOverDropdown.x - 40, gameOverDropdown.y + 150)
			} else {
				if (randomNum < 0.5) {
					text("Better luck next time...", gameOverDropdown.x - 97, gameOverDropdown.y + 150)
				} else {
					text("Maybe you should try harder ;)", gameOverDropdown.x - 127, gameOverDropdown.y + 150)
				}
			}
			if (gameOverHomeButton.mouse.hovering()) {
				gameOverHomeButton.img = homeButtonHighlightedImage
			} else {
				gameOverHomeButton.img = homeButtonImage
			}
			if (gameOverPlayAgainButton.mouse.hovering()) {
				gameOverPlayAgainButton.img = restartButtonHighlightedImage
			} else {
				gameOverPlayAgainButton.img = restartButtonImage
			}
		}
		if (options.pause) {
			fill(0, 0, 0, 30)
			rect(0, 100, windowWidth, windowHeight)
			fill(255, 255, 255)
			textFont(oswald, 40);
			text("Paused", windowWidth / 2 - 60, windowHeight / 2 + topMarginSpace - 50)
			world.autoStep = false
		} else {
			world.autoStep = true
		}
	} else if (phase[0] === "menu") {
		if (kb.pressing("space")){
			world.step(1 / (5 * slowMultiplier))
		} else {
			world.step(1 / (60 * slowMultiplier))
		}
		if (demoBallsShotFrame != null && (frameCount - demoBallsShotFrame) % (kb.pressing("space") ? framesPerBallShot : framesPerBallShot*10) === 1){
			demoBalls[demoBallsToShoot[0]].addSpeed(ballSpeed, -20)
			demoBallsToShoot.shift()
			if (demoBallsToShoot.length === 0){
				demoBallsShotFrame = null
			}
		}
		if (playButton.mouse.hovering()) {
			playButton.img = playButtonHighlightedImage
		} else {
			playButton.img = playButtonImage
		}
		if (infoButton.mouse.hovering()){
			infoButton.img = infoButtonHighlightedImage
		} else {
			infoButton.img = infoButtonImage
		}
		if (leaderboardsButton.mouse.hovering()) {
			leaderboardsButton.img = leaderboardsButtonHighlightedImage
		} else {
			leaderboardsButton.img = leaderboardsButtonImage
		}
		if (modeDisplay.mouse.hovering()){
			modeDisplay.color = color(0, 118, 234)
		} else {
			modeDisplay.color = color(0, 102, 204)
		}
		textFont(oswald, 100);
		fill(0, 0, 0)
		text("Break those", 479, 100)
		text("Blocks!", 580, 200)

		// strokeWeight(3)
		// stroke(3)
		// line(windowWidth/2, 0, windowWidth/2, windowHeight)
		rect(0, 235, windowWidth, 10)
		rect(0, windowHeight - 55, windowWidth, 10)
		noStroke()
		scoreDisplay.draw()
		blocksBrokenDisplay.draw()
		modeDisplay.draw()
		// switch (mode){
		// 	case "Normal":
		// 		textFont(oswald, 26)
		// 		break
		// 	case "Hard":
		// 		textFont(oswald, 16)
		// 		break
		// 	case "Power":
		// 		textFont(oswald, 18)
		// 		break
		// }
		// textFont(oswald, 16)
		modeDescription.draw()
	}
}