"use strict";

var globals = {};

function boilerPlate() {
	var renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setClearColor(0x1D1D1D);
	renderer.domElement.setAttribute('id', 'renderer');
	renderer.setSize(window.innerWidth, window.innerHeight*0.3);

	var ratio = renderer.getContext().drawingBufferWidth / renderer.getContext().drawingBufferHeight;
	
	var camera = new THREE.PerspectiveCamera(30, ratio, 0.1, 10000);
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

	globals.shaderUtil = `float pointLineDistance(vec3 point, vec3 lineStart, vec3 lineEnd) {
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

	var grid = makeGrid();
	grid.rotation.y = - Math.PI / 3 / 1.5;
	grid.rotation.x = -0.2;
	grid.position.setY(-6);
	globals.scene.add(grid);

	mapEventsToState(globals, globals.renderer.domElement);

	globals.renderer.domElement.addEventListener("click", function(e) {
		e.stopPropagation();
		e.preventDefault();
		const nofSquares = 10;
		for (let i = 0; i < nofSquares; i++) {
			let squareIndex = randomInt(0, globals.squares.length);
			let offset = Math.random()*1000;
			globals.squares[squareIndex].blinkTime = new Date().getTime() + offset;		
		}
	});


	animate();
}

function animate() {
	requestAnimationFrame(animate);

	globals.camera.position.set(8*Math.sin(0), 2, 8*Math.cos(0))

	var scrollSpeed = 0.010;
	var wheelState = clamp(globals.wheelState, 0, 350);
	var scrollToBottom = (window.innerHeight + window.scrollY) - document.body.offsetHeight;
	scrollToBottom = Math.max(scrollToBottom, -100)
	scrollToBottom = Math.min(scrollToBottom, 0);
	scrollToBottom += 100;
	var cameraHeight = -scrollToBottom / 50.0 - 0.5;
	globals.camera.position.setY(cameraHeight);
	globals.camera.lookAt(new THREE.Vector3(0, cameraHeight - 4, 0));

	let mouseDiff = new Date().getTime() - globals.mouseState.mouseDownTime;

	globals.uniforms.time.value = mouseDiff;

	for (let i in globals.squares) {
		let square = globals.squares[i];
		square.material.opacity = 0;
		if (square.blinkTime) {
			let blinkDiff = new Date().getTime() - square.blinkTime;
			if (blinkDiff > 0) {
				let decay = 500;
				let slowTime = clamp(blinkDiff/decay, 0, 1);
				square.material.opacity = easeOut(easeWaveCubic, slowTime) * 0.9;
			} 
		}
		square.material.needsUpdate = true;
	}

	render();
}

function render() {
	globals.renderer.render(globals.scene, globals.camera);
}

function makeGrid() {
	function makeSingleGrid() {
		let grid = new THREE.Object3D();

		var glowShader = globals.shaderUtil + `uniform float time;
varying float hue;
varying float extension;
varying float surfaceIndexToFragShader;
varying vec3 vertexColor;

void main() {
	vec3 color = vertexColor;

	if (color.r == 0.0 && color.g == 0.0 && color.b == 0.0) color = hsv2rgb(vec3(hue, 0.75, 1.0));

	float alpha = 1.0 - abs(extension);
	alpha = clamp(alpha, 0.0, 1.0);
	alpha = pow(alpha, 3.0);
	alpha *= 0.5;
	if (surfaceIndexToFragShader == 2.0) {
		//alpha = 0.0;
	}
	gl_FragColor = vec4(color.xyz, alpha);
}`;
		var lineShader = globals.shaderUtil + `uniform float time;
varying float hue;
varying float surfaceIndexToFragShader;
varying vec3 vertexColor;

void main() {
	vec3 color = vertexColor;
	
	if (color.r == 0.0 && color.g == 0.0 && color.b == 0.0) color = hsv2rgb(vec3(hue, 0.75, 1.0));

	if (surfaceIndexToFragShader == 2.0) {
		//color = vec3(0.2);
	}
	gl_FragColor = vec4(color.xyz, 1.0);
}`;

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

		for (let x = 0; x < 5; x++) {
			for (let y = 0; y < 5; y++) {
				const square = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 0, transparent: true}));
				square.rotation.set(-Math.PI/2, 0, 0);
				square.position.set(x + 0.5, 0, y + 0.5);
				globals.squares.push(square);
				grid.add(square);
			}
		}

		return grid;
	}

	globals.squares = [];
	
	var uniforms = {
		time: {value: 0.0}
	};
	globals.uniforms = uniforms;

	var grid = new THREE.Object3D();

	var singleGrid1 = makeSingleGrid();
	singleGrid1.position.add(new THREE.Vector3(-2, 0, 2));
	grid.add(singleGrid1);
	
	var singleGrid2 = makeSingleGrid();
	singleGrid2.position.add(new THREE.Vector3(2, 0, -2));
	grid.add(singleGrid2);

	return grid;
} 