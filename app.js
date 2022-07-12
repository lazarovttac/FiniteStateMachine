const nodeRadius = 25;

let canvasWidth = 0;
let canvasHeight = 0;

// Internal states of the machine
let states = [
    {
        xPos: 100,
        yPos: 100,
        transitions: [
            1,
            2,
        ],
    },
    {
        xPos: 350,
        yPos: 250,
        transitions: [0],
    },
    {
        xPos: 100,
        yPos: 500,
        transitions: [],
    },
    {
        xPos: 500,
        yPos: 100,
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
            if(utils.circlePointCollision(x, y, node)) {
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
    
            states[dragging].xPos = x;
            states[dragging].yPos = y;

            context.clearRect(0, 0, canvasWidth, canvasHeight);
            UpdateTransitionLines(context);
            DrawNodes(context);
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
            DrawNodes(context);
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
    states.forEach(node => {
        let circle = new Circle(node.xPos, node.yPos, nodeRadius, "#9E6240", "#DEA47E", 5);
        nodes.push(circle);
        circle.Draw(context);
    });
}

function DrawTransitionLines(context) {
    // Drawing a line for each transition from each node
    transitions.splice(0, transitions.length);
    states.forEach((node, index) => {
        node.transitions.forEach(otherIndex => {
            const other = states[otherIndex];
            let line = new Transition(index, otherIndex, node.xPos, node.yPos, other.xPos, other.yPos);
            transitions.push(line);
            line.Draw(context);
        });
    });
}

function UpdateTransitionLines(context) {
    // Drawing a line for each transition from each node
    let index = 0;
    transitions.forEach(transition => {
        UpdateTransitionLine(transition);
        transition.Draw(context);

        index++;
    });
}

function UpdateTransitionLine(transition) {
    let startNode = nodes[transition.startNodeIndex];
    let endNode = nodes[transition.endNodeIndex];

    transition.startXPos = startNode.x;
    transition.startYPos = startNode.y;
    transition.endXPos = endNode.x;
    transition.endYPos = endNode.y;
}
