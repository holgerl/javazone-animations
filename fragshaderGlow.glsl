uniform float time;
varying float hue;
varying float extension;
varying float surfaceIndexToFragShader;

void main() {
	vec3 color = hsv2rgb(vec3(hue, 0.75, 1.0));
	float alpha = 1.0 - abs(extension);
	alpha = clamp(alpha, 0.0, 1.0);
	alpha = pow(alpha, 3.0);
	alpha *= 0.5;
	if (surfaceIndexToFragShader == 2.0) {
		alpha = 0.0;
	}
	gl_FragColor = vec4(color.xyz, alpha);
}