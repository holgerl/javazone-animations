"use strict";

var timeStart = new Date().getTime();

var globals = {};

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
	
	globals.renderer = renderer;
	globals.scene = scene;
	globals.camera = camera;
}

function main() {
	boilerPlate();

	globals.logoSpinTime = 1;
	globals.wheelState = 0;

	var uniforms = {
		time: {value: 0.0}
	};
	globals.uniforms = uniforms;

	globals.shaderUtil = document.getElementById('shaderUtil').textContent;

	var grid = makeGrid();
	grid.rotation.y = - Math.PI / 3 / 1.5;
	grid.rotation.x = -0.2;
	grid.position.setY(-6);
	globals.scene.add(grid);

	addDebugObjects();

	var logo = makeJavaZoneLogo();
	logo.rotation.x = 0.3;
	logo.position.setY(2);
	globals.scene.add(logo);
	globals.logo = logo;

	setupParameters();

	setupMouseEvents(globals.renderer.domElement);

	animate();
}

function addDebugObjects() {
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

	var lineShader = globals.shaderUtil + document.getElementById('fragmentshader').textContent
	var glowShader = globals.shaderUtil + document.getElementById('fragmentshaderGlow').textContent

	var lines = makeExtendedLinesMesh(linePoints, false, 0.05, lineShader);
	globals.scene.add(lines);
	lines.position.setY(-1);

	var lines2 = makeExtendedLinesMesh(linePoints2, false, 0.05, lineShader);
	globals.scene.add(lines2);
	lines2.position.setY(-1);

	var linesGlow = makeExtendedLinesMesh(linePoints, false, 0.5, glowShader);
	globals.scene.add(linesGlow);
	linesGlow.position.setY(-1);

	var linesGlow2 = makeExtendedLinesMesh(linePoints2, false, 0.5, glowShader);
	globals.scene.add(linesGlow2);
	linesGlow2.position.setY(-1);
}

function makeGrid() {
	function makeSingleGrid() {
		var grid = new THREE.Object3D();

		var glowShader = globals.shaderUtil + document.getElementById('fragmentshaderGlow').textContent;
		var lineShader = globals.shaderUtil + document.getElementById('fragmentshader').textContent;

		function addLine(line) {
			grid.add(makeExtendedLinesMesh(line, false, 0.05, lineShader));
			grid.add(makeExtendedLinesMesh(line, false, 0.5, glowShader));
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

	var singleGrid1 = makeSingleGrid();
	singleGrid1.position.add(new THREE.Vector3(-2, 0, 2));
	grid.add(singleGrid1);
	
	var singleGrid2 = makeSingleGrid();
	singleGrid2.position.add(new THREE.Vector3(2, 0, -2));
	grid.add(singleGrid2);

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

function animate() {
	requestAnimationFrame(animate);

	globals.camera.position.set(8*Math.sin(0), 2, 8*Math.cos(0))

	if (globals.mouseState.mouseDown && globals.logoSpinTime == 1) {
		globals.logoSpinTime = 0;
	}

	var spinSpeed = 1/40;

	globals.logoSpinTime = Math.min(1, globals.logoSpinTime + spinSpeed);

	var easedSpinTime = easeWaveCubic(globals.logoSpinTime);
	globals.logo.rotation.y = easedSpinTime * Math.PI * 2;

	var scrollSpeed = 0.010;
	var cameraHeight = 2 - globals.wheelState * scrollSpeed;
	globals.camera.position.setY(cameraHeight);
	globals.camera.lookAt(new THREE.Vector3(0, cameraHeight - 2, 0));

	render();
}

function render() {
	globals.renderer.render(globals.scene, globals.camera);
}

function setupParameters() {
	var Parameters = function() {
	};
	globals.parameters = new Parameters();
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

	var glowShader = globals.shaderUtil + document.getElementById('fragmentshaderGlow').textContent;
	var lineShader = globals.shaderUtil + document.getElementById('fragmentshader').textContent;

	var lineWidth = 0.05;
	var glowWidth = 0.5;

	var topLines1 = [A, B, D, C];
	logo.add(makeExtendedLinesMesh(topLines1, true, lineWidth, lineShader));
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
	logo.add(makeExtendedLinesMesh(sideLines1, false, lineWidth, lineShader));
	logo.add(makeExtendedLinesMesh(shorten(sideLines1, 0.98), false, glowWidth, glowShader));

	var backSideLines1 = [A, E, C];
	logo.add(makeExtendedLinesMesh(backSideLines1, false, lineWidth, lineShader));
	logo.add(makeExtendedLinesMesh(backSideLines1, false, glowWidth, glowShader));

	var backBackSideLines1 = [E, D];

	var topLines2 = [R, S, T, U, V];
	logo.add(makeExtendedLinesMesh(topLines2, true, lineWidth, lineShader));
	logo.add(makeExtendedLinesMesh(topLines2, true, glowWidth, glowShader));
	logo.add(makePolygon(topLines2));

	var sideLines2 = [R, T];
	logo.add(makeExtendedLinesMesh(sideLines2, false, lineWidth, lineShader));
	logo.add(makeExtendedLinesMesh(shorten(sideLines2, 0.98), false, glowWidth, glowShader));

    var sidePlane2 = [R, T, V];
    logo.add(makePolygon(sidePlane2));

    var sidePlane3 = [T, U, V];
    logo.add(makePolygon(sidePlane3));

	var backSideLines2 = [S, W, V];
	logo.add(makeExtendedLinesMesh(backSideLines2, false, lineWidth, lineShader));
	logo.add(makeExtendedLinesMesh(backSideLines2, false, glowWidth, glowShader));

	var backBackSideLines2 = [R, W, T];
	logo.add(makeExtendedLinesMesh(backBackSideLines2, false, lineWidth, lineShader));
	logo.add(makeExtendedLinesMesh(backBackSideLines2, false, glowWidth, glowShader));

	logo.add(makePolygon([A, E, C]));
	logo.add(makePolygon([S, R, W]));
	logo.add(makePolygon([S, T, W]));

	logo.add(makePolygon([R, W, V]));

	return logo;
}

function setupMouseEvents(domElement) {
	globals.mouseState = {};

	domElement.addEventListener("mousedown", function(e) {
		globals.mouseState.mouseDown = true;
		var position = new THREE.Vector2(e.clientX, e.clientX);
		globals.mouseState.mouseDownPosition = position;
		globals.mouseState.mousePosition = position;
	});

	domElement.addEventListener("mouseup", function(e) {
		globals.mouseState.mouseDown = false;
	});

	domElement.addEventListener("mousemove", function(e) {
		globals.mouseState.mousePosition = new THREE.Vector2(e.clientX, e.clientX);
	});

	domElement.addEventListener("wheel", function(e) {
		globals.wheelState += e.deltaY;
		globals.wheelState = Math.max(0, globals.wheelState);
		globals.wheelState = Math.min(350, globals.wheelState);
	});
}