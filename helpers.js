function generateBoardFromDescription(board_description, convertFunction) {
	board_description = board_description.trim();
	let ret = [];

	for (const row of board_description.split("\n")) {		
		ret.push(row.split("").map(convertFunction));
	}

	return ret;
}

function mainConvertFunction(char) {
	return {
		x: 0,
		"1": 1,
		"2": 2,
		"3": 3,
		"9": 9
	}[char]
}

function xyContains(arr, obj) {
	for (let itm of arr) {
		if (itm.x === obj.x && itm.y === obj.y) {
			return true
		}
	}
	return false
}

// inclusive for min but not for max

function isBetween(num, min, max) {
	return min <= num && num < max ? true : false
}

// assuming a 2d nested array

function checkEmpty(board, emptyItemArr){
	for (let i in board){
		for (let j in board[i]){
			if (!emptyItemArr.includes(board[i][j])){
				return false
			}
		}
	}
	return true
}