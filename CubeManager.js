#pragma strict

import Operation;

public var minX:float;
public var maxX:float;
public var minY:float;
public var maxY:float;
public var minZ:float;
public var maxZ:float;

public var currentAction:String;

private var cubes:Array;
private var minions:Array;
private var isDirty:boolean;
private var cameraManager:CameraManager;

private var cursor:Cube;
private var log:GUIText;

function Awake(){
	cameraManager = GetComponent(CameraManager);
	cubes = FindObjectsOfType(Cube);
	minions = FindObjectsOfType(Minion);

	log = GameObject.Find("Log").GetComponent(GUIText);
	cursor = Instantiate(Resources.Load("Cursor", GameObject)).GetComponent(Cube);	
}

function Start () {
	cursor.Hide();
	AddCubeAt(2,2,2,CubeType.Dirt);
	AddCubeAt(2,2,3,CubeType.Dirt);	
	AddCubeAt(2,2,4,CubeType.Water);		
	isDirty = true;
	currentAction = "Dirt";
	print("Cube Manager Initiated");
}

function Update () {
	if (isDirty){
		CalculateBoundingBox();
		isDirty = false;
	}
}


///////////////////////////
// Undo/Redo Support
///////////////////////////


private var undoQueue:Array = new Array();
private var redoQueue:Array = new Array();

function AddCubeOperation(x:int, y:int, z:int, t:CubeType){
	var o:Operation = new Operation(OperationType.Add,
		x,y,z,t);
	undoQueue.push(o);
	ExecuteOperation(o);
	redoQueue.clear();
}

function RemoveCubeOperation(x:int, y:int, z:int){
	var t:CubeType = FindCubeAt(x,y,z).type;
	var o:Operation = new Operation(OperationType.Remove,
		x,y,z,t);
	undoQueue.push(o);
	ExecuteOperation(o);
	redoQueue.clear();	
}

function ExecuteOperation(o:Operation){
	o.print();

	if (o.action == OperationType.Add){
		AddCubeAt(o.x,o.y,o.z,o.type);
	}else if (o.action == OperationType.Remove){
		RemoveCubeAt(o.x, o.y, o.z);
	}

	for (var m:Minion in minions){
		m.needRecalculatePathfinding = true;
	}
}

function Undo(){
	if (undoQueue.length == 0){
		return;
	}

	var o:Operation = undoQueue.pop();
	redoQueue.Add(o);

	ExecuteOperation(o.Revert());
}

function Redo(){
	if(redoQueue.length == 0){
		return;
	}

	var o:Operation = redoQueue.pop();
	undoQueue.Add(o);

	ExecuteOperation(o);
}


///////////////////////////
// Basic Operations
///////////////////////////



// Never call this directly!!
function AddCubeAt(x:int, y:int, z:int, type:CubeType){
	var g:GameObject;
	switch(type){
		case CubeType.Dirt:
			g = Instantiate(Resources.Load("CubeDirt", GameObject));
			break;
		case CubeType.Water:
			g = Instantiate(Resources.Load("CubeWater", GameObject));
			break;
		case CubeType.Grass:
			g = Instantiate(Resources.Load("CubeGrass", GameObject));
			break;
	}
	var c:Cube = g.GetComponent(Cube);
	c.x = x;
	c.y = y;
	c.z = z;
	cubes.Add(c);
	isDirty = true;
	cameraManager.isDirty = true;
}


// Never call this directly!!
function RemoveCubeAt(x:int, y:int, z:int){
	for (var i = cubes.length - 1; i >= 0; i--) {
		var c:Cube = cubes[i];
		if (c.type == CubeType.None)
			continue;
		if (c.x == x && c.y == y && c.z == z){
			if (!c.CanDelete())
				return;
			cubes.RemoveAt(i);
			c.Delete();
			return;
		}
	}
}


public static var kActionDelete:String = "Delete";

///////////////////////////
// Input Callback
///////////////////////////

function CubeTouched(c:Cube, n:Vector3){
	if (!c)
		return;

	if (currentAction == kActionDelete){
		cursor.SetXYZ(c.x, c.y, c.z);
		cursor.Show();
		return;
	}

	if (FindCubeAt(c.x+n.x, c.y+n.y, c.z+n.z)){
		cursor.Hide();
		return;
	}

	cursor.SetXYZ(c.x+n.x, c.y+n.y, c.z+n.z);	
	cursor.Show();
}

function CubeReleased(c:Cube){
	cursor.Hide();

	if (!c)
		return;

	if (currentAction == kActionDelete && FindCubeAt(cursor.x, cursor.y, cursor.z)){
		RemoveCubeOperation(cursor.x, cursor.y, cursor.z);
	}

	if (currentAction != kActionDelete && !FindCubeAt(cursor.x, cursor.y, cursor.z)){
		AddCubeOperation(cursor.x, cursor.y, cursor.z, Cube.TypeWithString(currentAction));	
	}
	
}

///////////////////////////
// Pathfinding
///////////////////////////

private var OpenList:Array;
private var ClosedList:Array;
private var AvailableList:Array;


function PathfindGreed(start:Cube, end:Cube):Cube{
	var a:Array = AdjucentCubes(start);
	a.Push(start);
	var distance:float = 1000;
	var nextCube:Cube;
	for (var c:Cube in a){
		if (c.Distance(end) < distance){
			distance = c.Distance(end);
			nextCube = c;			
		}
	}
	print("Pathfinding Complete, next Cube:" + nextCube.ToString());
	return nextCube;
}

function PathfindAStar(start:Cube, end:Cube):Cube{
	if (start == end)
		return end;

	var startTime:float = Time.time;
	
	if (start.y != end.y){
		print("Starting and ending cube are not on the same height!");

		// Allow moving to the closest y
		//return null;
	}

	AvailableList = AvailableCubeWithSameHeight(start);
	OpenList = new Array();
	ClosedList = new Array();
	var pathFound:boolean = false;

	// 1) Add the starting square (or node) to the open list.
	OpenList.Add(start);
	start.G = 0;

	// 2) Repeat the following:
	while(1){
		//	a) Look for the lowest F cost square on the open list. 
		//		We refer to this as the current square.
		var currentCube:Cube = CubeWithLowestFInOpenList();

		//	b) Switch it to the closed list.
		ClosedList.Add(currentCube);
		RemoveObjectFromArray(currentCube, OpenList);

		
		//c) For each of the 4 squares adjacent to this current square …
		var adjucentCubes:Array = AdjucentCubes(currentCube);
		for (var c:Cube in adjucentCubes){

			// If it is not walkable or if it is on the closed list, ignore it. 
			if (!Available(c))
				continue;

			if (ObjectInArray(c, ClosedList))
				continue;

			// Otherwise do the following.           

			// If it isn’t on the open list, add it to the open list.
			// Make the current square the parent of this square. 
			// Record the F, G, and H costs of the square. 
			if (!ObjectInArray(c, OpenList)){
				OpenList.Add(c);
				c.parentCube = currentCube;
				c.G = currentCube.G + 1;
				c.H = end.Distance(c);
				c.F = c.G + c.H;
			}else{
				// If it is on the open list already, check to see if this path to that square is better,
				// using G cost as the measure. A lower G cost means that this is a better path.
				// If so, change the parent of the square to the current square,
				// and recalculate the G and F scores of the square.
				// If you are keeping your open list sorted by F score,
				// you may need to resort the list to account for the change.
				if (currentCube.G + 1 < c.G){
					c.parentCube = currentCube;
					c.G = currentCube.G + 1;
					c.H = end.Distance(c);
					c.F = c.G + c.H;
				}
			}
		}

		// d) Stop when you:

		//	Add the target square to the closed list, in which case the path has been found (see note below), or
		//	Fail to find the target square, and the open list is empty. In this case, there is no path.  		

		if (currentCube == end){
			print("Path Found!");
			pathFound = true;
			break;
		}

		if (OpenList.length == 0){
			print("Path Not Found!");
			break;
		}
		
	}

	var endTime:float = Time.time;
	Log((endTime - startTime).ToString());

	var pathArray =  new Array();
	var c:Cube;

	// Go back to find the full path
	if (pathFound){
		c = end;
		while(1){
			// Add c to the beginning of the return list
			pathArray.Unshift(c);

			// If trying to climb? Clear the array
			if (c.y != c.parentCube.y){
				pathArray.clear();
			}
			c = c.parentCube;

			if (c == start)
				break;
		}
		PrintPath(pathArray);
		return pathArray[0];
	}

	// Pathfinding Failed, return cube closest to target
	c = ClosestToTargetCubeInClosedList(end);

	// Rather not move if not helping with the distance
	if (end.Distance(c) >= end.Distance(start))
		return null;

	if (!c || !c.parentCube)
		return null;

	// Go back to find the full path
	while(1){
		pathArray.Unshift(c);
		c = c.parentCube;
		if (c == start)
			break;
	}

	if (pathArray.length != 0)
		return pathArray[0];


	return null;

}

function Log(s:String){
	if (log){
		log.text = s;
	}
}

function AvailableCubeWithSameHeight(startCube:Cube):Array{
	var a:Array = new Array();
	for (var c:Cube in cubes){
		if (c.y == startCube.y && Available(c)){
			a.push(c);
		}
	}
	return a;
}

function CubeWithLowestFInOpenList(){
	var lowestF:float = 10000;
	var lowestFCube:Cube;
	for (var c:Cube in OpenList){
		if (c.F < lowestF){
			lowestFCube = c;
			lowestF = c.F;
		}
	}
	return lowestFCube;
}

function ClosestToTargetCubeInClosedList(end:Cube):Cube{
	var closestCube:Cube;
	var distance:float = 1000;
	for (var c:Cube in ClosedList){
		if (c.Distance(end) < distance){
			closestCube = c;
			distance = c.Distance(end);
		}
	}
	return closestCube;
}

function RemoveObjectFromArray(o:Object, a:Array){
	for (var i:int = 0; i < a.length; i++){
		if (a[i] == o){
			a.RemoveAt(i);
			return;
		}
	}
}

function ObjectInArray(o:Object, a:Array):boolean{
	for (var i:int = 0; i < a.length; i++){
		if (a[i] == o){
			return true;
		}
	}
	return false;
}

function PrintPath(a:Array){
	for (var i:int = 0; i < a.length; i++){
		var c:Cube = a[i];
		print("Node " + i.ToString()
		 + ": x: " + c.x.ToString()
		+ ": y: " + c.y.ToString()
		+ ": z: " + c.z.ToString());
	}
}


///////////////////////////
// Helper functions
///////////////////////////

function AvailableMinion():Minion{
	for (var m:Minion in minions){
		if (m.state != MinionState.Victory)
			return m;
	}
	return null;
}

function RandomCube():Cube{
	return cubes[0];
}

// Find cube with id x, y, z
function FindCubeAt(x:int, y:int, z:int):Cube{
	for (var c:Cube in cubes) {
		if (c.type == CubeType.None)
			continue;
		if (c.x == x && c.y == y && c.z == z){
			return c;
		}
	}
	return null;
}


function ClearCubeAbove(c:Cube):Cube{
	while (1){
		var cubeAbove:Cube = CubeAbove(c);
		if (cubeAbove == null)
			return c;
		c = cubeAbove;
	}
	print("Should Never Go Here");
	return null;
}

private var MAX_STEP_Y = 100;

function ClearCubeBelow(c:Cube):Cube{
	for (var i:int = 0; i < MAX_STEP_Y; i++){
		var cubeBelow:Cube = FindCubeAt(c.x, c.y-1, c.z);
		if(cubeBelow)
			return cubeBelow;
	}
	return null;
}

function CubeAbove(c:Cube):Cube{
	return FindCubeAt(c.x, c.y+1, c.z);
}

function CubeBelow(c:Cube):Cube{
	return FindCubeAt(c.x, c.y-1, c.z);
}


// Find cube at real world position p
function FindCubeAtPosition(p:Vector3):Cube{
	var v:Vector3 = Cube.SnapPositionToGrid(p);
	return FindCubeAt(Mathf.Floor(v.x), Mathf.Floor(v.y), Mathf.Floor(v.z));
}

function Available(c:Cube):boolean{
	if (!c.Passable())
		return false;
	if (CubeAbove(c))
		return false;
	return true;
}

function AdjucentCubes(c:Cube):Array{
	if (!c)
		return null;

	var a:Array = new Array();
	var offset = [
		[-1,0,0],
		[1,0,0],
		[0,0,-1],
		[0,0,1]
	];

	for (var i:int = 0; i <4 ; i++){
		var neighbour:Cube = FindCubeAt(c.x + offset[i][0],
			c.y + offset[i][1],
			c.z + offset[i][2]);
		if (neighbour && Available(neighbour)){
			a.push(neighbour);
		}
	}

	return a;
}

function CalculateBoundingBox(){
	for (var c:Cube in cubes) {
		if (c.type == CubeType.None)
			continue;
		if (c.x < minX)
			minX = c.x;
		if (c.y < minY)
			minY = c.y;
		if (c.z < minZ)
			minZ = c.z;
		if (c.x > maxX)
			maxX = c.x;
		if (c.y > maxY)
			maxY = c.y;
		if (c.z > maxZ)
			maxZ = c.z;
	};
}

function BoundingBox():Bounds{
	var b:Bounds;
	b.SetMinMax(Vector3(minX*Cube.GRID_SIZE_X, minY*Cube.GRID_SIZE_Y, minZ*Cube.GRID_SIZE_Z), 
		Vector3(maxX*Cube.GRID_SIZE_X, maxY*Cube.GRID_SIZE_Y, maxZ*Cube.GRID_SIZE_Z));
	return b;
}

