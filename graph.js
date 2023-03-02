const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth - 300;
canvas.height = window.innerHeight - 100;
canvas.style.border = "1px solid black";
const ctx = canvas.getContext("2d");
const nodes = [];



let RANGE = 100;
let isShowRange = false;
let isReadyForMassaging = false;
let isMaster = true;
let nodeNumber = 0;
let nodeSize = 20;

// Returns the distance between two points
function distanceBetween(node1, node2) {
	return Math.sqrt(
		Math.pow(node2.x - node1.x, 2) + Math.pow(node2.y - node1.y, 2)
	);
}

// Creates a new node object
function createNode(x, y) {
	const node = {
		x,
		y,
		connections: [],
		ismaster : isMaster,
		nodeNumber : nodeNumber,
		distance: Number.MAX_SAFE_INTEGER,
		previous: null,
		isCurrentlySelected: false,
	};
	nodes.push(node);
	nodeNumber++;
	return node;
}

// Adds a connection between two nodes
function connectNodes(node1, node2) {
	const weight = distanceBetween(node1, node2);
	node1.connections.push({node:node2, weight:weight});
	node2.connections.push({node:node1, weight:weight});
}
// Removes a connection between two nodes
function disconnectNodes(node1, node2) {
	const weight = distanceBetween(node1, node2);
	node1.connections = node1.connections.filter(connection => connection.node !== node2);
	node2.connections = node2.connections.filter(connection => connection.node !== node1);
}

// Draws a line between two nodes
function drawLine(node1, node2,) {
	ctx.beginPath();
	ctx.moveTo(node1.x, node1.y);
	ctx.lineTo(node2.x, node2.y);
	//display the distance between nodes in the middle of the line with black color
	ctx.strokeStyle = "black";
	ctx.fillStyle = "black";
	ctx.font = "20px Arial";

	ctx.fillText(Number.parseInt(distanceBetween(node1, node2)), (node1.x + node2.x) / 2, (node1.y + node2.y) / 2);

	ctx.stroke();
}

// Draws all nodes and connections
function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		ctx.beginPath();
		ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
		if (node.ismaster) {
			ctx.fillStyle = "red";
		} else if (node.isCurrentlySelected) {
			ctx.fillStyle = "green";
		}
		else {
			ctx.fillStyle = "yellow";
		}

		ctx.fill();
		ctx.strokeStyle = "black";
		ctx.fillStyle = "black";
		ctx.font = "20px Arial";
		ctx.fillText(node.nodeNumber, node.x - nodeSize/3, node.y + nodeSize/3);
		ctx.stroke();
		for (let j = 0; j < node.connections.length; j++) {
			const connection = node.connections[j];
			drawLine(node, connection.node);
		}
		if (isShowRange) {
			ctx.beginPath();
			ctx.arc(node.x, node.y, RANGE, 0, 2 * Math.PI);
			ctx.strokeStyle = "gray";
			ctx.setLineDash([5, 15]);
			ctx.stroke();
			ctx.setLineDash([]);
		}
	}
}

//Dijkstra's algorithm to find the shortest path for each node
function dijkstra() {
	console.log(nodes);
	let unvisitedNodes = [...nodes];
	let currentNode = unvisitedNodes[0];
	currentNode.distance = 0;
	while (unvisitedNodes.length > 0) {
		unvisitedNodes.sort((node1, node2) => node1.distance - node2.distance);
		currentNode = unvisitedNodes.shift();
		for (let i = 0; i < currentNode.connections.length; i++) {
			const connection = currentNode.connections[i];
			const node = connection.node;
			const weight = connection.weight;
			if (node.distance > currentNode.distance + weight) {
				node.distance = currentNode.distance + weight;
				node.previous = currentNode;
			}
		}
	}
	console.log(nodes);
}



// Moves a node to a new position
function moveNode(node, x, y) {
	node.x = x;
	node.y = y;
}

// Checks if a node is within range of another node
function isWithinRange(node1, node2) {
	return distanceBetween(node1, node2) <= RANGE;
}

// Handles mouse down events on the canvas
function handleMouseDown(event) {
	const x = event.offsetX;
	const y = event.offsetY;
	let nodeToMove = null;
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		if (distanceBetween(node, { x, y }) <= nodeSize) {
			if (isReadyForMassaging) {
				cascadeToMaster(node);
				return
			}else{
				nodeToMove = node;
				break;
			}
		}
	}
	if (nodeToMove) {
		canvas.addEventListener("mousemove", handleMouseMove);
		canvas.addEventListener("mouseup", handleMouseUp);
		function handleMouseMove(event) {
			moveNode(nodeToMove, event.offsetX, event.offsetY);
			draw();
		}
		function handleMouseUp(event) {
			canvas.removeEventListener("mousemove", handleMouseMove);
			canvas.removeEventListener("mouseup", handleMouseUp);
			draw();
		}
	} else {
		if(isMaster){
			createNode(x, y);
			isMaster = false;
			return;
		}else{
			createNode(x, y);
		}
		draw();
	}
}

//function to connect nodes within range 100
function connectNodesInRange() {
	for (let i = 0; i < nodes.length; i++) {
		const node1 = nodes[i];
		for (let j = i + 1; j < nodes.length; j++) {
			const node2 = nodes[j];
			if (isWithinRange(node1, node2)) {
				connectNodes(node1, node2);
			}else{
				disconnectNodes(node1, node2);
			}
		}
	}
}

// Handles toggle button click events
function handleToggleClick() {
	isShowRange = !isShowRange;
	draw();
}

// Handles range slider input events
function handleSlenderInput(event) {
	RANGE = event.target.value;
	draw();
}

// Animates the canvas
function animate() {
	requestAnimationFrame(animate);
	connectNodesInRange();
	draw();
}

// Handles massage button click events
function massageHandeler() {
	isReadyForMassaging = !isReadyForMassaging;
}
async function cascadeToMaster(node) {
	node.isCurrentlySelected = true;
	await sleep(1000);
	while (node.previous) {
		node.isCurrentlySelected = false;
		node = node.previous;
		node.isCurrentlySelected = true;
		await sleep(1000);
	}
	console.log("done");
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

canvas.addEventListener("mousedown", handleMouseDown);

const toggleButton = document.getElementById("toggle-button");
toggleButton.addEventListener("click", handleToggleClick);

const rangeSlider = document.getElementById("range-slider");
rangeSlider.addEventListener("input", handleSlenderInput);

const dijkstraBtn = document.getElementById("dijkstra");
dijkstraBtn.addEventListener("click", dijkstra);

const massage = document.getElementById("massage");
massage.addEventListener("click", massageHandeler);

animate();