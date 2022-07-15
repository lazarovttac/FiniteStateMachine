//#region ELEMENTS

let canvasWrapper;
let canvas;
let context;
let input;

let canvasWidth = 0;
let canvasHeight = 0;

const inputYOffset = 50;

//#endregion

//#region CAMERA

let cameraOffset;
let cameraZoom = 1;
const MAX_ZOOM = 2;
const MIN_ZOOM = 0.5;
const SCROLL_SENSITIVITY = 0.0005;
let isDragging = false;
let dragStart = { x: 0, y: 0 };

//#endregion

//#region EDITION

let isEditing = false;
let clickedElementType;
let clickedElementIndex = -1;

let secondClickedElementType;
let secondClickedElementIndex = -1;
let isShifting = false;

let mousePosition = { x: 0, y: 0 };

//#endregion

window.addEventListener("load", () => {
	GetElements();
	SetUpCanvas();
	SetUpEvents();
	DrawCanvas();
});

function GetElements() {
	canvasWrapper = document.getElementById("canvas-wrapper");
	canvas = document.getElementById("canvas");
	context = canvas.getContext("2d");
	input = document.getElementById("node-name-input");
}
function SetUpCanvas() {
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	canvasWidth = canvas.width;
	canvasHeight = canvas.height;
	cameraOffset = { x: canvasWidth / 2, y: canvasHeight / 2 };
}
function SetUpEvents() {
	canvas.addEventListener("mousedown", onPointerDown);
	canvas.addEventListener("dblclick", onPointerDoubleClick);
	canvas.addEventListener("mouseup", onPointerUp);
	canvas.addEventListener("mousemove", onPointerMove);
	canvas.addEventListener("wheel", (e) =>
		adjustZoom(e.deltaY * SCROLL_SENSITIVITY)
	);
	window.addEventListener("keydown", onKeyDown);
	window.addEventListener("keyup", onKeyUp);
	window.addEventListener("resize", onWindowResize);
	input.addEventListener("change", onInputChange);
}

//#region DRAWING AND UPDATING STUFF

function PrepareCanvas() {
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	canvasWidth = canvas.width;
	canvasHeight = canvas.height;

	// So it zooms into the center
	//   context.translate(canvasWidth / 2, canvasHeight / 2);
	context.scale(cameraZoom, cameraZoom);
	//   context.translate(
	// -canvasWidth / 2 + cameraOffset.x,
	// -canvasHeight / 2 + cameraOffset.y
	//   );
	context.translate(cameraOffset.x, cameraOffset.y);

	let [x, y] = StoW(0, 0);
	context.clearRect(x, y, canvasWidth, canvasHeight);
}

function DrawCanvas() {
	PrepareCanvas();

	// DrawBackgroundGrid();
	DrawTransitionLines();
	DrawNodes();
}
function UpdateCanvas() {
	PrepareCanvas();

	// UpdateBackgroundGrid();
	UpdateTransitionLines();
	UpdateNodes();

	HideHTMLElements();
}

function DrawBackgroundGrid() {
	let a = canvasWidth / cameraZoom / gridSize;
	let [x, y] = StoW(0, 0);

	for (let i = 0; i < a; i++) {
		context.beginPath();
		context.lineWidth = gridStrokeWidth;
		context.strokeStyle = gridStrokeColor;
		context.moveTo(x, y + i * gridSize);
		context.lineTo(canvasWidth, y + i * gridSize);
		context.stroke();
		context.closePath();
	}
}
function UpdateBackgroundGrid() {
	let a = canvasWidth / cameraZoom / gridSize;
	let [x, y] = StoW(0, 0);

	let startY = cameraOffset.y - canvasHeight / 2;

	for (let i = 0; i < a; i++) {
		context.beginPath();
		context.lineWidth = gridStrokeWidth;
		context.strokeStyle = gridStrokeColor;

		let displacement = i * gridSize;
		context.moveTo(x, y + displacement + startY);
		context.lineTo(canvasWidth + x / cameraZoom, y + displacement + startY);

		context.stroke();
		context.closePath();
	}
}

function DrawNodes() {
	// Drawing a circle for each node
	nodes.splice(0, nodes.length);
	machine.states.forEach((state) => {
		let node = new Node(state.x, state.y, state.name);
		nodes.push(node);
		node.Draw(context);
	});
}

function UpdateNodes() {
	// Drawing a circle for each node
	nodes.forEach((node, index) => {
		node.name = machine.states[index].name;
		node.x = machine.states[index].x;
		node.y = machine.states[index].y;

		let clicked =
			(clickedElementType === NODE && index === clickedElementIndex) ||
			(secondClickedElementType === NODE &&
				index === secondClickedElementIndex);
		node.Draw(context, clicked);
	});
}

function DrawTransitionLines() {
	// Drawing a line for each transition from each node
	transitionLines.splice(0, transitionLines.length);
	machine.transitions.forEach((transition) => {
		const startingNode = machine.states[transition.start];
		const endingNode = machine.states[transition.end];

		const [controlPointX, controlPointY] = GetControlPointPosition(
			startingNode.x,
			startingNode.y,
			endingNode.x,
			endingNode.y
		);
		transition.x = controlPointX;
		transition.y = controlPointY;

		let transitionLine = new TransitionLine(
			transition.id,
			transition.start,
			transition.end,
			startingNode.x,
			startingNode.y,
			endingNode.x,
			endingNode.y,
			controlPointX,
			controlPointY,
			transition.symbols
		);
		transitionLines.push(transitionLine);
		transitionLine.Draw(context);
	});
}

function UpdateTransitionLines() {
	// Drawing a line for each transition from each node
	transitionLines.forEach((transition, index) => {
		UpdateTransitionLine(transition);
		let clicked =
			clickedElementType === CONTROL_POINT &&
			index === clickedElementIndex;
		transition.Draw(context, clicked);
	});
}

function UpdateTransitionLine(transitionLine) {
	const transition = machine.transitions.find(
		(transition) => transition.id === transitionLine.id
	);

	const startingNode = machine.states[transitionLine.startNodeIndex];
	const endingNode = machine.states[transitionLine.endNodeIndex];

	transitionLine.endXPos = endingNode.x;
	transitionLine.endYPos = endingNode.y;
	transitionLine.startXPos = startingNode.x;
	transitionLine.startYPos = startingNode.y;

	transitionLine.controlPointX = transition.x;
	transitionLine.controlPointY = transition.y;

	transitionLine.symbols = transition.symbols;
}

function HideHTMLElements() {
	input.style.opacity = "0";
	input.style.top = "-500px";
	input.style.left = "-500px";
}

//#endregion

//#region EVENTS

function GetPointerPosition(event) {
	const rect = canvas.getBoundingClientRect();
	let x = event.clientX - rect.left;
	let y = event.clientY - rect.top;
	mousePosition.x = x;
	mousePosition.y = y;
}

function onPointerDown(event) {
	if (isEditing) {
		ChangeElementValue(input.value);
	}

	if (ClickedNode(mousePosition.x, mousePosition.y)) {
		if (clickedElementType == NODE && secondClickedElementType == NODE) {
			if (secondClickedElementIndex != -1) {
				CreateNewTransition();
			}
		}
		document.body.addEventListener("mousemove", moveNode);
	} else if (ClickedControlPoint(mousePosition.x, mousePosition.y)) {
		document.body.addEventListener("mousemove", moveControlPoint);
	} else {
		clickedElementIndex = -1;
		startPanning(event);
	}

	UpdateCanvas();
}

function onPointerMove(event) {
	GetPointerPosition(event);

	if (isDragging) {
		cameraOffset.x = event.clientX / cameraZoom - dragStart.x;
		cameraOffset.y = event.clientY / cameraZoom - dragStart.y;
		UpdateCanvas();
	}
}

function onPointerUp(event) {
	if (isDragging) {
		stopPanning(event);
	} else {
		document.body.removeEventListener("mousemove", moveNode);
		document.body.removeEventListener("mousemove", moveControlPoint);
	}
	UpdateCanvas();
}

function onPointerDoubleClick(event) {
	let { x, y } = mousePosition;

	if (ClickedNode(x, y)) {
		x = machine.states[clickedElementIndex].x;
		y = machine.states[clickedElementIndex].y;
		EditElement(x, y, clickedElementIndex);
	} else if (ClickedControlPoint(x, y)) {
		x = machine.transitions[clickedElementIndex].x;
		y = machine.transitions[clickedElementIndex].y;
		EditElement(x, y);
	} else {
		CreateNewNode(x, y);
	}
}

function onKeyDown(event) {
	isShifting = event.shiftKey;
}
function onKeyUp(event) {
	isShifting = event.shiftKey;
}

function onWindowResize(event) {
	UpdateCanvas();
}

//#endregion

//#region MOVING STUFF
function ClickedNode(x, y) {
	[x, y] = StoW(x, y);
	if (isShifting) {
		if (clickedElementType == NODE && clickedElementIndex != -1) {
			nodes.forEach((node, index) => {
				if (utils.circlePointCollision(x, y, node.circle)) {
					secondClickedElementIndex = index;
					secondClickedElementType = NODE;
				}
			});
		} else {
			clickedElementIndex = -1;
			nodes.forEach((node, index) => {
				if (utils.circlePointCollision(x, y, node.circle)) {
					clickedElementIndex = index;
					clickedElementType = NODE;
				}
			});
		}
	} else {
		secondClickedElementIndex = -1;
		clickedElementIndex = -1;
		nodes.forEach((node, index) => {
			if (utils.circlePointCollision(x, y, node.circle)) {
				clickedElementIndex = index;
				clickedElementType = NODE;
			}
		});
	}
	return clickedElementIndex != -1;
}

function ClickedControlPoint(x, y) {
	[x, y] = StoW(x, y);
	clickedElementIndex = -1;
	transitionLines.forEach((transition, index) => {
		if (utils.pointInRect(x, y, transition.handle)) {
			clickedElementIndex = index;
			clickedElementType = CONTROL_POINT;

			secondClickedElementIndex = -1;
			secondClickedElementType = null;
		}
	});
	return clickedElementIndex != -1;
}

function moveNode(event) {
	if (
		clickedElementIndex != -1 &&
		clickedElementType === NODE &&
		secondClickedElementIndex === -1
	) {
		let [x, y] = StoW(mousePosition.x, mousePosition.y);

		machine.states[clickedElementIndex].x = x;
		machine.states[clickedElementIndex].y = y;

		UpdateCanvas();
	}
}

function moveControlPoint(event) {
	if (clickedElementIndex != -1) {
		let [x, y] = StoW(mousePosition.x, mousePosition.y);

		machine.transitions[clickedElementIndex].x = x;
		machine.transitions[clickedElementIndex].y = y;

		UpdateCanvas();
	}
}
//#endregion

//#region CREATING STUFF

function CreateNewNode(x, y) {
	[x, y] = StoW(x, y);
	let nodeName = nodes.length;

	let newState = {
		name: nodeName,
		x: x,
		y: y,
		transitions: [],
	};
	machine.states.push(newState);

	let newNode = new Node(x, y, nodeName);
	nodes.push(newNode);

	UpdateCanvas();
}

function CreateNewTransition() {
	let transition = {
		id: machine.transitions[machine.transitions.length - 1].id + 1,
		start: clickedElementIndex,
		end: secondClickedElementIndex,
		x: 0,
		y: 0,
		symbols: [machine.alphabet[0]],
	};

	let repited = machine.transitions.findIndex(
		(t) => t.start == transition.start && t.end == transition.end
	);
	if (repited != -1) return;

	const startingNode = machine.states[transition.start];
	const endingNode = machine.states[transition.end];

	const [controlPointX, controlPointY] = GetControlPointPosition(
		startingNode.x,
		startingNode.y,
		endingNode.x,
		endingNode.y
	);

	transition.x = controlPointX;
	transition.y = controlPointY;
	machine.transitions.push(transition);

	let transitionLine = new TransitionLine(
		transition.id,
		transition.start,
		transition.end,
		startingNode.x,
		startingNode.y,
		endingNode.x,
		endingNode.y,
		controlPointX,
		controlPointY,
		transition.symbols
	);

	transitionLines.push(transitionLine);

	secondClickedElementIndex = -1;
	secondClickedElementType = "";

	clickedElementIndex = machine.transitions.length - 1;
	clickedElementType = CONTROL_POINT;

	EditElement(controlPointX, controlPointY);
	UpdateCanvas();
}

//#endregion

//#region EDITING STUFF

function onInputChange(event) {
	ChangeElementValue(event.target.value);
}

function ChangeElementValue(newValue) {
	if (clickedElementIndex == -1) return;

	if (newValue) {
		switch (clickedElementType) {
			case NODE:
				machine.states[clickedElementIndex].name = newValue;
				break;
			case CONTROL_POINT:
				newSymbols = newValue.split(", ");
				machine.transitions[clickedElementIndex].symbols = newSymbols;
				break;
			default:
				break;
		}
	}
	isEditing = false;
	clickedElementIndex = -1;
	UpdateCanvas();
}

function EditElement(x, y) {
	[x, y] = WtoS(x, y);

	input.style.top = y + inputYOffset + "px";
	input.style.left = x + "px";

	let defaultValue = "";
	switch (clickedElementType) {
		case NODE:
			defaultValue = machine.states[clickedElementIndex].name;
			break;
		case CONTROL_POINT:
			defaultValue =
				machine.transitions[clickedElementIndex].symbols.join(", ");
			break;
		default:
			break;
	}

	input.value = defaultValue;
	input.style.opacity = "1";
	input.focus();
	isEditing = true;
}

function EditTransitionSymbols(x, y) {
	transitionSymbolsInput.style.top = y + "px";
	transitionSymbolsInput.style.left = x + "px";

	transitionSymbolsInput.value = "";
	transitionSymbolsInput.style.opacity = "1";
	transitionSymbolsInput.focus();
	isEditing = true;
}

//#endregion

//#region SCROLL AND PANNING

// Gets the relevant location from a mouse or single touch event

function startPanning(e) {
	isDragging = true;
	dragStart.x = e.clientX / cameraZoom - cameraOffset.x;
	dragStart.y = e.clientY / cameraZoom - cameraOffset.y;
}

function stopPanning(e) {
	isDragging = false;
}

function adjustZoom(zoomAmount) {
	if (!isDragging) {
		cameraZoom -= zoomAmount;
		cameraZoom = Math.min(cameraZoom, MAX_ZOOM);
		cameraZoom = Math.max(cameraZoom, MIN_ZOOM);

		UpdateCanvas();
	}
}

//#endregion

//#region COORDENATES TRANSFORMATION
function WtoS(wx, wy) {
	let sx = (wx + cameraOffset.x) * cameraZoom;
	let sy = (wy + cameraOffset.y) * cameraZoom;

	return [sx, sy];
}

function StoW(sx, sy) {
	let wx = sx / cameraZoom - cameraOffset.x;
	let wy = sy / cameraZoom - cameraOffset.y;

	return [wx, wy];
}
//#endregion

function GetControlPointPosition(startXPos, startYPos, endXPos, endYPos) {
	// Some math to have curve lines :)
	const xVectorCoordenate = endXPos - startXPos;
	const yVectorCoordenate = endYPos - startYPos;
	const distance = Math.sqrt(
		Math.pow(xVectorCoordenate, 2) + Math.pow(yVectorCoordenate, 2)
	);
	const radius = distance / 2;
	const angle = Math.asin((endYPos - startYPos) / distance);

	const xOffset = startXPos + xVectorCoordenate / 2;
	const yOffset = startYPos + yVectorCoordenate / 2;

	const controlPointXPos = xOffset + radius * Math.cos(angle - Math.PI / 2);
	const controlPointYPos = yOffset + radius * Math.sin(angle - Math.PI / 2);

	return [controlPointXPos, controlPointYPos];
}
