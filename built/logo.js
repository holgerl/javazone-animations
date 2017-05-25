"use strict";

var timeStart = new Date().getTime();

var globals = {};

function boilerPlate() {
	var renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setClearColor(0x1D1D1D);
	renderer.domElement.setAttribute('id', 'renderer');
	renderer.setSize(1000, 500);

	var ratio = 2; //renderer.getContext().drawingBufferWidth / renderer.getContext().drawingBufferHeight;
	
	var camera = new THREE.PerspectiveCamera(30, ratio, 0.1, 10000);
	camera.position.set(0, 2, 8)
	camera.lookAt(new THREE.Vector3(0, 2, 0));

	document.body.appendChild(renderer.domElement);

	var scene = new THREE.Scene();
	
	globals.renderer = renderer;
	globals.scene = scene;
	globals.camera = camera;
}

function main() {
	boilerPlate();

	globals.animationTime = 1;

	var uniforms = {
		time: {value: 0.0},
		whiteness: {value: 0.0}
	};
	globals.uniforms = uniforms;

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

	//addDebugObjects();

	var logo = makeJavaZoneLogo();
	logo.rotation.x = 0.3;
	logo.position.setY(2);
	globals.scene.add(logo);
	globals.logo = logo;

	setupParameters();

	mapEventsToState(globals, globals.renderer.domElement);

	globals.animationType = -1;

	globals.renderer.domElement.addEventListener("click", function(e) {
		e.stopPropagation();
		e.preventDefault();
		if (globals.animationTime === 1) {
			globals.animationType = randomInt(0, 3);
			globals.animationTime = 0;
		}
	});

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

	var jointColors = [
		new THREE.Color(1,0,0),
		new THREE.Color(0,1,0),
		new THREE.Color(0,0,1),
		new THREE.Color(1,1,0),
		new THREE.Color(0,1,1),
		new THREE.Color(1,0,1),
		new THREE.Color(1,0.5,1),
		new THREE.Color(0.5,1,1)
	];

	var jointColors2 = [
		new THREE.Color(1,0.5,1),
		new THREE.Color(0.5,0.5,1),
	];

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

	var lines = makeExtendedLinesMesh(linePoints, false, 0.05, lineShader, jointColors);
	globals.scene.add(lines);
	lines.position.setY(-1);

	var lines2 = makeExtendedLinesMesh(linePoints2, false, 0.05, lineShader, jointColors2);
	globals.scene.add(lines2);
	lines2.position.setY(-1);

	var linesGlow = makeExtendedLinesMesh(linePoints, false, 0.5, glowShader, jointColors);
	globals.scene.add(linesGlow);
	linesGlow.position.setY(-1);

	var linesGlow2 = makeExtendedLinesMesh(linePoints2, false, 0.5, glowShader, jointColors2);
	globals.scene.add(linesGlow2);
	linesGlow2.position.setY(-1);
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

	if (globals.animationType == 0) {
		var spinSpeed = 1/40;
		globals.animationTime = Math.min(1, globals.animationTime + spinSpeed);
		var easedSpinTime = easeWaveCubic(globals.animationTime);
		globals.logo.rotation.y = easedSpinTime * Math.PI * 2;
	} else if (globals.animationType == 1) {
		let shakeSpeed = 1/25;
		let shakeTimes = 4;
		let amplitude = 0.15;
		let shakeFalloff = 1.5;

		globals.animationTime = Math.min(1, globals.animationTime + shakeSpeed);
		globals.logo.position.setX(Math.sin(globals.animationTime * 2*Math.PI*shakeTimes) * amplitude * clamp(1 - globals.animationTime*shakeFalloff, 0, 1));
	} else if (globals.animationType == 2) {
		let blinkSpeed = 1/25;
		
		globals.animationTime = Math.min(1, globals.animationTime + blinkSpeed);
		globals.uniforms.whiteness.value = 1 - clamp(easeWaveCubic(globals.animationTime), 0, 1);
	}
	
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
	var D = new THREE.Vector3(1.25, 0.1, -0.5);
	var E = new THREE.Vector3(-0.25, 0, -1.25);

	var R = new THREE.Vector3(-1, 1.25, -1);
	var S = new THREE.Vector3(0.5, 0.65, -0.75);
	var T = new THREE.Vector3(1.15, 0, 1);
	var U = new THREE.Vector3(0.3, 0, 1.2);
	var V = new THREE.Vector3(-0.2, 0.15, 0.9);
	var W = new THREE.Vector3(0.5, 0, -1);

	var colorA = new THREE.Color(0xC764FF);
	var colorB = new THREE.Color(0x4C7EFF);
	var colorC = new THREE.Color(0x45FF62);
	var colorD = new THREE.Color(0xEBC5B3);
	var colorE = colorC;
	var colorS = new THREE.Color(0x9E90FF);
	var colorR = new THREE.Color(0xCC59FB);
	var colorT = new THREE.Color(0xFE974D);
	var colorU = new THREE.Color(0xBFBB53);
	var colorV = colorC;
	var colorW = new THREE.Color(0.5, 0.5, 0.5);

	for (var color of [colorA, colorB, colorC, colorD, colorE, colorS, colorR, colorT, colorU, colorV, colorW]) {
		//color.multiplyScalar(2.5);
		color.addScalar(0.05);
	}

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

	var lineWidth = 0.085;
	var glowWidth = 0.9;

	var topLines1 = [A, B, D, C];
	logo.add(makeExtendedLinesMesh(topLines1, true, lineWidth, lineShader, [colorA, colorB, colorD, colorC]));
	logo.add(makeExtendedLinesMesh(topLines1, true, glowWidth, glowShader, [colorA, colorB, colorD, colorC]));
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
	logo.add(makeExtendedLinesMesh(sideLines1, false, lineWidth, lineShader, [colorB, colorC]));
	logo.add(makeExtendedLinesMesh(shorten(sideLines1, 0.98), false, glowWidth, glowShader, [colorB, colorC]));

	var backSideLines1 = [A, E, C];
	logo.add(makeExtendedLinesMesh(backSideLines1, false, lineWidth, lineShader, [colorA, colorE, colorC]));
	logo.add(makeExtendedLinesMesh(backSideLines1, false, glowWidth, glowShader, [colorA, colorE, colorC]));

	var backBackSideLines1 = [E, D];

	var topLines2 = [R, S, T, U, V];
	logo.add(makeExtendedLinesMesh(topLines2, true, lineWidth, lineShader, [colorR, colorS, colorT, colorU, colorV]));
	logo.add(makeExtendedLinesMesh(topLines2, true, glowWidth, glowShader, [colorR, colorS, colorT, colorU, colorV]));
	logo.add(makePolygon(topLines2));

	var sideLines2 = [R, T];
	logo.add(makeExtendedLinesMesh(sideLines2, false, lineWidth, lineShader, [colorR, colorT]));
	logo.add(makeExtendedLinesMesh(shorten(sideLines2, 0.98), false, glowWidth, glowShader, [colorR, colorT]));

    var sidePlane2 = [R, T, V];
    logo.add(makePolygon(sidePlane2));

    var sidePlane3 = [T, U, V];
    logo.add(makePolygon(sidePlane3));

	var backSideLines2 = [S, W, V];
	logo.add(makeExtendedLinesMesh(backSideLines2, false, lineWidth, lineShader, [colorS, colorW, colorV]));
	logo.add(makeExtendedLinesMesh(backSideLines2, false, glowWidth, glowShader, [colorS, colorW, colorV]));

	var backBackSideLines2 = [R, W, T];
	logo.add(makeExtendedLinesMesh(backBackSideLines2, false, lineWidth, lineShader, [colorR, colorW, colorT]));
	logo.add(makeExtendedLinesMesh(backBackSideLines2, false, glowWidth, glowShader, [colorR, colorW, colorT]));

	logo.add(makePolygon([S, R, W]));
	logo.add(makePolygon([S, T, W]));

	logo.add(makePolygon([R, W, V]));

	return logo;
}