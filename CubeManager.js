#pragma strict

public var minX:float;
public var maxX:float;
public var minY:float;
public var maxY:float;
public var minZ:float;
public var maxZ:float;

private var cubes:Array;

function Start () {
	cubes = FindObjectsOfType(Cube);
	CalculateBoundingBox();
}

function Update () {

}


// TODO: Create Prefab instance
function AddCubeAt(x:int, y:int, z:int, type:CubeType){
}

function CalculateBoundingBox(){
	for (var c:Cube in cubes) {
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

