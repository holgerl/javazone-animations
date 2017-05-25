function makeExtendedLinesMesh(linePoints, isClosedLoop, lineWidth, fragmentShader, jointColors) {
	var geometry = makeExtendedLinesGeometry(linePoints, isClosedLoop, jointColors);

	var shaderUtil = `float pointLineDistance(vec3 point, vec3 lineStart, vec3 lineEnd) {
	return length(cross(lineEnd - lineStart, lineStart - point));
}

vec2 perpendicular(vec2 v) {
	return vec2(-v.y, v.x);
}

vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}`;

	var localUniforms = {
		lineWidth: {value: lineWidth}
	}

	Object.assign(localUniforms, globals.uniforms);

	var material = new THREE.ShaderMaterial({
		uniforms: localUniforms,
		vertexShader: shaderUtil + `uniform float lineWidth;
uniform float time;
varying float hue;
attribute float extensionDirection;
attribute float surfaceIndex;
attribute vec3 nextPosition;
attribute vec3 previousPosition;
varying float extension;
varying float surfaceIndexToFragShader;
attribute vec3 color;
varying vec3 vertexColor;

void main() {
	hue = pointLineDistance(position, vec3(-1, 0, 1), vec3(1, 0, -1));
	hue /= 15.0;
	hue += 0.45;

	vec4 currentProjected  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

	float thickness = lineWidth;

	vertexColor = color;

	extension = extensionDirection;
	surfaceIndexToFragShader = surfaceIndex;

	vec4 previousScreen4D = projectionMatrix * modelViewMatrix * vec4(previousPosition, 1.0);
	vec2 previousScreen = previousScreen4D.xy / previousScreen4D.w;
	vec4 nextScreen4D = projectionMatrix * modelViewMatrix * vec4(nextPosition, 1.0);
	vec2 nextScreen = nextScreen4D.xy / nextScreen4D.w;
	vec2 currentScreen = currentProjected.xy / currentProjected.w;

	vec2 dirBackward = normalize(currentScreen - previousScreen);
	vec2 dirForward = normalize(nextScreen - currentScreen);
	vec2 dirTangent = normalize(dirForward + dirBackward);
	vec2 miter = perpendicular(dirTangent);
	vec2 normal = perpendicular(dirForward);

	float miterLength = 1.0 / max(0.2, dot(miter, normal));

	if (currentScreen == previousScreen) { // At start of line segments
		miter = perpendicular(dirForward);
		miterLength = 1.0;
	} else if (nextScreen == currentScreen) { // At end of line segments
		miter = perpendicular(dirBackward);
		miterLength = 1.0;
	}

	vec2 offset = miter * thickness/2.0 * extensionDirection * miterLength;
	gl_Position = currentProjected + vec4(offset, 0.0, 0.0);
}`,
		fragmentShader: fragmentShader,
		side: THREE.DoubleSide,
		transparent: true,
		depthWrite: false,
		//wireframe: true
	});

	var lines = new THREE.Mesh(geometry, material);

	return lines;
}

function makeExtendedLinesGeometry(linePoints, isClosedLoop, jointColors) {
	var positions = [];
	var indices = [];
	var nextPositions = [];
	var previousPositions = [];
	var extensionDirections = [];
	var surfaceIndecies = [];
	var jointIndecies = [];
	var linepointIndecies = [];

	previousPositions = arrayRotateRight(linePoints.slice());
	nextPositions = arrayRotateLeft(linePoints.slice());

	if (!isClosedLoop) {
		previousPositions[0] = previousPositions[1] // If not closed loop, then previous point is the point itself at start of line
		nextPositions[nextPositions.length - 1] = nextPositions[nextPositions.length - 2] // If not closed loop, then next point is the point itself at end of line
	}

	function addLineSegment(fromIndex, toIndex) {
		var from = linePoints[fromIndex].clone();
		var to = linePoints[toIndex].clone();

		var p00 = from.clone();
		var p01 = from.clone();
		var p10 = to.clone();
		var p11 = to.clone();

		positions.push(p00, p01, p10, p11);

		linepointIndecies.push(fromIndex, fromIndex, toIndex, toIndex);

		var surfaceIndex = fromIndex;
		surfaceIndecies.push(surfaceIndex, surfaceIndex, surfaceIndex, surfaceIndex);

		jointIndecies.push(fromIndex, fromIndex, toIndex, toIndex);

		var length = positions.length;

		var i00 = length-4;
		var i01 = length-3;
		var i10 = length-2;
		var i11 = length-1;

		indices.push(i00, i10, i11);
		indices.push(i00, i11, i01);

        extensionDirections.push(-1, 1, -1, 1);
	}

	for (var i in linePoints) {
		i = parseInt(i);
		if (i == 0) continue;
		addLineSegment(i-1, i);
	}

	if (isClosedLoop) {
		addLineSegment(linePoints.length-1, 0);
	}

	var nextPositionsExploded = [];
	var previousPositionsExploded = [];

	for (var i in linepointIndecies) {
		var linepointIndex = linepointIndecies[i];
		var nextIndex = linepointIndex + 1;
		var previousIndex = linepointIndex - 1;

		if (nextIndex >= linePoints.length) {
			if (isClosedLoop) nextIndex = 0;
			else nextIndex = linePoints.length - 1
		}

		if (previousIndex < 0) {
			if (isClosedLoop) previousIndex = linePoints.length - 1;
			else previousIndex = 0;
		}

		nextPositionsExploded.push(linePoints[nextIndex]);
		previousPositionsExploded.push(linePoints[previousIndex]);
	}

	var vertexColors = [];

	for (var i in jointIndecies) {
		var jointIndex = jointIndecies[i];
		jointColors ? vertexColors.push(jointColors[jointIndex]) : vertexColors.push(new THREE.Color(0,0,0));
	}

	var flatPositions = flattenVectorArray(positions);
	var flatNextPositions = flattenVectorArray(nextPositionsExploded);
	var flatPreviousPositions = flattenVectorArray(previousPositionsExploded);
	var flatColors = flattenVectorArray(vertexColors);

	var geometry = new THREE.BufferGeometry();

	geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
	geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(flatPositions), 3));
	geometry.addAttribute('extensionDirection', new THREE.BufferAttribute(new Float32Array(extensionDirections), 1));
	geometry.addAttribute('nextPosition', new THREE.BufferAttribute(new Float32Array(flatNextPositions), 3));
	geometry.addAttribute('previousPosition', new THREE.BufferAttribute(new Float32Array(flatPreviousPositions), 3));
	geometry.addAttribute('surfaceIndex', new THREE.BufferAttribute(new Float32Array(surfaceIndecies), 1));
	geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(flatColors), 3));

	geometry.computeBoundingSphere();

	return geometry;
}