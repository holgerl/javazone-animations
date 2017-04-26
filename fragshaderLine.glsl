uniform float time;
varying float hue;

void main() {
	vec3 color = hsv2rgb(vec3(hue, 0.75, 1.0));
	gl_FragColor = vec4(color.xyz, 1.0);
}