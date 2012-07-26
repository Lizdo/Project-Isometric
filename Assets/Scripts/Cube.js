#pragma strict


///////////////////////////
// Properties
///////////////////////////

public var x:int;
public var y:int;
public var z:int;

public var type:CubeType;
public var resourceType:ResourceType;

// If the cube is pending to be destroyed, just playing the death animation
public var isDestroyed:boolean;

// Un powered cube cannot be interacted
public var isPowered:boolean;

// Will bring power to adjucent blocks if isPowered
public var isPowerSource:boolean;

// If the player can use the delete this cube
public var isDeletable:boolean;

// If minion can walk on it
public var isPassable:boolean;

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



///////////////////////////
// Run Loop
///////////////////////////

// Need to be called before CubeManager Initialize
function Awake () {
	SnapXYZToGrid();
	renderer.enabled = false;
	cubeManager = FindObjectOfType(CubeManager);
}


function Start(){
	transform.position = Vector3(x * GRID_SIZE_X, y * GRID_SIZE_Y, z * GRID_SIZE_Z);	
	renderer.enabled = true;
	initialMaterial = renderer.sharedMaterial;
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

	if (cubeManager.type == LevelType.Build){
		UpdateBuild();
	}
}

function LateUpdate(){
	// Update visual after all the update is done.
	if (!isPowered){
		renderer.material = cubeManager.UnpoweredMaterial();
	}else{
		renderer.material = initialMaterial;
	}
}

function CanDelete():boolean{
	if (!isPowered)
		return false;
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



///////////////////////////
// Build Functions
///////////////////////////

function UpdateBuild(){
	if (isPowered && isPowerSource){
		var adjucentCubes:Array = cubeManager.GetAdjucentCubes(x,y,z);
		for (var c:Cube in adjucentCubes){
			if (c.isPowered == false){
				// Propagate Power
				c.isPowered = true;
				c.UpdateBuild();
			}
		}
	}
}



///////////////////////////
// Snapping to Grid
///////////////////////////

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

function SetXYZ(newx:int, newy:int, newz:int){
	x = newx;
	y = newy;
	z = newz;
	transform.position = Vector3(x * GRID_SIZE_X, y * GRID_SIZE_Y, z * GRID_SIZE_Z);
}



///////////////////////////
// Helpers
///////////////////////////

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