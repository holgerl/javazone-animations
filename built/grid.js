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
	globals.grid = grid;
	globals.scene.add(grid);

	let pulses = makeLaserPulses();
	pulses.position.setY(-6);
	globals.scene.add(pulses);

	mapEventsToState(globals, globals.renderer.domElement);

	globals.animationType = -1;
	globals.animationTime = 1;

	globals.renderer.domElement.addEventListener("click", function(e) {
		e.stopPropagation();
		e.preventDefault();

		if (globals.animationTime === 1) {
			globals.animationType = randomInt(0, 2);
			globals.animationTime = 0;
		}

		if (globals.animationType == 0) {
			const nofSquares = 20;
			for (let i = 0; i < nofSquares; i++) {
				let squareIndex = randomInt(0, globals.squares.length);
				let offset = Math.random()*1000;
				globals.squares[squareIndex].blinkTime = new Date().getTime() + offset;		
			}
		} else if (globals.animationType == 1) {
			let spread = 1.5;
			let nofPulses = globals.pulses.length;
			let randomOrder = randomPermutation(integerArray(0, nofPulses));
			for (let i in globals.pulses) {
				globals.pulses[i].animationTime = - randomOrder[i] * spread;
			}
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

	for (let pulse of globals.pulses) {
		pulse.position.setX(-100);
	}
	for (let square of globals.squares) {
		square.material.opacity = 0;
		square.material.needsUpdate = true;
	}

	if (globals.animationType == 0) {
		for (let i in globals.squares) {
			let square = globals.squares[i];
			if (square.blinkTime) {
				let blinkDiff = new Date().getTime() - square.blinkTime;
				if (blinkDiff > 0) {
					let decay = 500;
					let slowTime = clamp(blinkDiff/decay, 0, 1);
					square.material.opacity = easeOut(easeWaveCubic, slowTime) * 0.9;
					square.material.needsUpdate = true;
				} 
			}
		}
		globals.animationTime = Math.min(1, globals.animationTime + 0.01);

	} else if (globals.animationType == 1) {
		const animationSpeed = 1/9;
		for (let pulse of globals.pulses) {
			pulse.position.setX(10 - pulse.animationTime*10)
			pulse.animationTime += animationSpeed;
		}
		globals.animationTime = Math.min(1, globals.animationTime + 0.01);
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

	if (color.r == 0.0 && color.g == 0.0 && color.b == 0.0) color = hsv2rgb(vec3(hue, 0.65, 1.0));

	float alpha = 1.0 - abs(extension);
	alpha = clamp(alpha, 0.0, 1.0);
	alpha = pow(alpha, 3.0);
	alpha *= 0.6;
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

	if (color.r == 0.0 && color.g == 0.0 && color.b == 0.0) color = hsv2rgb(vec3(hue, 0.55, 1.0));

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

function makeLaserPulses() {
	let pulses = new THREE.Object3D();

	let material = new THREE.ShaderMaterial({
		uniforms: {},
		vertexShader: `float pointLineDistance(vec3 point, vec3 lineStart, vec3 lineEnd) {
	return length(cross(lineEnd - lineStart, lineStart - point));
}

vec2 perpendicular(vec2 v) {
	return vec2(-v.y, v.x);
}

vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}` + `varying vec2 fragUV;

void main() {
	fragUV = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
		fragmentShader: `float pointLineDistance(vec3 point, vec3 lineStart, vec3 lineEnd) {
	return length(cross(lineEnd - lineStart, lineStart - point));
}

vec2 perpendicular(vec2 v) {
	return vec2(-v.y, v.x);
}

vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}` + `varying vec2 fragUV;

void main() {
	float ratio = 1.0/20.0;
	vec2 symmetricCoord = vec2(fragUV.x/ratio*2.0, abs(fragUV.y*2.0 - 1.0));

	vec3 color = vec3(1.0, 1.0, 1.0);

	vec2 coreCoord = vec2(1.0, 0.0);
	float coreFactor = 1.0 - length(symmetricCoord - coreCoord);
	float nucleusFactor = 1.0 - 2.0*length(symmetricCoord - coreCoord);
	//coreFactor = 0.0;
	coreFactor = clamp(coreFactor, 0.0, 1.0);
	nucleusFactor = clamp(nucleusFactor, 0.0, 1.0);

	float tailThickness = 0.5;
	float behindCore = clamp(symmetricCoord.x - coreCoord.x, 0.0, 0.1)*10.0;
	float tailFactor = 1.0 - symmetricCoord.y/tailThickness;
	tailFactor *= behindCore;
	float fadeOutFactor = 20.0;
	float tailFadeOut = clamp((2.0/ratio - symmetricCoord.x)/fadeOutFactor, 0.0, 1.0);
	tailFactor *= tailFadeOut;
	//tailFactor = 0.0;
	tailFactor = clamp(tailFactor, 0.0, 1.0);

	float alpha = max(nucleusFactor, tailFactor);
	alpha = clamp(alpha, 0.0, 1.0);
	
	gl_FragColor = vec4(color.xyz, alpha);
}`,
		side: THREE.DoubleSide,
		transparent: true,
		depthWrite: false,
		//wireframe: true
	});

	globals.pulses = [];

	const spread = 2.5/5;

	for (let i = 0; i < 5; i++) {
		let pulse = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.25), material);
		pulse.position.setY(-0.5 + i*spread);
		pulse.position.setX(-100);
		pulses.add(pulse);
		pulse.animationTime = 1;
		globals.pulses.push(pulse);
	}

	return pulses;
}