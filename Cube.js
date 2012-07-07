#pragma strict

public var x:int;
public var y:int;
public var z:int;

public var type:CubeType;
public var isDestroyed:boolean = false;


// Used by pathfinding
public var F:float;
public var G:float;
public var H:float;
public var parentCube:Cube;


public static var kLayerMask:int = 1 << 8;

enum CubeType{
	None,
	Dirt,
	Grass,
	Water,
};

// Need to be called before CubeManager Initialize
function Awake () {
	SnapToGrid();
}

public static var GRID_SIZE_X:float = 10.0;
public static var GRID_SIZE_Y:float = 5.0;
public static var GRID_SIZE_Z:float = 10.0;

function SnapToGrid(){
	x = Mathf.Round(transform.position.x/GRID_SIZE_X);
	y = Mathf.Round(transform.position.y/GRID_SIZE_Y);	
	z = Mathf.Round(transform.position.z/GRID_SIZE_Z);	
}

public static function SnapPositionToGrid(v:Vector3):Vector3{
	var x:int = Mathf.Round(v.x/GRID_SIZE_X);
	var y:int = Mathf.Round(v.y/GRID_SIZE_Y);	
	var z:int = Mathf.Round(v.z/GRID_SIZE_Z);

	return Vector3(x,y,z);
}

function Update () {
	transform.position = Vector3(x * GRID_SIZE_X, y * GRID_SIZE_Y, z * GRID_SIZE_Z);
}

function SetXYZ(newx:int, newy:int, newz:int){
	x = newx;
	y = newy;
	z = newz;
	transform.position = Vector3(x * GRID_SIZE_X, y * GRID_SIZE_Y, z * GRID_SIZE_Z);
}

function Hide(){
	renderer.enabled = false;
}

function Show(){
	renderer.enabled = true;
}

function SurfaceY():float{
	return transform.position.y + GRID_SIZE_Y/2;
}

function SurfacePosition():Vector3{
	return Vector3(transform.position.x, SurfaceY(), transform.position.z);
}


function CanDelete():boolean{
	if (type == CubeType.Grass)
		return false;
	return true;
}

function Passable():boolean{
	if (type == CubeType.Water)
		return false;
	return true;
}

function Delete(){
	isDestroyed = true;
	renderer.enabled = false;
	yield WaitForSeconds(0.5);
	Destroy(gameObject);
}


private var distanceYPenalty:float = 5;
private var distanceXPenalty:float = 1.0001;

function Distance(c:Cube):float{
	// Manhattan Distance
	return Mathf.Abs(c.x - x) * distanceXPenalty + Mathf.Abs(c.y - y) * distanceYPenalty + Mathf.Abs(c.z - z);
}

static function TypeWithString(s:String):CubeType{
	if (s == "Dirt"){
		return CubeType.Dirt;
	}
	if (s == "Grass"){
		return CubeType.Grass;
	}
	if (s == "Water"){
		return CubeType.Water;
	}

	print("Warning: Wrong Cube Type???");
	return CubeType.None;
}