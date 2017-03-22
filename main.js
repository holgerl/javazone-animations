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
		fragmentShader: document.getElementById('fragmentshader').textContent,
		side: THREE.DoubleSide
	});
	window.uniforms = uniforms;

	var grid = new THREE.LineSegments(geometry, material);
	grid.rotation.y = Math.PI / 4;
	scene.add(grid);

	//--

	var geometry = makeExtendedGeometry();
	window.uniforms = uniforms;

	var material = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: document.getElementById('extendedVertexshader').textContent,
		fragmentShader: document.getElementById('fragmentshader').textContent,
		side: THREE.DoubleSide
	});

	var lines = new THREE.Mesh(geometry, material);
	scene.add(lines);

	//--

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

function makeExtendedGeometry() {
	var geometry = new THREE.BufferGeometry();

	var linePoints = [
		new THREE.Vector3(0,0,0),
		new THREE.Vector3(0,1,0),
		new THREE.Vector3(1,1,0),
		new THREE.Vector3(-2,0,-2),
		new THREE.Vector3(1,-1,1)
	];

	var positions = [];
	var indices = [];
	var miters = [];

	var p00 = linePoints[0].clone();
	var p01 = linePoints[0].clone();

	//p00 = p00.clone().add(new THREE.Vector3(1,1,1).multiplyScalar(-0.02));
	//p01 = p01.clone().add(new THREE.Vector3(1,1,1).multiplyScalar(0.02));
	
	positions.push(p00, p01);
	miters.push(-1, 1);

	for (var i in linePoints) {
		if (i == 0) continue;

		var p00 = linePoints[i-1].clone();
		var p01 = linePoints[i-1].clone();
		var p10 = linePoints[i].clone();
		var p11 = linePoints[i].clone();

		/*
		p00 = p00.clone().add(new THREE.Vector3(1,1,1).multiplyScalar(-0.02));
		p01 = p01.clone().add(new THREE.Vector3(1,1,1).multiplyScalar(0.02));
		p10 = p10.clone().add(new THREE.Vector3(1,1,1).multiplyScalar(-0.02));
		p11 = p11.clone().add(new THREE.Vector3(1,1,1).multiplyScalar(0.02));
		*/

		positions.push(p10, p11);

		var i00 = 2*i-2;
		var i01 = 2*i-1;
		var i10 = 2*i;
		var i11 = 2*i+1;

		indices.push(i00, i10, i11);
		indices.push(i00, i11, i01);

		miters.push(-1, 1);
	}

	var flattenPositions = [].concat.apply([], positions.map(v => [v.x, v.y, v.z]));

	geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
	geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(flattenPositions), 3));
	geometry.addAttribute('miter', new THREE.BufferAttribute(new Float32Array(miters), 1));

	geometry.computeBoundingSphere();

	return geometry;
}

function animate() {
	requestAnimationFrame(animate);

	var relativeTime = (new Date().getTime() - timeStart) / 1000;
	window.uniforms.time.value = relativeTime;

	camera.position.set(5*Math.sin(relativeTime), 2, 5*Math.cos(relativeTime))
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