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
public var parentCube:Cube;	//Used in Pathfinding, the shortest path is from the parentCube


public static var kLayerMask:int = 1 << 8;

enum CubeType{
	None,	// Cursor
	Dirt,	// 
	Minion,
	Water,
	Metal,
	Rock,
	Gear,
};

private static var typeOfCubes:int = 7;

// Need to be called before CubeManager Initialize
function Awake () {
	SnapToGrid();
	renderer.enabled = false;
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

function Start(){
	renderer.enabled = true;
	color = renderer.material.color;
}

function Update () {
	transform.position = Vector3(x * GRID_SIZE_X, y * GRID_SIZE_Y, z * GRID_SIZE_Z);

	if (isDestroyed){
		var targetColor:Color = Color(color.r, color.g, color.b, 0);
		var t:float = (Time.time - timeToStartDestroy)/destroyTime;
		renderer.material.color = Color.Lerp(color, targetColor, t);
		if (t >= 1){
			//renderer.enabled = false;
			Destroy(gameObject);			
		}
	}
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
	return true;
}

// Override by subclass
function CanPass():boolean{
	return true;
}

private var timeToStartDestroy:float;
private var destroyTime:float = 0.3;

function Delete(){
	isDestroyed = true;
	timeToStartDestroy = Time.time;
	renderer.material.shader = Shader.Find("Transparent/Diffuse");	
}


private var distanceYPenalty:float = 5;
private var distanceXPenalty:float = 1.0001;

function Distance(c:Cube):float{
	// Manhattan Distance
	return Mathf.Abs(c.x - x) * distanceXPenalty + Mathf.Abs(c.y - y) * distanceYPenalty + Mathf.Abs(c.z - z);
}

private var color:Color;

function SetColor(c:Color){
	print("CubeColor: " + c.ToString());
	color = c;
	renderer.material.color = c;
}

static function TypeWithString(s:String):CubeType{
	for (var i:int = 0; i < typeOfCubes; i++){
		if (System.Enum.GetNames(typeof(CubeType))[i] == s)
			return i;
	}


	/*

	if (s == "Dirt"){
		return CubeType.Dirt;
	}
	if (s == "Minion"){
		return CubeType.Minion;
	}
	if (s == "Water"){
		return CubeType.Water;
	}
	if (s == "Gear")
		return CubeType.Gear;

	*/

	Debug.LogError("Wrong Cube Type: " + s);

	return CubeType.None;
}