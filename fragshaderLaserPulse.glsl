varying vec2 fragUV;

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
}