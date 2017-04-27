uniform float time;
varying float hue;
varying float surfaceIndexToFragShader;

void main() {
	vec3 color = hsv2rgb(vec3(hue, 0.75, 1.0));
	if (surfaceIndexToFragShader == 2.0) {
		color = vec3(0.2);
	}
	gl_FragColor = vec4(color.xyz, 1.0);
}