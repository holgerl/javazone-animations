uniform float lineWidth;
uniform float time;
varying float hue;
attribute float extensionDirection;
attribute float surfaceIndex;
attribute vec3 nextPosition;
attribute vec3 previousPosition;
varying float extension;
varying float surfaceIndexToFragShader;
attribute vec3 color;
varying vec3 vertexColor;
uniform float whiteness;

void main() {
	hue = pointLineDistance(position, vec3(-1, 0, 1), vec3(1, 0, -1));
	hue /= 15.0;
	hue += 0.45;

	vec4 currentProjected  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

	float thickness = lineWidth;
	if (lineWidth > 0.5) thickness += whiteness; // TODO: Crazy hack to find out if shader is for the glow
	else thickness += whiteness/10.0;

	vertexColor = color + whiteness/2.0;

	extension = extensionDirection;
	surfaceIndexToFragShader = surfaceIndex;

	vec4 previousScreen4D = projectionMatrix * modelViewMatrix * vec4(previousPosition, 1.0);
	vec2 previousScreen = previousScreen4D.xy / previousScreen4D.w;
	vec4 nextScreen4D = projectionMatrix * modelViewMatrix * vec4(nextPosition, 1.0);
	vec2 nextScreen = nextScreen4D.xy / nextScreen4D.w;
	vec2 currentScreen = currentProjected.xy / currentProjected.w;

	vec2 dirBackward = normalize(currentScreen - previousScreen);
	vec2 dirForward = normalize(nextScreen - currentScreen);
	vec2 dirTangent = normalize(dirForward + dirBackward);
	vec2 miter = perpendicular(dirTangent);
	vec2 normal = perpendicular(dirForward);

	float miterLength = 1.0 / max(0.2, dot(miter, normal));

	if (currentScreen == previousScreen) { // At start of line segments
		miter = perpendicular(dirForward);
		miterLength = 1.0;
	} else if (nextScreen == currentScreen) { // At end of line segments
		miter = perpendicular(dirBackward);
		miterLength = 1.0;
	}

	vec2 offset = miter * thickness/2.0 * extensionDirection * miterLength;
	gl_Position = currentProjected + vec4(offset, 0.0, 0.0);
}