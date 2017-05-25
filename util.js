// TODO: Call this Ease IN
function easeWaveQuartic(t) {
	t /= 1/2;
	if (t < 1) return 1/2*t*t*t*t;
	t -= 2;
	return -1/2 * (t*t*t*t - 2);
}


// TODO: Call this Ease IN
function easeWaveCubic(t) {
	t /= 1/2;
	if (t < 1) return 1/2*t*t*t;
	t -= 2;
	return 1/2*(t*t*t + 2);
}

function easeOut(easeInFunction, t) {
	return easeInFunction(1 - t);
}

function flattenVectorArray(array) {
	return [].concat.apply([], array.map(v => v.x !== undefined ? [v.x, v.y, v.z] : [v.r, v.g, v.b]));
}

function clamp(number, from, to) {
	return Math.max(Math.min(number, to), from);
}

function arrayRotateLeft(arr, reverse){
	if (reverse)
		arr.unshift(arr.pop());
	else
		arr.push(arr.shift());

	return arr;
}

function arrayRotateRight(arr, reverse){
	return arrayRotateLeft(arr, !reverse);
}

function mapEventsToState(stateObject, domElement) {
	stateObject.mouseState = {mouseDown: false, mouseDownPosition: undefined, mousePosition: undefined, mouseDownTime: undefined};
	stateObject.wheelState = 0;

	function mouseTouchDown(position) {
		stateObject.mouseState.mouseDown = true;
		stateObject.mouseState.mouseDownTime = new Date().getTime();
		stateObject.mouseState.mouseDownPosition = position;
		stateObject.mouseState.mousePosition = position;
	}

	domElement.addEventListener("mousedown", function(e) {
		var position = new THREE.Vector2(e.clientX, e.clientX);
		mouseTouchDown(position);
	});

	domElement.addEventListener("touchstart", function(e) {
		var touch = e.touches[0];
		var position = new THREE.Vector2(touch.clientX, touch.clientX);
		mouseTouchDown(position);
	});

	domElement.addEventListener("mouseup", function(e) {
		stateObject.mouseState.mouseDown = false;
	});

	domElement.addEventListener("mousemove", function(e) {
		stateObject.mouseState.mousePosition = new THREE.Vector2(e.clientX, e.clientX);
	});

	domElement.addEventListener("wheel", function(e) {
		stateObject.wheelState += e.deltaY;
	});
}

function randomInt(from, to) {
	return Math.floor(from + Math.random()*(to-from));
}

function integerArray(from, to) {
	let array = [];
	for (let i = from; i < to; i++) array.push(i);
	return array;
}

function randomPermutation(array) {
	let result = array.slice();
	let length = array.length;

	function swap(from, to) {
		var temp = result[from];
		result[from] = result[to];
		result[to] = temp;
	}

	for (let i = 0; i < length; i++) {
		swap(i, randomInt(0, i));
	}

	return result;
}