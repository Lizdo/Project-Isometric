#pragma strict

public var x:int;
public var y:int;
public var z:int;

public var type:CubeType;
public var resourceType:ResourceType;

// If the cube is pending to be destroyed, just playing the death animation
public var isDestroyed:boolean;

// Un powered cube cannot be interacted
public var isPowered:boolean;

// If the player can use the delete this cube
public var isDeletable:boolean;

// If minion can walk on it
public var isPassable:boolean;

// Calculated
public var size:int;

// Used by pathfinding
public var F:float;
public var G:float;
public var H:float;
public var parentCube:Cube;	//Used in Pathfinding, the shortest path is from the parentCube

private var initialMaterial:Material;

private var cubeManager:CubeManager;

public static var kLayerMask:int = 1 << 8;

enum CubeType{
	None,	// Cursor

	// Old Build System
	Dirt,	// 
	Minion,
	Water,
	Metal,
	Rock,
	Gear,
	Spawner,

	// New Build System
	Spark,
	Electricity,
	Wire,
	Core,

};


// Resource Type is used by the player as in-game resource, multiple types of cube can generate the same resource type when deleted

enum ResourceType{
	None,

	// Old Build System
	Dirt,
	Gear,

	// New Build System 
	Electricity,
	Water,
	Plant,
}

private static var typeOfCubes:int = 7;

// Need to be called before CubeManager Initialize
function Awake () {
	SnapXYZToGrid();
	renderer.enabled = false;
	cubeManager = FindObjectOfType(CubeManager);
}

public static var GRID_SIZE_X:float = 10.0;
public static var GRID_SIZE_Y:float = 5.0;
public static var GRID_SIZE_Z:float = 10.0;

function SnapXYZToGrid(){
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

public static function GridScale():Vector3{
	return Vector3(GRID_SIZE_X, GRID_SIZE_Y, GRID_SIZE_Z);
}

function Start(){
	transform.position = Vector3(x * GRID_SIZE_X, y * GRID_SIZE_Y, z * GRID_SIZE_Z);	
	renderer.enabled = true;
	initialMaterial = renderer.material;
}

function Update () {
	transform.position = Vector3(x * GRID_SIZE_X, y * GRID_SIZE_Y, z * GRID_SIZE_Z);

	if (cubeManager.type == LevelType.Build){
		UpdateBuild();
	}

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

function UpdateBuild(){
	if (!isPowered){
		renderer.material = cubeManager.UnpoweredMaterial();
	}else{
		renderer.material = initialMaterial;
	}
}

function PowerRadius(){
	return Mathf.Pow(size+1, 2);
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
	return isDeletable;
}

function CanPass():boolean{
	return isPassable;
}

private var timeToStartDestroy:float;
private var destroyTime:float = 0.3;

function Delete(){
	isDestroyed = true;
	timeToStartDestroy = Time.time;
	color = renderer.material.color;
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

static function ResourceTypeWithString(s:String):ResourceType{
	var count:int = System.Enum.GetNames(typeof(ResourceType)).length;
	for (var i:int = 0; i < count; i++){
		if (System.Enum.GetNames(typeof(ResourceType))[i] == s)
			return i;
	}

	Debug.LogError("Wrong Resource Type: " + s);
	return ResourceType.None;
}

static function TypeWithString(s:String):CubeType{
	var count:int = System.Enum.GetNames(typeof(CubeType)).length;	
	for (var i:int = 0; i < count; i++){
		if (System.Enum.GetNames(typeof(CubeType))[i] == s)
			return i;
	}
	Debug.LogError("Wrong Cube Type: " + s);
	return CubeType.None;
}