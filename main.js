"use strict";

var timeStart = new Date().getTime();

function boilerPlate() {
	var renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setClearColor(0x1D1D1D);
	renderer.domElement.setAttribute('id', 'renderer');
	renderer.setSize(window.innerWidth, window.innerHeight);

	var ratio = renderer.getContext().drawingBufferWidth / renderer.getContext().drawingBufferHeight;
	
	var camera = new THREE.PerspectiveCamera(60, ratio, 0.1, 10000);
	camera.position.set(0, 2, 5)
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	document.body.appendChild(renderer.domElement);

	var scene = new THREE.Scene();
	
	window.renderer = renderer;
	window.scene = scene;
	window.camera = camera;
}

function main() {
	boilerPlate();

	window.logoSpinTime = 1;
	window.wheelState = 0;

	var uniforms = {
		time: {value: 0.0}
	};
	window.uniforms = uniforms;

	var grid = makeGrid();
	grid.rotation.y = - Math.PI / 3 / 1.5;
	grid.rotation.x = -0.2;
	grid.position.setY(-6);
	scene.add(grid);

	var linePoints = [
		new THREE.Vector3(0,0,0),
		new THREE.Vector3(0,1,0),
		new THREE.Vector3(1,1,0),
		new THREE.Vector3(0,1,1),
		new THREE.Vector3(-1,1,0),
		new THREE.Vector3(-2,1,1),
		new THREE.Vector3(-2.2,0,1),
		new THREE.Vector3(-1.9,0,0)
	];

	var linePoints2 = [
		new THREE.Vector3(-2.2,0,0),
		new THREE.Vector3(-2.21,0,0.9)
	]

	var lines = makeExtendedLinesMesh(linePoints);
	//scene.add(lines);
	lines.position.setY(-1);

	var lines2 = makeExtendedLinesMesh(linePoints2);
	//scene.add(lines2);
	lines2.position.setY(-1);

	var linesGlow = makeExtendedLinesMesh(linePoints, false, 0.5, document.getElementById('fragmentshaderGlow').textContent);
	//scene.add(linesGlow);
	linesGlow.position.setY(-1);

	var linesGlow2 = makeExtendedLinesMesh(linePoints2, false, 0.5, document.getElementById('fragmentshaderGlow').textContent);
	//scene.add(linesGlow2);
	linesGlow2.position.setY(-1);

	var logo = makeJavaZoneLogo();
	logo.rotation.x = 0.3;
	logo.position.setY(2);
	scene.add(logo);
	window.logo = logo;

	setupParameters();

	setupMouseEvents(renderer.domElement);

	animate();
}

function makeGridGeometry(skewAmount) {
	var geometry = new THREE.BufferGeometry();

	var gridResolution = new THREE.Vector2(6, 6);
	var gridDimensions = new THREE.Vector2(6, 6);

	var positions = new Float32Array(gridResolution.x * gridResolution.y * 3);

	var indices_array = [];

	for (var y = 0; y < gridResolution.y; y++) {
		for (var x = 0; x < gridResolution.x; x++) {

			var positionX = -gridDimensions.x/2 + (x+0.5)/gridResolution.x * gridDimensions.x;
			var positionY = 0;
			var positionZ = -gridDimensions.y/2 + (y+0.5)/gridResolution.y * gridDimensions.y;

			//var diagonal = Math.sqrt(x*x + y*y);
			var skew = y * skewAmount;
			positionX += skew;

			var i = y * gridResolution.x + x;
			var i10 = (y-1) * gridResolution.x + x;
			var i01 = y * gridResolution.x + (x-1);
			var i11 = (y-1) * gridResolution.x + (x-1);

			if (x > 0 && y > 0) {
				indices_array.push(i, i10);
				indices_array.push(i, i01);
				indices_array.push(i, i11);
			} else if (x == 0 && y == 0) {
				// Do nothing
			} else if (x == 0) {
				indices_array.push(i, i10);
			} else if (y == 0) {
				indices_array.push(i, i01);
			}

			positions[i*3 + 0] = positionX;
			positions[i*3 + 1] = positionY;
			positions[i*3 + 2] = positionZ;
		}
	}

	geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices_array), 1));
	geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));

	geometry.computeBoundingSphere();

	return geometry;
}

function makeGridOld() {
	var skewAmount = -Math.cos(Math.PI / 3);

	var geometry = makeGridGeometry(skewAmount);

	var material = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: document.getElementById('vertexshader').textContent,
		fragmentShader: document.getElementById('fragmentshader').textContent,
		side: THREE.DoubleSide
	});

	var gridLeft = new THREE.LineSegments(geometry, material);
	gridLeft.position.add(new THREE.Vector3(-3+skewAmount, 0, 3));

	var gridRight = new THREE.LineSegments(geometry, material);
	gridRight.position.add(new THREE.Vector3(3, 0, 0));

	var grid = new THREE.Object3D();
	grid.add(gridLeft);
	grid.add(gridRight);

	grid.position.add(new THREE.Vector3(2, 0, 1));

	return grid;
}

function makeGrid() {
	function makeSingleGrid() {
		var grid = new THREE.Object3D();

		var glowShader = document.getElementById('fragmentshaderGlow').textContent;

		function addLine(line) {
			grid.add(makeExtendedLinesMesh(line, false));
			grid.add(makeExtendedLinesMesh(line, false, 0.3, glowShader));
		}

		for (var y = 0; y <= 5; y++) {
			var line = [new THREE.Vector3(0, 0, y), new THREE.Vector3(5, 0, y)];
			addLine(line);

			var line = [new THREE.Vector3(y, 0, 0), new THREE.Vector3(y, 0, 5)];
			addLine(line);
		}

		return grid;
	}

	var grid = new THREE.Object3D();
	var singleGrid = makeSingleGrid();
	singleGrid.position.add(new THREE.Vector3(-2, 0, 2));
	grid.add(singleGrid);
	var singleGrid = makeSingleGrid();
	singleGrid.position.add(new THREE.Vector3(2, 0, -2));
	grid.add(singleGrid);

	return grid;
} 

function makePolygon(polygonPoints, material) {
	var material = material || new THREE.MeshBasicMaterial({
		color: 0x1D1D1D,
		side: THREE.DoubleSide,
		//polygonOffset: true,
        //polygonOffsetFactor: 2.0,
        //polygonOffsetUnits: 22.0
	});

	var geometry = new THREE.Geometry();

	for (var i in polygonPoints) {
		var point = polygonPoints[i].clone();
		point.multiplyScalar(0.99); // TODO: Should be moved towards geometric center of all points
		geometry.vertices.push(point);
		if (i % 3 == 2) {
			geometry.faces.push(new THREE.Face3(i-2, i-1, i));
		}
	}

	geometry.verticesNeedUpdate = true;
	geometry.computeBoundingSphere();

	var polygon = new THREE.Mesh(geometry, material);

	return polygon;
}

function makeExtendedLinesMesh(linePoints, isClosedLoop, lineWidth, fragmentShader) {
	var fragmentShader = fragmentShader || document.getElementById('fragmentshader').textContent;
	var isClosedLoop = isClosedLoop || false;
	var lineWidth = lineWidth || 0.05;

	var geometry = makeExtendedLinesGeometry(linePoints, isClosedLoop);

	var localUniforms = {
		lineWidth: {value: lineWidth},
		time: window.uniforms.time
	}

	var material = new THREE.ShaderMaterial({
		uniforms: localUniforms,
		vertexShader: document.getElementById('extendedVertexshader').textContent,
		fragmentShader: fragmentShader,
		side: THREE.DoubleSide,
		transparent: true,
		depthWrite: false,
		//polygonOffset: true,
        //polygonOffsetFactor: -3.0,
        //polygonOffsetUnits: -8.0
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

function animate() {
	requestAnimationFrame(animate);

	camera.position.set(8*Math.sin(0), 2, 8*Math.cos(0))

	if (window.mouseState.mouseDown && window.logoSpinTime == 1) {
		window.logoSpinTime = 0;
	}

	var spinSpeed = 1/40;

	window.logoSpinTime = Math.min(1, window.logoSpinTime + spinSpeed);

	var easedSpinTime = easeWaveCubic(logoSpinTime);
	window.logo.rotation.y = easedSpinTime * Math.PI * 2;

	var scrollSpeed = 0.010;
	var cameraHeight = 2 - window.wheelState * scrollSpeed;
	camera.position.setY(cameraHeight);
	camera.lookAt(new THREE.Vector3(0, cameraHeight - 2, 0));

	render();
}

function render() {
	window.renderer.render(window.scene, window.camera);
}

function setupParameters() {
	var Parameters = function() {
	};
	window.parameters = new Parameters();
	var gui = new dat.GUI();
}

function makeJavaZoneLogo() {
	var logo = new THREE.Object3D();

	var A = new THREE.Vector3(0, 1, 0);
	var B = new THREE.Vector3(1.25, 1.25, 0);
	var C = new THREE.Vector3(-0.75, 0, 1);
	var D = new THREE.Vector3(1.25, 0, -0.5);
	var E = new THREE.Vector3(-0.25, 0, -1.25);

	var R = new THREE.Vector3(-1, 1.25, -1);
	var S = new THREE.Vector3(0.5, 0.65, -0.75);
	var T = new THREE.Vector3(1, 0, 1);
	var U = new THREE.Vector3(0.5, 0, 1);
	var V = new THREE.Vector3(0, 0, 0.5);
	var W = new THREE.Vector3(0.5, 0, -1);

	var glowShader = document.getElementById('fragmentshaderGlow').textContent;

	var glowWidth = 0.5;

	var topLines1 = [A, B, D, C];
	logo.add(makeExtendedLinesMesh(topLines1, true));
	logo.add(makeExtendedLinesMesh(topLines1, true, glowWidth, glowShader));
	logo.add(makePolygon([A, B, C]));

	function shorten(segment, amount) {
		var oldA = segment[0];
		var oldB = segment[1];
		var AB = oldB.clone().sub(oldA).multiplyScalar(amount);
		var BA = oldA.clone().sub(oldB).multiplyScalar(amount);
		var newA = oldB.clone().add(BA);
		var newB = oldA.clone().add(AB);
		return [newA, newB];
	}

	var sideLines1 = [B, C];
	logo.add(makeExtendedLinesMesh(sideLines1, false));
	logo.add(makeExtendedLinesMesh(shorten(sideLines1, 0.98), false, glowWidth, glowShader));

	var backSideLines1 = [A, E, C];
	logo.add(makeExtendedLinesMesh(backSideLines1, false));
	logo.add(makeExtendedLinesMesh(backSideLines1, false, glowWidth, glowShader));

	var backBackSideLines1 = [E, D];

	var topLines2 = [R, S, T, U, V];
	logo.add(makeExtendedLinesMesh(topLines2, true));
	logo.add(makeExtendedLinesMesh(topLines2, true, glowWidth, glowShader));
	logo.add(makePolygon(topLines2));

	var sideLines2 = [R, T];
	logo.add(makeExtendedLinesMesh(sideLines2, false));
	logo.add(makeExtendedLinesMesh(shorten(sideLines2, 0.98), false, glowWidth, glowShader));

    var sidePlane2 = [R, T, V];
    logo.add(makePolygon(sidePlane2));

    var sidePlane3 = [T, U, V];
    logo.add(makePolygon(sidePlane3));

	var backSideLines2 = [S, W, V];
	logo.add(makeExtendedLinesMesh(backSideLines2, false));
	logo.add(makeExtendedLinesMesh(backSideLines2, false, glowWidth, glowShader));

	var backBackSideLines2 = [R, W, T];
	logo.add(makeExtendedLinesMesh(backBackSideLines2, false));
	logo.add(makeExtendedLinesMesh(backBackSideLines2, false, glowWidth, glowShader));

	var sideBackPlane1 = [A, E, C];

	var lowerBackSideLines2 = [R, E, T];

	logo.add(makePolygon([A, E, C]));
	logo.add(makePolygon([S, R, W]));
	logo.add(makePolygon([S, T, W]));

	logo.add(makePolygon([R, W, V]));

	return logo;
}

function setupMouseEvents(domElement) {
	window.mouseState = {};

	domElement.addEventListener("mousedown", function(e) {
		window.mouseState.mouseDown = true;
		var position = new THREE.Vector2(e.clientX, e.clientX);
		window.mouseState.mouseDownPosition = position;
		window.mouseState.mousePosition = position;
	});

	domElement.addEventListener("mouseup", function(e) {
		window.mouseState.mouseDown = false;
	});

	domElement.addEventListener("mousemove", function(e) {
		window.mouseState.mousePosition = new THREE.Vector2(e.clientX, e.clientX);
	});

	domElement.addEventListener("wheel", function(e) {
		window.wheelState += e.deltaY;
		window.wheelState = Math.max(0, window.wheelState);
		window.wheelState = Math.min(350, window.wheelState);
	});
}