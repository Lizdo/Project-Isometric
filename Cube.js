#pragma strict

public var x:int;
public var y:int;
public var z:int;

public var type:CubeType;

enum CubeType{
	CubeTypeNone,
	CubeTypeDirt,
	CubeTypeGrass,
	CubeTypeWater,
};

// Need to be called before CubeManager Initialize
function Awake () {
	InitializeOnGrid();
}

public static var GRID_SIZE_X:float = 10.0;
public static var GRID_SIZE_Y:float = 5.0;
public static var GRID_SIZE_Z:float = 10.0;

function InitializeOnGrid(){
	x = Mathf.Round(transform.position.x/GRID_SIZE_X);
	y = Mathf.Round(transform.position.y/GRID_SIZE_Y);	
	z = Mathf.Round(transform.position.z/GRID_SIZE_Z);	
	transform.position = Vector3(x * GRID_SIZE_X,y * GRID_SIZE_Y,z * GRID_SIZE_Z);
}

function Update () {

}