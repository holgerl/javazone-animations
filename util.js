function easeWaveQuartic(t) {
	t /= 1/2;
	if (t < 1) return 1/2*t*t*t*t;
	t -= 2;
	return -1/2 * (t*t*t*t - 2);
}

function easeWaveCubic(t) {
	t /= 1/2;
	if (t < 1) return 1/2*t*t*t;
	t -= 2;
	return 1/2*(t*t*t + 2);
}

function flattenVectorArray(array) {
	return [].concat.apply([], array.map(v => [v.x, v.y, v.z]));
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
	stateObject.mouseState = {mouseDown: false, mouseDownPosition: undefined, mousePosition: undefined};
	stateObject.wheelState = 0;

	domElement.addEventListener("mousedown", function(e) {
		stateObject.mouseState.mouseDown = true;
		var position = new THREE.Vector2(e.clientX, e.clientX);
		stateObject.mouseState.mouseDownPosition = position;
		stateObject.mouseState.mousePosition = position;
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