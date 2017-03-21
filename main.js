"use strict";

var timeStart = new Date().getTime();

function main() {
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

	var uniforms = {
		time: {value: 0.0},
		blinkTime: {value: 0.0}
	};
	window.uniforms = uniforms;

	var geometry = makeGeometry();

	var material = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: document.getElementById('vertexshader').textContent,
		fragmentShader: document.getElementById('fragmentshader').textContent
	});
	window.uniforms = uniforms;

	var grid = new THREE.LineSegments(geometry, material);
	grid.rotation.y = Math.PI / 4;
	scene.add(grid);

	setupParameters();

	animate();
}

function makeGeometry() {
	var geometry = new THREE.BufferGeometry();

	var gridResolution = new THREE.Vector2(10, 10);
	var gridDimensions = new THREE.Vector2(8, 8);

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

function animate() {
	requestAnimationFrame(animate);

	window.uniforms.time.value = new Date().getTime() - timeStart;

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