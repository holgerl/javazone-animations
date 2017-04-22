function makeExtendedLinesMesh(linePoints, isClosedLoop, lineWidth, fragmentShader) {
	var geometry = makeExtendedLinesGeometry(linePoints, isClosedLoop);

	var shaderUtil = document.getElementById('shaderUtil').textContent;

	var localUniforms = {
		lineWidth: {value: lineWidth}
	}

	var material = new THREE.ShaderMaterial({
		uniforms: localUniforms,
		vertexShader: shaderUtil + document.getElementById('extendedVertexshader').textContent,
		fragmentShader: fragmentShader,
		side: THREE.DoubleSide,
		transparent: true,
		depthWrite: false,
		//wireframe: true
	});

	var lines = new THREE.Mesh(geometry, material);

	return lines;
}

function makeExtendedLinesGeometry(linePoints, isClosedLoop) {
	var positions = [];
	var indices = [];
	var nextPositions = [];
	var previousPositions = [];
	var extensionDirections = [];

	var firstPoint = linePoints[0];
	var lastPoint = linePoints[linePoints.length-1];
	
	positions.push(firstPoint.clone(), firstPoint.clone());
	extensionDirections.push(-1, 1);
	
	if (isClosedLoop) {
		previousPositions.push(lastPoint.clone(), lastPoint.clone());
	} else {
		previousPositions.push(firstPoint.clone(), firstPoint.clone()); // Previous point is the point itself at start of line
	}

	for (var i in linePoints) {
		if (i == 0) continue;

		var p00 = linePoints[i-1].clone();
		var p01 = linePoints[i-1].clone();
		var p10 = linePoints[i].clone();
		var p11 = linePoints[i].clone();

		positions.push(p10, p11);

		var i00 = 2*i-2;
		var i01 = 2*i-1;
		var i10 = 2*i;
		var i11 = 2*i+1;

		indices.push(i00, i10, i11);
		indices.push(i00, i11, i01);

        extensionDirections.push(-1, 1);
		nextPositions.push(p10, p11);
		previousPositions.push(p00, p01);
	}

	if (isClosedLoop) {
		var i = linePoints.length;
		var i00 = 2*i - 2;
		var i01 = 2*i - 1;
		var i10 = 0;
		var i11 = 1;

		indices.push(i00, i10, i11);
		indices.push(i00, i11, i01);

		nextPositions.push(firstPoint.clone(), firstPoint.clone());
	} else {
		nextPositions.push(lastPoint.clone(), lastPoint.clone()); // Next point is the point itself at end of line
	}

	var flatPositions = flattenVectorArray(positions);
	var flatNextPositions = flattenVectorArray(nextPositions);
	var flatPreviousPositions = flattenVectorArray(previousPositions);

	var geometry = new THREE.BufferGeometry();

	geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
	geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(flatPositions), 3));
	geometry.addAttribute('extensionDirection', new THREE.BufferAttribute(new Float32Array(extensionDirections), 1));
	geometry.addAttribute('nextPosition', new THREE.BufferAttribute(new Float32Array(flatNextPositions), 3));
	geometry.addAttribute('previousPosition', new THREE.BufferAttribute(new Float32Array(flatPreviousPositions), 3));

	geometry.computeBoundingSphere();

	return geometry;
}