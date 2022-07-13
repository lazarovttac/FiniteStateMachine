const nodeFont = '10px arial';
const nodeRadius = 20;
const nodeFill = "#9E6240";
const nodeStroke = "#DEA47E";
const textColor = "#FFF";

class Circle {
    constructor(xPos, yPos, radius, fillColor, strokeColor, strokeWidth) {
        this.x = xPos;
        this.y = yPos;
        this.radius = radius;
        this.fillColor = fillColor;
        this.strokeColor = strokeColor;
        this.strokeWidth = strokeWidth;
    }

    Draw(context) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.lineWidth = this.strokeWidth;
        context.strokeStyle = this.strokeColor;
        context.stroke();
        context.fillStyle = this.fillColor;
        context.fill();
        context.closePath();
    }
}

class Node {
    constructor(xPos, yPos, name) {
        this.x = xPos;
        this.y = yPos;
        this.name = name;
        this.circle;
    }

    Draw(context) {
        if(this.circle == undefined) {
            this.circle = new Circle(this.x, this.y, nodeRadius, nodeFill, nodeStroke, 5);
        } else {
            this.circle.x = this.x;
            this.circle.y = this.y;
        }
        this.circle.Draw(context);

        context.font = nodeFont;
        context.fillStyle = textColor;
        context.fillText(this.name, this.x, this.y);
    }
}

class Transition {
    constructor(startNodeIndex, endNodeIndex, startXPos, startYPos, endXPos, endYPos) {
        this.startNodeIndex = startNodeIndex;
        this.endNodeIndex = endNodeIndex;

        this.startXPos = startXPos;
        this.startYPos = startYPos;
        this.endXPos = endXPos;
        this.endYPos = endYPos;
        this.handle;
    }

    Draw(context) {
        context.beginPath();
        context.moveTo(this.startXPos, this.startYPos);

        let controlPointXPos, controlPointYPos;

        if(this.handle == undefined) {
            [controlPointXPos, controlPointYPos] = this.GetControlPointPosition();
        } else {
            controlPointXPos = this.handle.x;
            controlPointYPos = this.handle.y;
        }
       
        // Line rendering
        context.quadraticCurveTo(controlPointXPos, controlPointYPos, this.endXPos, this.endYPos);
        context.lineWidth = 2;
        context.strokeStyle = "white";
        context.stroke();
        context.closePath();

        // Control point/Handle rendering
        if(this.handle == undefined) {
            this.handle = new Circle(controlPointXPos, controlPointYPos, 10, "white", "white", 0);
        }
        this.handle.Draw(context);
    }

    GetControlPointPosition() {
        // Some math to have curve lines :)
        const xVectorCoordenate = this.endXPos - this.startXPos;
        const yVectorCoordenate = this.endYPos - this.startYPos;
        const distance = Math.sqrt(Math.pow(xVectorCoordenate, 2) + Math.pow(yVectorCoordenate, 2));
        const radius = distance / 4;
        const angle = Math.asin((this.endYPos - this.startYPos) / distance);

        const xOffset = this.startXPos + xVectorCoordenate / 2;
        const yOffset = this.startYPos + yVectorCoordenate / 2;
        
        const controlPointXPos = xOffset + radius * Math.cos(angle - (Math.PI / 2));
        const controlPointYPos = yOffset + radius * Math.sin(angle - (Math.PI / 2));

        return [controlPointXPos, controlPointYPos];
    }
}

