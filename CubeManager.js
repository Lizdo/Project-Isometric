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
private var isDirty:boolean;
private var cameraManager:CameraManager;

private var cursor:Cube;

function Start () {
	cameraManager = GetComponent(CameraManager);
	cubes = FindObjectsOfType(Cube);
	cursor = Instantiate(Resources.Load("Cursor", GameObject)).GetComponent(Cube);
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
		if (FindCubeAt(c.x, c.y, c.z)){
			cursor.SetXYZ(c.x, c.y, c.z);
		}else{
			cursor.Hide();
		}
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
// Helper functions
///////////////////////////

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

