const nodeFont = '12px arial';
const nodeRadius = 20;

const nodeFill = "#222";
const nodeStroke = "#fff";

const transitionLineColor = "#fff";

const controlPointFill = "rgba(0, 0, 0, 0)";
const controlPointStroke = "rgba(0, 0, 0, 0)";
const symbolsTextPadding = (3/2);

const arrowLength = 10;
const arrowWidth = 5;
const arrowColor = "#FFF";

const textColor = "#FFF";

class Rectangle {
    constructor(xPos, yPos, width, height, fillColor, strokeColor, strokeWidth) {
        this.x = xPos;
        this.y = yPos;
        
        this.width = width;
        this.height = height;

        this.fillColor = fillColor;
        this.strokeColor = strokeColor;
        this.strokeWidth = strokeWidth;
    }

    Draw(context) {
        context.beginPath();
        context.lineWidth = this.strokeWidth;
        context.strokeStyle = this.strokeColor;
        context.fillStyle = this.fillColor;

        context.rect(this.x - (this.width / 2), this.y - (this.height / 2), this.width, this.height);

        context.stroke();
        context.fill();
    }
}

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
        context.textAlign = "center";
        context.fillStyle = textColor;
        context.fillText(this.name, this.x, this.y + 4);
    }
}

class TransitionLine {
    constructor(startNodeIndex, endNodeIndex, startXPos, startYPos, endXPos, endYPos, symbols) {
        this.startNodeIndex = startNodeIndex;
        this.endNodeIndex = endNodeIndex;

        this.symbols = symbols;
        this.startXPos = startXPos;
        this.startYPos = startYPos;
        this.endXPos = endXPos;
        this.endYPos = endYPos;
        this.handle;
        this.symbolsText;
    }

    Draw(context) {
        this.symbolsText = this.symbols.join(", ");

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
        context.strokeStyle = transitionLineColor;
        context.stroke();
        context.closePath();

        // Control point/Handle rendering
        if(this.handle == undefined) {
            this.handle = new Rectangle(controlPointXPos, controlPointYPos, context.measureText(this.symbolsText).width * symbolsTextPadding, 30, controlPointFill, controlPointStroke, 0);
        }
        this.handle.Draw(context);
        
        this.DrawSymbols(context, controlPointXPos, controlPointYPos);
        
        // Arrow rendering
        let [dx, dy] = utils.vector(this.endXPos, this.endYPos, this.handle.x, this.handle.y);
        let distance = utils.distanceXY(this.endXPos, this.endYPos, this.handle.x, this.handle.y);
        let dxn = dx / distance;
        let dyn = dy / distance;

        let x = this.endXPos - (dxn * (nodeRadius + arrowLength));
        let y = this.endYPos - (dyn * (nodeRadius + arrowLength));
        
        let arrow = new Arrow(x, y, Math.atan2(dy, dx), arrowLength, arrowWidth, arrowColor);
        arrow.Draw(context);

    }

    DrawSymbols(context, controlPointXPos, controlPointYPos) {
        context.font = nodeFont;
        context.textAlign = "center";
        context.fillStyle = textColor;
        context.fillText(this.symbolsText, controlPointXPos, controlPointYPos);
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

class Arrow {
    constructor(xPos, yPos, angle, length, width, color) {
        this.x = xPos;
        this.y = yPos;

        this.angle = angle;
        this.length = length;
        this.width = width;
        this.color = color;
    }

    Draw(context) {
        let v1x, v1y, v2x, v2y, v3x, v3y;
        
        v1x = this.x + Math.cos(this.angle - (Math.PI / 2)) * (this.width / 2);
        v1y = this.y + Math.sin(this.angle  - (Math.PI / 2)) * (this.width / 2);
        
        v2x = this.x + Math.cos(this.angle) * (this.length);
        v2y = this.y + Math.sin(this.angle) * (this.length);
        
        v3x = this.x + Math.cos((Math.PI / 2) + this.angle) * (this.width / 2);
        v3y = this.y + Math.sin((Math.PI / 2) + this.angle) * (this.width / 2);
        
        context.beginPath();
        context.moveTo(this.x, this.y);
        context.lineTo(v1x, v1y);
        context.lineTo(v2x, v2y);
        context.lineTo(v3x, v3y);
        context.lineTo(this.x, this.y);

        context.lineWidth = 2;
        context.strokeStyle = this.color;
        context.fillStyle = this.color;
        context.fill();
        context.stroke();
        context.closePath();
    }
}


// NO ANGLE
// context.moveTo(this.x - this.length / 2, this.y - this.width / 2);
// context.lineTo(this.x - this.length / 2, this.y + this.width);
// context.lineTo(this.x + this.length / 2, this.y);
// context.lineTo(this.x - this.length / 2, this.y - this.width / 2);