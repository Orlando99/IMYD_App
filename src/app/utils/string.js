export function indicesOf({ term = '%s', str, caseSensitive = false }) {
	if (!str) return [];
	let startIndex = 0, termLen = term.length, index, indices = [];
	if (!caseSensitive) {
		str = str.toLowerCase();
		term = term.toLowerCase();
	}
	while ((index = str.indexOf(term, startIndex)) > -1) {
		indices.push(index);
		startIndex = index + termLen;
	}
	return indices;
}