"use strict";

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

	// TODO: Insert common glsl by build script
	globals.shaderUtil = document.getElementById('shaderUtil').textContent;

	var grid = makeGrid();
	grid.rotation.y = - Math.PI / 3 / 1.5;
	grid.rotation.x = -0.2;
	grid.position.setY(-6);
	globals.scene.add(grid);

	mapEventsToState(globals, globals.renderer.domElement);

	animate();
}

function animate() {
	requestAnimationFrame(animate);

	globals.camera.position.set(8*Math.sin(0), 2, 8*Math.cos(0))

	var scrollSpeed = 0.010;
	var wheelState = globals.wheelState;
	wheelState = Math.max(0, wheelState); // TODO: Replace with clamp
	wheelState = Math.min(350, wheelState);
	var cameraHeight = 2 - wheelState * scrollSpeed;
	globals.camera.position.setY(cameraHeight);
	globals.camera.lookAt(new THREE.Vector3(0, cameraHeight - 2, 0));

	render();
}

function render() {
	globals.renderer.render(globals.scene, globals.camera);
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