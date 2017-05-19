function makeExtendedLinesMesh(linePoints, isClosedLoop, lineWidth, fragmentShader, jointColors) {
	var geometry = makeExtendedLinesGeometry(linePoints, isClosedLoop, jointColors);

	var shaderUtil = `${util.glsl}`;

	var localUniforms = {
		lineWidth: {value: lineWidth}
	}

	var material = new THREE.ShaderMaterial({
		uniforms: localUniforms,
		vertexShader: shaderUtil + `${vertexshaderExtendedLines.glsl}`,
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