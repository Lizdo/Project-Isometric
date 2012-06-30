#pragma strict

public var minX:float;
public var maxX:float;
public var minY:float;
public var maxY:float;
public var minZ:float;
public var maxZ:float;

private var cubes:Array;
private var isDirty:boolean;

private var cursor:Cube;

function Start () {
	cubes = FindObjectsOfType(Cube);
	cursor = Instantiate(Resources.Load("Cursor", GameObject)).GetComponent(Cube);
	cursor.Hide();
	AddCubeAt(2,2,2,CubeType.Dirt);
	AddCubeAt(2,2,3,CubeType.Dirt);	
	AddCubeAt(2,2,4,CubeType.Water);		
	isDirty = true;
	print("Cube Manager Initiated");
}

function Update () {
	if (isDirty){
		CalculateBoundingBox();
		isDirty = false;
	}
}


// TODO: Create Prefab instance
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
}

function CubeTouched(c:Cube){
	if (!c)
		return;

	if (FindCubeAt(c.x, c.y+1, c.z)){
		cursor.Hide();
		return;
	}

	cursor.SetXYZ(c.x, c.y + 1, c.z);	
	cursor.Show();
}

function CubeReleased(c:Cube){
	cursor.Hide();

	if (!c)
		return;

	AddCubeAt(c.x, c.y + 1, c.z, CubeType.Dirt);
	
}

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

