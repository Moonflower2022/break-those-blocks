// info:
// on board nested array 0 is nothing, blocks are numbers and power ups are strings
// blocks space x is from 0 to 1440 y is from 10 to 663
// for board coords, board[y][x] maps to x: (x+1/2)*rectSize.x, y: (y+1/2)*rectSize.y + topMarginSpace

// bugs

//TODO

// add hover explainations for buttons in top right!!!!
// why rotate not work
// tutorial
// and make options buttons highlight when hovered
// maybe revamp icons and color palette for blocks + buttons
// colors hard/annoying to see?
// maybe make the demo settings randomize themselves
// why lag T_T

// add sound for...
// going into info screen
// ball powerup activation when double powerup
// ball bouncing with wall
// skipping round instead of passing normally
// using ghost mode

// ANIMATION:
// -> collecting balls (balls that hit the floor 
// stay on the floor and when round over all them converge onto shooting point)

// misc
// -> achievements
// -> skins for the balls?

if (!localStorage.getItem("timesVisited")) {
	localStorage.setItem("timesVisited", "1")
} else {
	localStorage.setItem("timesVisited", (parseInt(localStorage.getItem("timesVisited")) + 1).toString())
}

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
const modeTextSize = { Normal: 18, Hard: 16, Power: 18 }
const modeDescriptions = { Normal: "Presents a well-rounded challenge for players of all levels.", Hard: "I actually don't expect you to get past 30 score on this one :)", Power: "Extra powerups, extra health on blocks. Have fun!" }
const framesPerBallShot = 5
const rowNum = 10
const colNum = 12
const rectSize = {
	x: gameWindowWidth / colNum,
	y: gameWindowHeight / rowNum
}
const powerupSpawnRatesNormal = {
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
const demoDescription1 = `
xxxxxxxxxxxx
xxxxxxxxxxxx
xxxxxxxxxxxx
xxxxxxxxmxxx
txlxipsxdxbx
xxxxxxxxxxxx
xxxxxxxxxxxx
xx7xx22xx5xx
xxx3x6xxxx8x
xxxxxxxxxxxx
`;
const demoDescription2 = `
xxxxxxxxxxxx
xxxxxxxxxxxx
xxxxxxxxxxxx
xxxxxxxxmxxx
txlxipsxdxbx
xxxxxxxxxxxx
xxxxxxxxxxxx
xx3xxx5xxxxx
4xxx6xxxxx15
xxxxxxxxxxxx
`;
const demoDescription3 = `
xxxxxxxxxxxx
xxxxxxxxxxxx
xxxxxxxxxxxx
xxxxxxxxmxxx
txlxipsxdxbx
xxxxxxxxxxxx
xxxxxxxxxxxx
9xx5xxxxx3x2
xxx7xxxx4xx1
xxxxxxxxxxxx
`;
const demoDescriptionCycle = [demoDescription1, demoDescription2, demoDescription3]
const mouseAngleCutoff = 5
const slowMultiplier = 16
const exceptionBlocks = [0, "x", "p", "t", "i", "l", "m", "b", "s", "d"]

var balls, walls, blocks, testingWalls,
	leftWall, rightWall, upWall,
	downWall, powerups,
	playButton, infoButton, leaderboardsButton, statsButton,
	scoreDisplay, blocksBrokenDisplay, modeDisplay, modeDescription,
	gameOverDropdown, demoSpriteGroups, demoBalls,
	demoBlocks, demoBoard, demoTopWall, randomDemoAngle, musicButton,
	soundButton, pauseButton, tutorialButton,
	autoSkipButton, closeButton, // sprites + sprite groups including some signs and buttons
	mouseAngle, board, firstX, randomNum, demoBallsShotFrame, demoBallsToShoot;// game logic


// phases can be ["menu", "options"] ["game"] ["game", "options"] ["game", "game over screen"]
let phase = localStorage.getItem("timesVisited") === "1" ? ["menu", "info"] : ["menu"]
let difficulty = "easy"
let options = {
	sound: true,
	music: true,
	autoSkip: false,
	pause: false
}
let mode;
let demoDescriptionCycleNum = 0
let allParticles = []
let seenStuck = false
let userInteracted = false
let pausedIds = []
let pausedSounds = []
let tempSettings = {sound:null, music:null}

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
	mouseMoved()
}

function genObjsNormal() {
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
	for (let powerupType in powerupSpawnRatesNormal) {
		if (random() < powerupSpawnRatesNormal[powerupType]) {
			let insertPos = random(posOptions)
			board[0][insertPos] = powerupType
			posOptions.splice(posOptions.indexOf(insertPos), 1)
		}
	}
}

function genObjsHard() {
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
		board[0][index] = roundNum * 2
	}
	for (let powerupType in powerupSpawnRatesNormal) {
		if (random() < powerupSpawnRatesNormal[powerupType] * 2) {
			let insertPos = random(posOptions)
			board[0][insertPos] = powerupType
			posOptions.splice(posOptions.indexOf(insertPos), 1)
		}
	}
}

function genObjsPower() {
	let posOptions = []
	for (let i = 0; i < colNum; i++) {
		posOptions.push(i)
	}
	let insertPos = random(posOptions)
	board[0][insertPos] = "ball"
	posOptions.splice(posOptions.indexOf(insertPos), 1)
	let powerupRemoveNum;
	if (random() < 0.7) {
		powerupRemoveNum = 1
	} else {
		powerupRemoveNum = 2
	}
	let powerupsListCopy = []
	for (let powerupType in powerupSpawnRatesNormal) {
		if (powerupType != "ball") {
			powerupsListCopy.push(powerupType)
		}
	}
	for (let i = 0; i < powerupRemoveNum; i++) {
		powerupsListCopy.splice(powerupsListCopy.indexOf(random(powerupsListCopy)), 1)
	}
	for (let powerupType of powerupsListCopy) {
		let insertPos = random(posOptions)
		board[0][insertPos] = powerupType
		posOptions.splice(posOptions.indexOf(insertPos), 1)
	}
	let blockRemoveNum;
	if (isBetween(roundNum, 0, 33)) {
		blockRemoveNum = floor(random(3, 4 + 1))
	} else if (isBetween(roundNum, 33, 66)) {
		blockRemoveNum = floor(random(2, 3 + 1))
	} else if (isBetween(roundNum, 66, 100)) {
		blockRemoveNum = floor(random(1, 2 + 1))
	} else if (roundNum >= 100) {
		blockRemoveNum = floor(random(0, 1 + 1))
	} else {
		alert("error! use find command to see where this came from.")
	}
	for (let i = 0; i < blockRemoveNum; i++) {
		posOptions.splice(posOptions.indexOf(random(posOptions)), 1)
	}
	// for (let i = 0; i < blockGenNum; i++) {
	// 	let blockPos = random(posOptions)
	// 	blockGenPositions.push(blockPos)
	// 	posOptions.splice(posOptions.indexOf(blockPos), 1)
	// }
	for (let index of posOptions) {
		board[0][index] = roundNum * 2
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

function checkGameOver() {
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
		if (newBest){
			setTimeout(function(){
				if (options.sound && phase[0] === "game" && phase[1] === "game over screen") newbest.play()
			}, 2300)
			setTimeout(function(){
				if (options.sound && phase[0] === "game" && phase[1] === "game over screen") wow.play()
			}, 3000)
		}
	}
	return gameOver
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
	if (parseInt(localStorage.getItem(mode + "Score")) < roundNum - 1 || !localStorage.getItem(mode + "Score")) {
		localStorage.setItem(mode + "Score", (roundNum - 1).toString())
		if (!newBest) {
			newBest = true
		}
	}
	if (parseInt(localStorage.getItem("Score")) < roundNum - 1 || !localStorage.getItem("Score")) {
		localStorage.setItem("Score", (roundNum - 1).toString())
	}
	if (!localStorage.getItem(mode + "Survived")) {
		localStorage.setItem(mode + "Survived", 1)
	} else {
		localStorage.setItem(mode + "Survived", (parseInt(localStorage.getItem(mode + "Survived")) + 1).toString())
	}
	if (!localStorage.getItem("Survived")) {
		localStorage.setItem("Survived", 1)
	} else {
		localStorage.setItem("Survived", (parseInt(localStorage.getItem("Survived")) + 1).toString())
	}
	firstX = null;
	firstBallLanded = false;
	ballCenterPos.x = ballXPos
	if (seenStuck){
		seenStuck = false
		if (!localStorage.getItem("stuck")){
			localStorage.setItem("stuck", "1")
		} else if (localStorage.getItem("stuck") === "1"){
			localStorage.setItem("stuck", "2")
		}
	}

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
		if (!localStorage.getItem(mode + "Picked")) {
			localStorage.setItem(mode + "Picked", ballNumProxy - ballNum)
		} else {
			localStorage.setItem(mode + "Picked", (parseInt(localStorage.getItem(mode + "Picked")) + ballNumProxy - ballNum).toString())
		}
		if (!localStorage.getItem("Picked")) {
			localStorage.setItem("Picked", ballNumProxy - ballNum)
		} else {
			localStorage.setItem("Picked", (parseInt(localStorage.getItem("Picked")) + ballNumProxy - ballNum).toString())
		}
		ballNum = ballNumProxy
	}
	updateBalls(balls, ballNum, ballCenterPos.x)
	switch (mode) {
		case "Normal":
			genObjsNormal()
			break
		case "Hard":
			genObjsHard()
			break
		case "Power":
			genObjsPower()
			break
	}
	updateBlocks()
	updatePowerups()
	if (options.sound && roundNum != 1){
		checkGameOver() ? gameover.play() : roundPassed.play()
	} else {
		checkGameOver()
	}
	shiftBoard()
	mouseMoved()
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
	particleGroup.layer = 0
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

	for (let group of [balls, downWall, blocks, powerups, gameOverHomeButton, gameOverPlayAgainButton, demoBalls, demoBlocks, playButton, infoButton, leaderboardsButton, scoreDisplay, blocksBrokenDisplay, modeDisplay, modeDescription, closeButton]) {
		particleGroup.overlap(group)
	}
	particleGroup.collide(walls)
	allParticles.push({ group: particleGroup, n: 30, start: frameCount })
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
			//sprite.color = color(sprite.color._array[0]*255 - 16, sprite.color._array[1]*255 - 16, sprite.color._array[2]*255 - 16)
		}
		setTimeout(slowlySelfDestruct, 100 * timeMultiplier / 3, group, n + 1, timeMultiplier, originPhase)
	} else {
		group.removeAll()
	}
}

function showTutorial() {

}

function shootBalls() {
	ballsInAir = true
	isFiring = true
	ballsShotFrame = frameCount
	for (let i = 0; i < balls.length; i++) {
		ballsToShoot[i] = i
	}
}

function skip() {
	balls.remove()
	roundIncrement(colNum / 2 * rectSize.x)
	ballsInAir = false
	isFiring = false
}

function pauseButtonCalls() {
	options.pause = !options.pause
	pauseButton.img = options.pause ? resumeButtonImage : pauseButtonImage
	if (options.pause){
		for (let sound of [ballHit, powerBallHit, ballSpeedup, shootBall, amogus, 
			boop, wow, gameStart, gameover, newbest, roundPassed, ball, 
			double, ghost, power, split, buttonClick, modeChange, stats, cottage]){
			if (sound.playing()){
				sound.pause()
				pausedSounds.push(sound)
			}
		}
	} else {
		for (let soundId of pausedIds){
			for (let sound of pausedSounds){
				try {
					sound.play(soundId)
				} catch (error){

				}
			}
		}
		pausedSounds = []
	}
	mouseMoved()
}

function switchPhase() {
	for (let particleObj of allParticles) {
		particleObj.group.remove()
	}
	allParticles = []
}

function resetDemoBlocks() {
	if (phase[0] === "menu") {
		demoDescriptionCycleNum = (demoDescriptionCycleNum + 1) % 3
		localStorage.setItem("menucycle", demoDescriptionCycleNum.toString())
		demoBoard = generateBoardFromDescription(demoDescriptionCycle[demoDescriptionCycleNum], x => x)
		textFont(oswald, 18)
		for (let x = 0; x < colNum; x++) {
			for (let y = 0; y < rowNum; y++) {
				if (parseInt(demoBoard[y][x]) && parseInt(demoBoard[y][x]) > 0) {
					let block = new Sprite(rectSize.x * (x + 1 / 2), rectSize.y * (y + 1 / 2) + topMarginSpace, rectSize.x, rectSize.y, "kinematic")
					if (parseInt(demoBoard[y][x]) / 10 === 1) {
						block.color = color(...blockColors[0])
					} else {
						for (let i = 0; i < blockColors.length; i++) {
							if (isBetween(parseInt(demoBoard[y][x]) / 10, i / blockColors.length, (i + 1) / blockColors.length)) {
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
	demoTopWall = new Sprite(windowWidth / 2, 240, windowWidth, 10, "static")
	demoTopWall.color = color(0, 0, 0)
	demoWalls.add(demoTopWall)
	demoBoard = generateBoardFromDescription(demoDescriptionCycle[demoDescriptionCycleNum], x => x)

	demoBalls.collide(walls)
	demoBalls.collide(demoTopWall)
	demoBalls.overlap(demoBalls)
	demoBalls.overlap(gameOverHomeButton)
	demoBalls.overlap(gameOverPlayAgainButton)
	demoBlocks.collide(demoBalls, ballBlockCollisionDemo)
	updateBalls(demoBalls, 11, colNum / 2 * rectSize.x)
	for (let x = 0; x < colNum; x++) {
		for (let y = 0; y < rowNum; y++) {
			if (parseInt(demoBoard[y][x]) && parseInt(demoBoard[y][x]) > 0) {
				textFont(oswald, 18)
				let block = new Sprite(rectSize.x * (x + 1 / 2), rectSize.y * (y + 1 / 2) + topMarginSpace, rectSize.x, rectSize.y, "kinematic")
				if (parseInt(demoBoard[y][x]) / 10 === 1) {
					block.color = color(...blockColors[0])
				} else {
					for (let i = 0; i < blockColors.length; i++) {
						if (isBetween(parseInt(demoBoard[y][x]) / 10, i / blockColors.length, (i + 1) / blockColors.length)) {
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
				infoButton = new Sprite(rectSize.x * (x + 0.4), rectSize.y * (y + 1) + topMarginSpace, rectSize.x, rectSize.y * 2, "kinematic")
				infoButton.img = infoButtonImage
				demoButtons.add(infoButton)
			} else if (demoBoard[y][x] === "l") {
				leaderboardsButton = new Sprite(rectSize.x * (x + 0.8), rectSize.y * (y + 1) + topMarginSpace, rectSize.x, rectSize.y * 2, "kinematic")
				leaderboardsButton.img = leaderboardsButtonImage
				demoButtons.add(leaderboardsButton)
			} else if (demoBoard[y][x] === "t") {
				statsButton = new Sprite(rectSize.x * (x + 1.2), rectSize.y * (y + 1) + topMarginSpace, rectSize.x, rectSize.y * 2, "kinematic")
				statsButton.img = statsButtonImage
				demoDisplays.add(statsButton)
			} else if (demoBoard[y][x] === "s") {
				scoreDisplay = new Sprite(rectSize.x * (x + 1.625), rectSize.y * (y + 1.25) + topMarginSpace, rectSize.x * 1.25, rectSize.y * 1.5, "kinematic")
				scoreDisplay.color = color(37, 139, 255)
				demoDisplays.add(scoreDisplay)
			} else if (demoBoard[y][x] === "b") {
				blocksBrokenDisplay = new Sprite(rectSize.x * (x + 0.875), rectSize.y * (y + 1.25) + topMarginSpace, rectSize.x * 1.25, rectSize.y * 1.5, "kinematic")
				blocksBrokenDisplay.color = color(68, 193, 255)
				demoDisplays.add(blocksBrokenDisplay)
			} else if (demoBoard[y][x] === "m") {
				textFont(oswald, 26)
				modeDisplay = new Sprite(rectSize.x * (x + 1.25), rectSize.y * (y + 1.25) + topMarginSpace, rectSize.x * 1.5, rectSize.y, "kinematic")
				modeDisplay.text = "Mode: " + mode
				modeDisplay.color = color(0, 102, 204)
				demoDisplays.add(modeDisplay)
			} else if (demoBoard[y][x] === "d") {
				textFont(oswald, modeTextSize[mode])
				modeDescription = new Sprite(rectSize.x * (x + 1.25), rectSize.y * (y + 1.75) + topMarginSpace, rectSize.x * 1.5, rectSize.y * 1.5, "kinematic")
				modeDescription.color = color(101, 155, 222)
				demoDisplays.add(modeDescription)
			}
			// ADD MODE BUTTON AND THE MODE SCORE DISPLAYERS 

		}
	}
	demoBallsShotFrame = frameCount
	demoBallsToShoot = []
	for (let i = 0; i < demoBalls.length; i++) {
		demoBallsToShoot[i] = i
	}
	//applySpeedToGroup(demoBalls, 7, -20, slowMultiplier)
	demoSpriteGroups.push(demoBalls, demoBlocks, demoWalls, demoButtons, demoDisplays)
	cottagecore.play('key')
	synthy.stop()
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
				if (board[y][x] / (mode === "Power" || mode === "Hard" ? roundNum * 2 : roundNum) === 1) {
					block.color = color(...blockColors[0])
				} else {
					for (let i = 0; i < blockColors.length; i++) {
						if (isBetween(board[y][x] / (mode === "Power" || mode === "Hard" ? roundNum * 2 : roundNum), i * 1 / blockColors.length, (i + 1) * 1 / blockColors.length)) {
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
	ballsToShoot = ballsToShoot.map(function (x) {
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
	if (demoBoard[floor((block.y - topMarginSpace) / rectSize.y)][floor(block.x / rectSize.x)] != "x"){
		demoBoard[floor((block.y - topMarginSpace) / rectSize.y)][floor(block.x / rectSize.x)] = (parseInt(demoBoard[floor((block.y - topMarginSpace) / rectSize.y)][floor(block.x / rectSize.x)]) - 1).toString()
		let blockNum = parseInt(demoBoard[floor((block.y - topMarginSpace) / rectSize.y)][floor(block.x / rectSize.x)])
		ballHit.play()
		if (blockNum > 0) {
			block.text = blockNum
			for (let i = 0; i < blockColors.length; i++) {
				if (isBetween(blockNum / 10, i * 1 / blockColors.length, (i + 1) * 1 / blockColors.length)) {
					block.color = color(...blockColors[blockColors.length - i - 1])
					break;
				}
			}
		} else if (blockNum <= 0) {
			demoBoard[floor((block.y - topMarginSpace) / rectSize.y)][floor(block.x / rectSize.x)] = "x"
			block.remove()
			blockExposion(block)
			if (checkEmpty(demoBoard, exceptionBlocks)) {
				setTimeout(resetDemoBlocks, 4000)
			}
		}
	}
}

function ballBlockCollision(block) {
	currentEffects.power != 0 ? board[floor((block.y - topMarginSpace) / rectSize.y)][floor(block.x / rectSize.x)] -= 2 : board[floor((block.y - topMarginSpace) / rectSize.y)][floor(block.x / rectSize.x)]--
	let blockNum = board[floor((block.y - topMarginSpace) / rectSize.y)][floor(block.x / rectSize.x)]
	let damageNum = currentEffects.power != 0 ? 2 : 1
	damageNum === 2 ? powerBallHit.play() : ballHit.play()

	if (blockNum >= 0) {
		if (!localStorage.getItem(mode + "Damage")) {
			localStorage.setItem(mode + "Damage", damageNum)
		} else {
			localStorage.setItem(mode + "Damage", (parseInt(localStorage.getItem(mode + "Damage")) + damageNum).toString())
		}
		if (!localStorage.getItem("Damage")) {
			localStorage.setItem("Damage", damageNum)
		} else {
			localStorage.setItem("Damage", (parseInt(localStorage.getItem("Damage")) + damageNum).toString())
		}
	} else if (blockNum < 0) {
		if (!localStorage.getItem(mode + "Damage")) {
			localStorage.setItem(mode + "Damage", 1)
		} else {
			localStorage.setItem(mode + "Damage", (parseInt(localStorage.getItem(mode + "Damage")) + 1).toString())
		}
		if (!localStorage.getItem("Damage")) {
			localStorage.setItem("Damage", 1)
		} else {
			localStorage.setItem("Damage", (parseInt(localStorage.getItem("Damage")) + 1).toString())
		}
	}
	if (blockNum > 0) {
		block.text = blockNum.toString()

		for (let i = 0; i < blockColors.length; i++) {
			if (isBetween(blockNum / (mode === "Power" || mode === "Hard" ? roundNum * 2 : roundNum), i * 1 / blockColors.length, (i + 1) * 1 / blockColors.length)) {
				block.color = color(...blockColors[blockColors.length - i - 1])
				break;
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
		if (parseInt(localStorage.getItem("Blocks")) < blocksBroken || !localStorage.getItem("Blocks")) {
			localStorage.setItem("Blocks", blocksBroken.toString())
		}
		if (!localStorage.getItem(mode + "TotalBlocks")) {
			localStorage.setItem(mode + "TotalBlocks", 1)
		} else {
			localStorage.setItem(mode + "TotalBlocks", (parseInt(localStorage.getItem(mode + "TotalBlocks")) + 1).toString())
		}
		if (!localStorage.getItem("TotalBlocks")) {
			localStorage.setItem("TotalBlocks", 1)
		} else {
			localStorage.setItem("TotalBlocks", (parseInt(localStorage.getItem("TotalBlocks")) + 1).toString())
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

function ballpowerupCollision(powerup, ballSprite) {
	let powerupTag = board[floor((powerup.y - topMarginSpace) / rectSize.y)][floor(powerup.x / rectSize.x)]
	if (powerupTag === "ball") {
		board[floor((powerup.y - topMarginSpace) / rectSize.y)][floor(powerup.x / rectSize.x)] = 0
		currentEffects.double != 0 ? ballNumProxy += 2 : ballNumProxy++
		ballpowerupExplosion(floor(powerup.x / rectSize.x), floor((powerup.y - topMarginSpace) / rectSize.y), "ball")
		powerup.remove()
		if (checkEmpty(board, [0, "split"]) && options.autoSkip) {
			skip()
		}
		ball.play()
		if (currentEffects.double != 0) setTimeout(function(){ball.play()}, 200)
	} else if (powerupTag === "split") {
		powerup.img = splitPowerupBigImage
		setTimeout(function (splitSprite) {
			splitSprite.img = splitPowerupImage
		}, 50, powerup)
		ballSprite.direction = random(-170, -10)
		if (!xyContains(posToSetZero, { x: floor(powerup.x / rectSize.x), y: floor((powerup.y - topMarginSpace) / rectSize.y) })) {
			posToSetZero.push({ x: floor(powerup.x / rectSize.x), y: floor((powerup.y - topMarginSpace) / rectSize.y) })
		}
		powerupsToKill[powerupsToKill.length] = powerup
		if (checkEmpty(board, [0, "split"]) && options.autoSkip) {
			skip()
		}
		split.play()
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
		if (powerupTag === "double"){
			double.play('key')
		} else if (powerupTag === "power"){
			power.play('key')
		} else if (powerupTag === "ghost"){
			ghost.play('key')
		}
	}
}

// control

function mouseMoved() {
	if (phase[0] === "game" && !phase[1] && !isFiring && mouseY > 100 && !options.pause) {
		mouseAngle = atan2((mouseX - ballCenterPos.x), (mouseY - ballCenterPos.y))
		if (mouseAngle > -(90 + mouseAngleCutoff) && mouseAngle < 0) {
			mouseAngle = -(90 + mouseAngleCutoff)
		}
		if (mouseAngle >= 0 && mouseAngle < 90 + mouseAngleCutoff) {
			mouseAngle = 90 + mouseAngleCutoff
		}
	}
	if (phase[0] === "menu" && !phase[1]) {
		if (playButton.mouse.hovering()) {
			playButton.img = playButtonHighlightedImage
		} else {
			playButton.img = playButtonImage
		}
		if (infoButton.mouse.hovering()) {
			infoButton.img = infoButtonHighlightedImage
		} else {
			infoButton.img = infoButtonImage
		}
		if (leaderboardsButton.mouse.hovering()) {
			leaderboardsButton.img = leaderboardsButtonHighlightedImage
		} else {
			leaderboardsButton.img = leaderboardsButtonImage
		}
		if (statsButton.mouse.hovering()) {
			statsButton.img = statsButtonHighlightedImage
		} else {
			statsButton.img = statsButtonImage
		}
		if (modeDisplay.mouse.hovering()) {
			modeDisplay.color = color(0, 118, 234)
		} else {
			modeDisplay.color = color(0, 102, 204)
		}
	}
	if (phase[0] === "menu" && phase[1]) {
		if (closeButton.mouse.hovering()) {
			closeButton.img = closeButtonHighlightedImage
		} else {
			closeButton.img = closeButtonImage
		}
	}
}

function mousePressed(event) {
	userInteracted = true
	if (event.button === 0) {
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
			buttonClick.play('key')
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
			buttonClick.play('key')
		}
		if (phase[0] === "menu" && !phase[1]) {
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
				buttonClick.play('key')
				gameStart.play()
				cottagecore.stop()
				synthy.play()
			}
			if (infoButton.mouse.hovering()) {
				phase = ["menu", "info"]
				closeButton.visible = true
				buttonClick.play('key')
			}
			if (leaderboardsButton.mouse.hovering()) {
				phase = ["menu", "leaderboards"]
				closeButton.visible = true
				buttonClick.play('key')
				amogus.play('key')
			}
			if (statsButton.mouse.hovering()) {
				phase = ["menu", "stats"]
				closeButton.visible = true
				buttonClick.play('key')
				stats.play('key')
			}
			if (modeDisplay.mouse.hovering()) {
				mode = modeRotation[(modeRotation.indexOf(mode) + 1) % 3]
				modeDisplay.text = "Mode: " + mode
				localStorage.setItem("mode", mode)
				modeChange.play()
			}
		}
		if (phase[0] === "menu" && phase[1]) {
			if (closeButton.mouse.hovering()) {
				phase = ["menu"]
				closeButton.visible = false
				closeButton.img = closeButtonImage
				mouseMoved()
				buttonClick.play('key')
			}
		}
		if (!(phase[0] === "menu" && phase[1])) {
			if (musicButton.mouse.hovering()) {
				options.music = !options.music
				musicButton.img = options.music ? musicButtonOnImage : musicButtonOffImage
				options.music ? musics.forEach(x => x.mute(false)) : musics.forEach(x => x.mute(true))
				let tempOptions = JSON.parse(localStorage.getItem("options"))
				tempOptions.music = options.music
				localStorage.setItem("options", JSON.stringify(tempOptions))
				if (options.music){
					if (tempSettings.music) document.getElementById("music").value = tempSettings.music
					else document.getElementById("music").value = "100"
				} else {
					tempSettings.music = document.getElementById("music").value
					document.getElementById("music").value = "0"
				}
				localStorage.setItem("music", document.getElementById("music").value)
				buttonClick.play('key')
			}
			if (soundButton.mouse.hovering()) {
				options.sound = !options.sound
				soundButton.img = options.sound ? soundButtonOnImage : soundButtonOffImage
				options.sound ? sounds.forEach(x => x.mute(false)) : sounds.forEach(x => x.mute(true))
				let tempOptions = JSON.parse(localStorage.getItem("options"))
				tempOptions.sound = options.sound
				localStorage.setItem("options", JSON.stringify(tempOptions))
				if (options.sound){
					if (tempSettings.sound) document.getElementById("sound").value = tempSettings.sound
					else document.getElementById("sound").value = "100"
				} else {
					tempSettings.sound = document.getElementById("sound").value
					document.getElementById("sound").value = "0"
				}
				localStorage.setItem("sound", document.getElementById("sound").value)
				buttonClick.play('key')
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
				buttonClick.play('key')
			}
			if (tutorialButton.mouse.hovering()) {
				showTutorial()
				buttonClick.play('key')
			}
		}
		if (phase[0] === "game" && !phase[1] && pauseButton.mouse.hovering()) {
			pauseButtonCalls()
			buttonClick.play('key')
		}
	}
}

function keyPressed() {
	userInteracted = true
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
		if (keyCode === 32 && ballsInAir && !isFiring) {
			for (let ball of balls) {
				ball.speed = ball.speed * 1.25 + 0.1
			}
			ballSpeedup.play('key')
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

let ballHit, powerBallHit, ballSpeedup, shootBall, amogus, 
boop, wow, gameStart, gameover, newbest, roundPassed, ball, 
double, ghost, power, split, buttonClick, modeChange, stats

let sounds;

let cottagecore;

let musics;
function preload() {
	//powerup graphics
	ballPowerupAnimation = loadAnimation("assets/powerup images/ball powerup.png", { frameSize: [70, 70], frames: 11 })
	ballPowerupAnimation.frameDelay = 6
	ghostPowerupAnimation = loadAnimation("assets/powerup images/ghost powerup.png", { frameSize: [500, 500], frames: 14 })
	ghostPowerupAnimation.frameDelay = 5
	splitPowerupBigImage = loadImage("assets/powerup images/split powerup big.png")
	splitPowerupImage = loadImage("assets/powerup images/split powerup.png")
	powerPowerupImage = loadImage("assets/powerup images/power powerup.png")
	doublePowerupImage = loadImage("assets/powerup images/double powerup.png")
	// button graphics

	// menu
	playButtonImage = loadImage("assets/button images/play button.png")
	playButtonHighlightedImage = loadImage("assets/button images/play button highlighted.png")
	infoButtonImage = loadImage("assets/button images/info button.png")
	infoButtonHighlightedImage = loadImage("assets/button images/info button highlighted.png")
	leaderboardsButtonImage = loadImage("assets/button images/leaderboards.png")
	leaderboardsButtonHighlightedImage = loadImage("assets/button images/leaderboards highlighted.png")
	statsButtonImage = loadImage("assets/button images/stats.png")
	statsButtonHighlightedImage = loadImage("assets/button images/stats highlighted.png")

	// menu + 
	closeButtonImage = loadImage("assets/button images/close.png")
	closeButtonHighlightedImage = loadImage("assets/button images/close highlighted.png")

	// gameover screen
	homeButtonImage = loadImage("assets/button images/home button.png")
	homeButtonHighlightedImage = loadImage("assets/button images/home button highlighted.png")
	restartButtonImage = loadImage("assets/button images/restart button.png")
	restartButtonHighlightedImage = loadImage("assets/button images/restart button highlighted.png")

	// options
	musicButtonOnImage = loadImage("assets/button images/music on.png")
	musicButtonOffImage = loadImage("assets/button images/music off.png")
	soundButtonOnImage = loadImage("assets/button images/sound on.png")
	soundButtonOffImage = loadImage("assets/button images/sound off.png")
	pauseButtonImage = loadImage("assets/button images/pause.png")
	resumeButtonImage = loadImage("assets/button images/resume.png")
	autoSkipButtonImage = loadImage("assets/button images/auto skip.png")
	noAutoSkipButtonImage = loadImage("assets/button images/no auto skip.png")
	tutorialButtonImage = loadImage("assets/button images/tutorial.png")

	oswald = loadFont("assets/oswald.ttf")

	// sounds (howler)

	// balls
	
	powerBallHit = new Howl({src:"assets/sounds/balls/power ball hit.wav", onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})
	powerBallHit.volume(0.9)
	ballSpeedup = new Howl({src:"assets/sounds/balls/ball-speedup.wav", sprite:{key: [200, 1000, false]}, onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})
	shootBall = new Howl({src:"assets/sounds/balls/shoot-ball.wav", onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})
	shootBall.volume(0.8)
	ballHit = new Howl({src:"assets/sounds/balls/ball hit.mp3", onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})

	// misc
	amogus = new Howl({src:"assets/sounds/misc/amogus.mp3", sprite: {key: [200, 4000, false]}, onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})
	boop = new Howl({src:"assets/sounds/misc/boop.mp3", onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})
	wow = new Howl({src:"assets/sounds/misc/wow.mp3", onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})

	// phase change
	gameStart = new Howl({src:"assets/sounds/phase change/game start.wav", onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})
	gameStart.volume(0.6)
	gameover = new Howl({src:"assets/sounds/phase change/gameover.mp3", onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})
	newbest = new Howl({src:"assets/sounds/phase change/newbest.wav", onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})
	roundPassed = new Howl({src:"assets/sounds/phase change/round passed.wav", onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})

	// powerups
	ball = new Howl({src:"assets/sounds/powerups/ball.mp3", onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})
	ball.volume(0.6)
	double = new Howl({src:"assets/sounds/powerups/double.mp3", sprite: {key: [50, 1000, false]}, onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})
	double.volume(0.7)
	ghost = new Howl({src:"assets/sounds/powerups/ghost.wav", sprite: {key: [150, 1000, false]}, onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})
	power = new Howl({src:"assets/sounds/powerups/power.wav", sprite: {key: [300, 1000, false]}, onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})
	power.volume(0.8)
	split = new Howl({src:"assets/sounds/powerups/split.wav", onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})
	split.volume(0.8)
	// ui
	buttonClick = new Howl({src:"assets/sounds/ui/button-click.wav", sprite: {key: [20, 200, false]}, onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})
	modeChange = new Howl({src:"assets/sounds/ui/mode-change.wav", onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})
	modeChange.volume(0.6)
	stats = new Howl({src:"assets/sounds/ui/stats.wav", sprite: {key: [300, 400, false]}, onend: function(id) {pausedIds.splice(pausedIds.indexOf(id), 1)}, onplay: function(id) {pausedIds.push(id)}})

	sounds = [ballHit, powerBallHit, ballSpeedup, shootBall, amogus, boop, wow, gameStart, gameover, newbest, roundPassed, ball, double, 
		ghost, power, split, buttonClick, modeChange, stats]
	soundsOriginalVolume = [1, 0.9, 1, 0.8, 1, 1, 1, 0.6, 1, 1, 1, 0.6, 0.7, 1, 0.8, 0.8, 1, 0.6, 1]
	//music
	cottagecore = new Howl({src:"assets/music/cottagecore.mp3", sprite: {key: [0, 243000, true]}})
	guitar = new Howl({src:"assets/music/guitar.mp3", loop: true})
	synthy = new Howl({src:"assets/music/synthy.mp3", loop: true})

	musics = [cottagecore, guitar, synthy]
	musicsOriginalVolume = [1, 1, 1]
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	noStroke()
	angleMode(DEGREES)
	textAlign(CENTER, BASELINE)
	if (localStorage.getItem("options")) {
		options = JSON.parse(localStorage.getItem("options"))
	} else {
		localStorage.setItem("options", JSON.stringify(options))
	}
	if (!options.sound) sounds.forEach(x => x.mute(true))
	if (!options.music) musics.forEach(x => x.mute(true))
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
	if (JSON.parse(localStorage.getItem("options")).autoSkip === false) {
		autoSkipButton.img = noAutoSkipButtonImage
	} else {
		autoSkipButton.img = autoSkipButtonImage
	}
	musicButton = new Sprite(windowWidth - 295 + 58 * 3 + 20, 50, 40, 40, "kinematic")
	if (JSON.parse(localStorage.getItem("options")).music === true) {
		musicButton.img = musicButtonOnImage
	} else {
		musicButton.img = musicButtonOffImage
	}
	//document.getElementById("music").style.transform = "translate(" + (musicButton.x).toString() + "px, 10px) rotate(-90deg);"
	soundButton = new Sprite(windowWidth - 295 + 58 * 4 + 20, 50, 40, 40, "kinematic")
	if (JSON.parse(localStorage.getItem("options")).sound === true) {
		soundButton.img = soundButtonOnImage
	} else {
		soundButton.img = soundButtonOffImage
	}
	//document.getElementById("sound").style.transform = "translate(" + (soundButton.x).toString() + "px, 10px) rotate(-90deg);"
	closeButton = new Sprite(1165, 155, 64, 64, "kinematic")
	closeButton.img = closeButtonImage
	closeButton.visible = localStorage.getItem("timesVisited") === "1" ? true : false
	// collision logic

	balls.collide(walls)
	balls.overlap(balls)
	balls.overlap(closeButton)
	balls.collide(downWall, ballDownWallCollision)
	blocks.collide(balls, ballBlockCollision)
	menuCalls()
	switchVisibility(false)
	mode = localStorage.getItem("mode") ? localStorage.getItem("mode") : "Normal"
	demoDescriptionCycleNum = localStorage.getItem("cyclenum") ? parseInt(localStorage.getItem("cyclenum")) : 0
	randomDemoAngle = random(-5, -175)
	document.getElementById("music").oninput = function (){
		for (let i in musics){
			musics[i].volume(musicsOriginalVolume[i]*document.getElementById("music").value/100)
		}
		if (document.getElementById("music").value === "0"){
			musicButton.img = musicButtonOffImage
		} else {
			musicButton.img = musicButtonOnImage
		}
		localStorage.setItem("sound", document.getElementById("sound").value)
	}
	document.getElementById("sound").oninput = function (){
		for (let i in sounds){
			sounds[i].volume(soundsOriginalVolume[i]*document.getElementById("sound").value/100)
		}	
		if (document.getElementById("sound").value === "0"){
			soundButton.img = soundButtonOffImage
		} else {
			soundButton.img = soundButtonOnImage
		}
		localStorage.setItem("music", document.getElementById("music").value)
	}
	document.getElementById("sound").value = localStorage.getItem("sound") ? localStorage.getItem("sound") : "100"
	document.getElementById("music").value = localStorage.getItem("music") ? localStorage.getItem("music") : "100"
}

//get blocks, the walls, the bottom as collision points

function draw() {
	let frameModulus = phase[0] === "menu" && !kb.pressing("space") ? 32 : 2
	for (let particleObj of allParticles) {
		if (particleObj.n >= 0) {
			if ((frameCount - particleObj.start) % frameModulus === 1 && !options.pause) {
				for (let particle of particleObj.group) {
					particle.vel.y = particle.vel.y + 1
					particle.w = particle.w - particle.w / 30
					particle.h = particle.h - particle.h / 30
				}
				particleObj.n--
			}
		} else {
			particleObj.group.removeAll()
		}
	}
	if (phase[0] === "game") {
		background(215, 160)
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
		if (isFiring && ballsShotFrame != 0 && (frameCount - ballsShotFrame) % framesPerBallShot === 1 && !(ballsToShoot.every(x => x === null) || ballsToShoot.length === 0) && !options.pause) {
			let i = 0
			while (ballsToShoot[i] === null) {
				i++
			}
			balls[ballsToShoot[i]].addSpeed(ballSpeed, -mouseAngle + 90)
			if (!localStorage.getItem(mode + "Launched")) {
				localStorage.setItem(mode + "Launched", 1)
			} else {
				localStorage.setItem(mode + "Launched", (parseInt(localStorage.getItem(mode + "Launched")) + 1).toString())
			}
			if (!localStorage.getItem("Launched")) {
				localStorage.setItem("Launched", 1)
			} else {
				localStorage.setItem("Launched", (parseInt(localStorage.getItem("Launched")) + 1).toString())
			}
			ballsToShoot[i] = null
			if (ballsToShoot.every(x => x === null) || ballsToShoot.length === 0) {
				isFiring = false
			}
			shootBall.play()
		}
		fill(0, 0, 0)
		textFont(oswald, 30)
		text("Score: " + (roundNum - 1).toString(), 85, 65)
		text("Blocks broken: " + blocksBroken.toString(), 270, 65)
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
			if (parseInt(currentEffects[effectsDrawQueue[i]]) > 99) {
				switch (effectsDrawQueue[i]) {
					case "power":
						text("Rounds left: >99", drawPos + 143, 66)
						break
					case "ghost":
						text("Rounds left: >99", drawPos + 150, 66)
						break
					case "double":
						text("Rounds left: >99", drawPos + 115, 66)
						break
				}
			} else {
				switch (effectsDrawQueue[i]) {
					case "power":
					case "ghost":
						text("Rounds left: " + currentEffects[effectsDrawQueue[i]], drawPos + 140, 66)
						break
					case "double":
						text("Rounds left: " + currentEffects[effectsDrawQueue[i]], drawPos + 113, 66)
						break
				}
			}
			textFont(oswald, 15)
			switch (effectsDrawQueue[i]) {
				case "power":
					image(powerPowerupImage, drawPos + 15, 35, 30, 30)
					text("Double damage to all blocks", drawPos + 140, 40)
					fill(...powerupBannerColor)
					drawPos = drawPos + 260
					break
				case "double":
					image(doublePowerupImage, drawPos + 15, 35, 30, 30)
					text("Double ball gain", drawPos + 115, 40)
					fill(...powerupBannerColor)
					drawPos = drawPos + 200
					break
				case "ghost":
					animation(ghostPowerupAnimation, drawPos + 32, 50, 0, 2 / 3, 2 / 3)
					text("Hold left click for ghost mode", drawPos + 150, 40)
					fill(...powerupBannerColor)
					drawPos = drawPos + 270
					break
			}

		}
		if (!options.pause && phase[0] === "game" && !phase[1]) {
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
		for (let particleGroup of allParticles) {
			particleGroup.group.draw()
		}
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
			text("x" + ballNum.toString(), ballCenterPos.x - 1, ballCenterPos.y + 37)
		}
		balls.draw()
		if (ballsInAir) {
			fill(0)
			textFont(oswald, 22)
			text("Press x to skip to the next round", windowWidth / 2 + 300, 722)
			text("Press the Space bar to speed up your balls", windowWidth / 2 - 300, 722)
		}
		let bool1 = false
		for (let ball of balls) {
			if (ball.vel.y === 0) {
				bool1 = true
			}
		}
		let bool2 = false
		for (let ball of balls) {
			if (ball.vel.y === 0 && ball.vel.x === 0) {
				bool2 = true
			}
		}
		if (ballsInAir && !isFiring && bool2){
			text("uh so its not moving thats probably a problem - what key could you press to speed it up? :P", windowWidth/2, 600)
		} else if (ballsInAir && !isFiring && (bool1 || seenStuck)) {
			fill(0)
			textFont(oswald, 22)
			seenStuck = true
			if (!localStorage.getItem("stuck")){
				text("Oh no! It seems that there is a ball that is bouncing back and fourth and its not doing anything! I wonder what button we could press that would let us solve this horrible problem?? (if its still hitting blocks, you can wait for it to be done) (if you don't see a stuck ball then just ignore this)", windowWidth/2 - 600, 543, 1200, 200)
			}
			if (localStorage.getItem("stuck") === "1"){
				text("Might wanna get rid of this bad boy by pressing x as soon as it isn't doing anything, or if it just unstucks itself thats even better, ignore if no see stuck ball :)", windowWidth/2, 600)
			}
		}
		if (phase[1] === "game over screen") {
			fill(0, 0, 0, 50)
			rect(0, 100, windowWidth, windowHeight)
			gameOverDropdown.draw()
			gameOverHomeButton.draw()
			gameOverPlayAgainButton.draw()
			fill(0, 0, 0)
			textFont(oswald, 50)
			text("GAME OVER", gameOverDropdown.x, gameOverDropdown.y - 125)
			textFont(oswald, 30)
			text("Mode: " + mode, gameOverDropdown.x, gameOverDropdown.y - 75)
			text("Score: " + (roundNum - 1).toString(), gameOverDropdown.x, gameOverDropdown.y - 15)
			textFont(oswald, 22)
			text('Highscore: ' + (localStorage.getItem(mode + "Score") ? localStorage.getItem(mode + "Score") : 'None'), gameOverDropdown.x, gameOverDropdown.y + 15)
			textFont(oswald, 30)
			text("Blocks broken: " + blocksBroken.toString(), gameOverDropdown.x, gameOverDropdown.y + 70)
			textFont(oswald, 22)
			text('Most blocks broken: ' + (localStorage.getItem(mode + 'Blocks') ? localStorage.getItem(mode + 'Blocks') : 'None :('), gameOverDropdown.x, gameOverDropdown.y + 102)
			if (newBest) {
				text("New best!", gameOverDropdown.x, gameOverDropdown.y + 150)
			} else {
				if (randomNum < 0.5) {
					text("Better luck next time...", gameOverDropdown.x, gameOverDropdown.y + 150)
				} else {
					text("Maybe you should try harder ;)", gameOverDropdown.x, gameOverDropdown.y + 150)
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
			text("Paused", windowWidth / 2, windowHeight / 2 + topMarginSpace - 50)
			world.autoStep = false
		} else {
			world.autoStep = true
		}
	} else if (phase[0] === "menu") {
		if (kb.pressing("space")) {
			world.step(1 / (5 * slowMultiplier))
			background(215, 180)
		} else {
			world.step(1 / (60 * slowMultiplier))
			background(215, 65)
		}
		if (demoBallsShotFrame != null && (frameCount - demoBallsShotFrame) % (kb.pressing("space") ? framesPerBallShot : framesPerBallShot * 10) === 1) {
			demoBalls[demoBallsToShoot[0]].addSpeed(ballSpeed, randomDemoAngle)
			demoBallsToShoot.shift()
			if (demoBallsToShoot.length === 0) {
				demoBallsShotFrame = null
			}
		}
		textFont(oswald, 100);
		fill(0)
		text("Break those", windowWidth / 2, 100)
		text("Blocks!", windowWidth / 2, 200)
		if (!userInteracted){
			textFont(oswald, 30)
			text("click or press any key to start hearing audio", 250 - 100, 100, 200, 400)
		}
		rect(0, 235, windowWidth, 10)
		rect(0, windowHeight - 55, windowWidth, 10)
		noStroke()
		scoreDisplay.draw()
		for (let spriteObject of [playButton, infoButton, leaderboardsButton, statsButton, musicButton, soundButton, tutorialButton,
			autoSkipButton,]) {
			spriteObject.draw()
		}
		for (let spriteObject of demoSpriteGroups) {
			spriteObject.draw()
		}
		for (let spriteObject of allParticles) {
			spriteObject.group.draw()
		}
		textFont(oswald, 24)
		text("Highscore:", scoreDisplay.x, scoreDisplay.y - 5)
		text(localStorage.getItem(mode + "Score") ? localStorage.getItem(mode + "Score") : "None :P", scoreDisplay.x, scoreDisplay.y + 30)
		blocksBrokenDisplay.draw()
		textFont(oswald, 18)
		text("Most blocks", blocksBrokenDisplay.x, blocksBrokenDisplay.y - 15)
		text("broken:", blocksBrokenDisplay.x, blocksBrokenDisplay.y + 8)

		text(localStorage.getItem(mode + "Blocks") ? localStorage.getItem(mode + "Blocks") : "0", blocksBrokenDisplay.x, blocksBrokenDisplay.y + 33)
		modeDisplay.draw()
		modeDescription.draw()
		textFont(oswald, modeTextSize[mode])
		text(modeDescriptions[mode], modeDescription.x - 90, modeDescription.y - 15, modeDescription.w, modeDescription.h)
		if (phase[1]) {
			fill(0, 40)
			rect(0, 0, windowWidth, windowHeight)
			fill(123, 175, 226)
			rect(220, 100, windowWidth - 220 * 2, windowHeight - 100 * 2)
			fill(0)
		}
		if (phase[1] === "info") {
			textFont(oswald, 65)
			text("Info", windowWidth / 2, 195)

			// hot keys info
			textFont(oswald, 38)
			text("Hotkeys", windowWidth / 4 + 100, 220)
			stroke(0)
			strokeWeight(4)
			line(windowWidth / 4 + 100 - 100, 240, windowWidth / 4 + 100 + 100, 240)
			strokeWeight(0)
			textFont(oswald, 28)
			text("Fullscreen", windowWidth / 4 + 100 - 125, 300)
			text("F", windowWidth / 4 + 100 + 135, 300)
			text("Aim", windowWidth / 4 + 100 - 125, 340)
			text("L/R arrow keys", windowWidth / 4 + 100 + 135, 340)
			text("Shoot", windowWidth / 4 + 100 - 125, 380)
			text("Enter", windowWidth / 4 + 100 + 135, 380)
			text("Speed up balls", windowWidth / 4 + 100 - 125, 420)
			text("Space", windowWidth / 4 + 100 + 135, 420)
			text("Skip round", windowWidth / 4 + 100 - 125, 460)
			text("X", windowWidth / 4 + 100 + 135, 460)
			text("End game", windowWidth / 4 + 100 - 125, 500)
			text("spam X :)", windowWidth / 4 + 100 + 135, 500)
			text("Pause/Resume", windowWidth / 4 + 100 - 125, 540)
			text("P", windowWidth / 4 + 100 + 135, 540)

			// other stuff=
			textFont(oswald, 38)
			text("Other stuff", windowWidth - (windowWidth / 4 + 100), 220)
			stroke(0)
			strokeWeight(4)
			line(windowWidth - (windowWidth / 4 + 100) - 100, 240, windowWidth - (windowWidth / 4 + 100) + 100, 240)
			strokeWeight(0)
			textFont(oswald, 24)
			text("I recommend using Ctrl/Cmd + and - to adjust the display size and playing in fullscreen mode.", windowWidth - (windowWidth / 4 + 100) - 225, 285, 450, 600)
			//text("If you get confused on how to play, click on the question mark in the top right of the screen.", windowWidth - (windowWidth / 4 + 100) - 225, 370, 450, 600)
			text("Break the blocks with the balls, and use the powerups to help you! Try out all of the modes.", windowWidth - (windowWidth / 4 + 100) - 225, 370, 450, 600)
			text("Features in progress: Leaderboards and Tutorial", windowWidth - (windowWidth / 4 + 100) - 225, 455, 450, 600)
			text("If you notice any bugs, experience any issues, have any questions, or any suggestions, email me at moonflowur03@gmail.com. I will try to respond as fast as I can.", windowWidth - (windowWidth / 4 + 100) - 225, 510, 450, 600)
		}
		if (phase[1] === "leaderboards") {
			textFont(oswald, 65)
			text("Leaderboards", windowWidth / 2, 195)
			textFont(oswald, 40)
			fill(255)
			text("This feature is coming soon!", windowWidth / 2, 390)
		}
		if (phase[1] === "stats") {
			textFont(oswald, 65)
			text("Statistics", windowWidth / 2, 195)
			textFont(oswald, 30)
			text("Highscore", windowWidth / 2 - 310, 295)
			text("Total rounds survived", windowWidth / 2 - 310, 345)
			text("Most blocks broken", windowWidth / 2 - 310, 395)
			text("Total blocks broken", windowWidth / 2 - 310, 445)
			text("Total damage dealt", windowWidth / 2 - 310, 495)
			text("Total balls launched", windowWidth / 2 - 310, 545)
			text("Total balls picked up", windowWidth / 2 - 310, 595)

			text("Normal", windowWidth / 2 - 80, 250)
			text("Hard", windowWidth / 2 + 80, 250)
			text("Power", windowWidth / 2 + 240, 250)
			text("All", windowWidth / 2 + 400, 250)
			let textArr1 = ["Score", "Survived", "Blocks", "TotalBlocks", "Damage", "Launched", "Picked"]
			let textArr2 = ["Normal", "Hard", "Power", ""]
			for (let y in textArr1) {
				for (let x in textArr2) {
					text(localStorage.getItem(textArr2[x] + textArr1[y]) ? localStorage.getItem(textArr2[x] + textArr1[y]) : "-", windowWidth / 2 - 80 + 160 * x, 295 + y * 50)
				}
			}
		}
	}
	let extra = 5
	if (soundButton.mouse.hovering() || (soundButton.x - soundButton.w/2 - extra < mouseX && mouseX < soundButton.x + soundButton.w/2 + extra && soundButton.y - soundButton.h/2 <= mouseY && mouseY < 220 && document.getElementById("sound").style.visibility === "visible")){
		document.getElementById("sound").style.visibility = "visible"
	} else {
		document.getElementById("sound").style.visibility = "hidden"
	}
	if (musicButton.mouse.hovering() || (musicButton.x - musicButton.w/2 - extra < mouseX && mouseX < musicButton.x + musicButton.w/2 + extra&& musicButton.y - musicButton.h/2 <= mouseY && mouseY < 220 && document.getElementById("music").style.visibility === "visible")){
		document.getElementById("music").style.visibility = "visible"
	} else {
		document.getElementById("music").style.visibility = "hidden"
	}
	// if (tutorialButton.mouse.hovering() && !phase[1]) {
	// 	fill(...powerupBannerColor)
	// 	rotate(45)
	// 	rect(tutorialButton.x - 20, tutorialButton.y + 100, 100, 100, 10)
	// 	rotate(-45)
	// 	rect(tutorialButton.x - 50, tutorialButton.y + 30, 100, 40, 10)
	// 	fill(0)
	// 	textFont(oswald, 20)
	// 	text("Tutorial", tutorialButton.x, tutorialButton.y + 56)
	// }
}