uniform float time;
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
}