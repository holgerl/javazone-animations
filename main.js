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

	var uniforms = {
		time: {value: 0.0}
	};
	window.uniforms = uniforms;

	var geometry = makeGeometry();

	var material = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: document.getElementById('vertexshader').textContent,
		fragmentShader: document.getElementById('fragmentshader').textContent,
		side: THREE.DoubleSide
	});

	var grid = new THREE.LineSegments(geometry, material);
	//grid.rotation.y = Math.PI / 4;
	//scene.add(grid);

	var linePoints = [
		new THREE.Vector3(0,0,0),
		new THREE.Vector3(0,1,0),
		new THREE.Vector3(1,1,0),
		new THREE.Vector3(0,1,1),
		new THREE.Vector3(-1,1,0),
		new THREE.Vector3(-2,1,1),
		new THREE.Vector3(-2,0,1),
		new THREE.Vector3(-2,0,0)
	];

	var lines = makeExtendedLinesMesh(linePoints);
	//scene.add(lines);
	lines.position.setY(-1);

	var logo = makeJavaZoneLogo();
	//logo.position.setY(1);
	scene.add(logo);

	setupParameters();

	setupMouseEvents(renderer.domElement);

	animate();
}

function makeGeometry() {
	var geometry = new THREE.BufferGeometry();

	var gridResolution = new THREE.Vector2(10, 10);
	var gridDimensions = new THREE.Vector2(10, 10);

	var positions = new Float32Array(gridResolution.x * gridResolution.y * 3);
	
	var indices_array = [];

	for (var y = 0; y < gridResolution.y; y++) {
		for (var x = 0; x < gridResolution.x; x++) {
			var positionX = -gridDimensions.x/2 + x/gridResolution.x * gridDimensions.x;
			var positionY = 0;
			var positionZ = -gridDimensions.y/2 + y/gridResolution.y * gridDimensions.y;

			var i = y * gridResolution.x + x;
			var i10 = (y-1) * gridResolution.x + x;
			var i01 = y * gridResolution.x + (x-1);

			if (x > 0 && y > 0) {
				indices_array.push(i, i10);
				indices_array.push(i, i01);
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

function makePolygon(polygonPoints, material) {
	var material = material || new THREE.MeshBasicMaterial({
		color: 0x1D1D1D,
		side: THREE.DoubleSide
	});

	var geometry = new THREE.Geometry();

	for (var i in polygonPoints) {
		var point = polygonPoints[i];
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

function makeExtendedLinesMesh(linePoints, isClosedLoop, fragmentShader) {
	var fragmentShader = fragmentShader || document.getElementById('fragmentshader').textContent;
	var isClosedLoop = isClosedLoop || false;

	var geometry = makeExtendedLinesGeometry(linePoints, isClosedLoop);

	var material = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: document.getElementById('extendedVertexshader').textContent,
		fragmentShader: fragmentShader,
		side: THREE.DoubleSide,
		//polygonOffset: true,
        //polygonOffsetFactor: -2.0,
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

	var relativeTime = (new Date().getTime() - timeStart) / 1000;

	var cameraSpeed = 0;//1/10;

	if (!window.mouseState.mouseDown) {
		window.uniforms.time.value = relativeTime;
		camera.position.set(5*Math.sin(relativeTime*cameraSpeed), 2, 5*Math.cos(relativeTime*cameraSpeed))
	} else {
		var diff = window.mouseState.mousePosition.clone().sub(window.mouseState.mouseDownPosition);
		diff.multiplyScalar(1/50);
		var time = window.uniforms.time.value;
		camera.position.set(5*Math.sin(time - diff.x), 2, 5*Math.cos(time - diff.y))
	}

	camera.lookAt(new THREE.Vector3(0, 0, 0));

	render();
}

function handleEvent() {

}

function render() {
	window.renderer.render(window.scene, window.camera);
}

function setupParameters() {
	var Parameters = function() {

	};
	window.parameters = new Parameters();
	var gui = new dat.GUI();
	gui.add({fireEvent: handleEvent},'fireEvent');
}

function flattenVectorArray(array) {
	return [].concat.apply([], array.map(v => [v.x, v.y, v.z]));
}

function makeJavaZoneLogo() {
	var logo = new THREE.Object3D();

	var topLines1 = [
		new THREE.Vector3(0, 1, 0),
		new THREE.Vector3(1.25, 1.25, 0),
		new THREE.Vector3(-0.75, 0, 1),
	];
	logo.add(makeExtendedLinesMesh(topLines1, true));

	logo.add(makePolygon(topLines1));

	var sideLines1 = [
		new THREE.Vector3(1.25, 1.25, 0),
		new THREE.Vector3(1.25, 0, -0.5),
		new THREE.Vector3(-0.75, 0, 1)
	];
	logo.add(makeExtendedLinesMesh(sideLines1, true));

	var topLines2 = [
		new THREE.Vector3(-1, 1.25, -1),
		new THREE.Vector3(0.5, 0.75, 0),
		new THREE.Vector3(1, 0, 1)
	];
	logo.add(makeExtendedLinesMesh(topLines2, true));

	logo.add(makePolygon(topLines2));

	var sideLines2 = [
		new THREE.Vector3(-1, 1.25, -1),
		new THREE.Vector3(1, 0, 1),
		new THREE.Vector3(0.5, 0, 1),
		new THREE.Vector3(0, 0, 0.5)
	];
	logo.add(makeExtendedLinesMesh(sideLines2, true));

	var sidePlane2 = [
		new THREE.Vector3(-1, 1.25, -1),
		new THREE.Vector3(1, 0, 1),
		new THREE.Vector3(0.5, 0, 1),
		new THREE.Vector3(-1, 1.25, -1),
		new THREE.Vector3(0.5, 0, 1),
		new THREE.Vector3(0, 0, 0.5)
	];
	
	logo.add(makePolygon(sidePlane2));

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
}