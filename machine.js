let machine = {
	alphabet: ["a", "b", "c"],
	states: [
		{
			id: 0,
			name: "0",
			x: 0,
			y: 0,
		},
		{
			id: 1,
			name: "1",
			x: 100,
			y: 100,
		},
		{
			id: 2,
			name: "2",
			x: 0,
			y: 200,
		},
	],
	transitions: [
		{
			id: 0,
			start: 0,
			end: 1,
			x: 0,
			y: 0,
			symbols: ["a"],
		},
	],
};

// Actual elements rendered on the canvas
let nodes = [];
let transitionLines = [];
