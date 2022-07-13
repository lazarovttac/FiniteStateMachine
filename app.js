let canvasWidth = 0;
let canvasHeight = 0;

// Internal states of the machine
let states = [
    {
        name: "0",
        x: 100,
        y: 100,
        transitions: [
            1, 2
        ],
    },
    {
        name: "1",
        x: 100,
        y: 400,
        transitions: [],
    },
    {
        name: "2",
        x: 400,
        y: 400,
        transitions: [],
    },
    {
        name: "3",
        x: 100,
        y: 400,
        transitions: [],
    },
]

// Actual elements rendered on the canvas
let nodes = []
let transitions = []

window.addEventListener("load", () => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    canvas.width = window.innerWidth - 50;
    canvas.height = window.innerHeight - 50;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

   // canvas.addEventListener( 'wheel', (e) => adjustZoom(e.deltaY*SCROLL_SENSITIVITY))
    
    let dragging = -1;
    
    DrawTransitionLines(context);
    DrawNodes(context);

    document.body.addEventListener("mousedown", handleClickEvent);
    document.body.addEventListener("mouseup", onMouseUp);
        
    function handleClickEvent(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        if(ClickedNode(x, y)) {
            document.body.addEventListener("mousemove", moveNode);
        } else if(ClickedControlPoint(x, y)) {
            document.body.addEventListener("mousemove", moveControlPoint);
        }
    }

    function ClickedNode(x, y) {
        nodes.forEach((node, index) => {
            if(utils.circlePointCollision(x, y, node.circle)) {
                dragging = index;
            } 
        });
        return dragging != -1;
    }

    function ClickedControlPoint(x, y) {
        transitions.forEach((transition, index) => {
            if(utils.circlePointCollision(x, y, transition.handle)) {
                dragging = index;
            } 
        });
        return dragging != -1;
    }

    function moveNode(event) {
        console.log("Moving node: ", dragging);

        if(dragging != -1) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
    
            states[dragging].x = x;
            states[dragging].y = y;

            context.clearRect(0, 0, canvasWidth, canvasHeight);
            UpdateTransitionLines(context);
            UpdateNodes(context);
        }

    }
    
    function moveControlPoint(event) {
        console.log("Moving control point ", dragging);

        if(dragging != -1) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
    
            transitions[dragging].handle.x = x;
            transitions[dragging].handle.y = y;

            context.clearRect(0, 0, canvasWidth, canvasHeight);
            UpdateTransitionLines(context);
            UpdateNodes(context);
        }

    }

    function onMouseUp(event) {
        console.log("STOP");
        dragging = -1;
        document.body.removeEventListener("mousemove", moveNode);
        document.body.removeEventListener("mousemove", moveControlPoint);
    }

})

function DrawNodes(context) {
    // Drawing a circle for each node
    nodes.splice(0, nodes.length);
    states.forEach(state => {
        let node = new Node(state.x, state.y, state.name);
        nodes.push(node);
        node.Draw(context);
    });
}

function UpdateNodes(context) {
    // Drawing a circle for each node
    nodes.forEach((node, index) => {
        node.x = states[index].x;
        node.y = states[index].y;
        node.Draw(context);
    });
}

function DrawTransitionLines(context) {
    // Drawing a line for each transition from each node
    transitions.splice(0, transitions.length);
    states.forEach((state, index) => {
        state.transitions.forEach(otherIndex => {
            const other = states[otherIndex];
            let transition = new Transition(index, otherIndex, state.x, state.y, other.x, other.y);
            transitions.push(transition);
            transition.Draw(context);
        });
    });
}

function UpdateTransitionLines(context) {
    // Drawing a line for each transition from each node
    transitions.forEach(transition => {
        UpdateTransitionLine(transition);
        transition.Draw(context);
    });
}

function UpdateTransitionLine(transition) {
    let startNode = states[transition.startNodeIndex];
    let endNode = states[transition.endNodeIndex];

    transition.startXPos = startNode.x;
    transition.startYPos = startNode.y;
    transition.endXPos = endNode.x;
    transition.endYPos = endNode.y;
}
