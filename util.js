function easeWaveQuartic(t) {
	t /= 1/2;
	if (t < 1) return 1/2*t*t*t*t;
	t -= 2;
	return -1/2 * (t*t*t*t - 2);
}

function easeWaveCubic(t) {
	t /= 1/2;
	if (t < 1) return 1/2*t*t*t;
	t -= 2;
	return 1/2*(t*t*t + 2);
}

function flattenVectorArray(array) {
	return [].concat.apply([], array.map(v => [v.x, v.y, v.z]));
}