#pragma strict

public var currentAction:String;
public var state:LevelState;

//Actions Separated by Pipe (|)
public var availableActions:String = "Delete|Dirt|Gear";
//Correspondent to actions, Separated by Pipe (|), -1 = infinite	
public var availableActionCounts:String = "-1|5|3"; 

public var actions:Array = new Array();
private var actionCounts:Array = new Array();

public var useRandomGeneration:boolean = false;
public var randomGenerationLevelSize:int;


public var bounds:Bounds;
private var cubes:Array;
private var minions:Array;
private var items:Array;
private var isDirty:boolean;
private var cameraManager:CameraManager;
private var inGameGUI:InGameGUI;

private var cursor:Cursor;
private var log:GUIText;
private var centerText:GUIText;


public static var kActionDelete:String = "Delete";
public static var kActionDirt:String = "Dirt";
public static var kActionWater:String = "Water";
public static var kActionGear:String = "Gear";
public static var kActionMinion:String = "Minion";
public static var kActionElectricity:String = "Electricity";

public var diamondCount:int;
public var telescopeActive:boolean;

public var type:LevelType = LevelType.Minion;

enum LevelType{
	None,
	Minion,
	Physics,
	Build,
}

enum LevelState{
	Invalid			= 0,
	LevelStart		= 1,
	LevelInProgress = 2,
	LevelComplete 	= 3,
};

function Awake(){
	cameraManager = GetComponent(CameraManager);
	inGameGUI = GetComponent(InGameGUI);	

	cubes = FindObjectsOfType(Cube);
	minions = FindObjectsOfType(Minion);
	items =  FindObjectsOfType(Item);

	log = Instantiate(Resources.Load("Log", GameObject)).GetComponent(GUIText);
	centerText = Instantiate(Resources.Load("CenterText", GameObject)).GetComponent(GUIText);

	cursor = Instantiate(Resources.Load("Cursor", GameObject)).GetComponent(Cursor);

	ParseActions();

	if (useRandomGeneration){
		GenerateLevel();
	}
}

function Start () {
	cursor.Hide();	
	isDirty = true;
	currentAction = kActionDirt;
	SetState(LevelState.LevelStart);
	print("Cube Manager Initiated");

	log.font = inGameGUI.fontSmall;
	centerText.font = inGameGUI.fontLarge;	

	unpoweredMaterial = Resources.Load("Unpowered", Material);
	
}

private var levelComplete:boolean;

function Update () {
	UpdateItems();

	if (type == LevelType.Build){
		UpdateBuild();
	}
	
	if (isDirty){
		CalculateBoundingBox();
		isDirty = false;
	}

	if (!levelComplete && Victory()){
		levelComplete = true;
		LevelComplete();
	}
}

function GenerateLevel(){
	var electricityPercentage:float = 0.1;
	LevelGenerator.SetSeed(Mathf.Floor(Random.value*10000));
	for (var x:int = -randomGenerationLevelSize; x < randomGenerationLevelSize; x++){
		for (var z:int = -randomGenerationLevelSize; z < randomGenerationLevelSize; z++){
			var maxHeight:int = LevelGenerator.Height(x,z);
			if (maxHeight < 0){
				continue;
			}
			for (var y:int = 0; y < maxHeight; y++){
				if (Random.value <= electricityPercentage){
					InitCubeAt(x,y,z,CubeType.Electricity);					
				}else{
					InitCubeAt(x,y,z,CubeType.Dirt);
				}
			}
		}
	}

	if (type == LevelType.Build){
		// Add an initial core cube somewhere
		for (var c:Cube in cubes){
			if (GetAdjucentCubes(c.x,c.y,c.z).length > 5){
				var topCube:Cube = GetClearGetCubeAbove(c);
				InitCubeAt(topCube.x, topCube.y+1, topCube.z, CubeType.Core);
				return;
			}
		}
	}
}

function UpdateItems(){
	var telescopeActivated:boolean = telescopeActive;	
	diamondCount = 0;
	telescopeActive = false;
	for (var i:Item in items){
		if (i.type == ItemType.Diamond && i.isActive){
			diamondCount++;
		}
		if (i.type == ItemType.Telescope && i.isActive){
			telescopeActive = true;
		}
	}
	if (telescopeActivated && !telescopeActive){
		print("Telescope is no longer active!");

		cameraManager.ZoomIn();
	}
}


function ParseActions(){
	if (availableActions == ""){
		actions = new Array(
			kActionDelete,
			kActionDirt,
			kActionWater
			);
		actionCounts = new Array(-1, 5, 0);
		return;
	}

	var actionTexts:String[] = availableActions.Split("|"[0]);
	var actionCountTexts:String[] = availableActionCounts.Split("|"[0]);

	if (actionTexts.length != actionCountTexts.length){
		Debug.LogError("Action Count not correct! Check available action setting!");
		return;
	}

	for (var i:int = 0; i < actionTexts.length; i++ ){
		print(actionTexts[i]);
		print(actionCountTexts[i]);
		
		var action:String = actionTexts[i];
		var count:int = parseInt(actionCountTexts[i]);

		if (!IsActionValid(action)){
			Debug.LogError("Invalid action in available action setting!");
			return;
		}

		actions.Add(action);
		actionCounts.Add(count);
	}
}

function IsActionValid(action:String):boolean{
	var validActions:Array = new Array(
		kActionDelete,
		kActionDirt,
		kActionMinion,
		kActionWater,
		kActionElectricity
		);

	for (var s:String in validActions){
		action = s;
		return true;
	}

	return false;
}

function LevelStart(){
	SetState(LevelState.LevelInProgress);
}

function SetState(s:LevelState){
	if(s == state)
		return;
	state = s;
	switch(state){
		case LevelState.LevelStart:
			centerText.text = "Touch To Start";
			print("Touch To Start");
			
			break;
		case LevelState.LevelInProgress:
			centerText.text = "";
			cameraManager.StopInitCamera();
			break;
		case LevelState.LevelComplete:
			centerText.text = "Level Completed";
			break;
	}
}

function Victory():boolean{
	if (type == LevelType.Minion){
		for (var m:Minion in minions){
			if (m.state != MinionState.Victory)
				return false;
		}
		return true;		
	}
	return false;
}

function LevelComplete(){
	SetState(LevelState.LevelComplete);
	print("Level Complete!");
	yield WaitForSeconds(5);
	LoadNextlevel();	
}

private var MaxLevelID:int = 0;

function LoadNextlevel(){
	var index:int = Application.loadedLevel + 1;
	if (index > MaxLevelID)
		index = 0;
	Application.LoadLevel(index);
}


///////////////////////////
// BUILD Gameplay
///////////////////////////

private var unpoweredMaterial:Material;

public function UnpoweredMaterial():Material{
	return unpoweredMaterial;
}


private var cores:Array;

function UpdateBuild(){
	// Clean Up
	cores = new Array();

	for (var c:Cube in cubes){
		if (c.type == CubeType.Core && c.isPowered){
			cores.Add(c);
		}else{
			c.isPowered = false;
		}
	}

	for (var core:CubeCore in cores){
		CalculateCoreSize(core);

		// Every thing in power radius is powered
		for (var c:Cube in cubes){
			if (Distance2D(core,c) <= core.PowerRadius()){
				c.isPowered = true;
			}
		}

		// Cubes will propagate themselves
	}
}


function CalculateCoreSize(c:CubeCore){
	ASSERT(c.type == CubeType.Core, "Only Cores get calculated.");

	var maxStep:int = 9;
	var poweredCubes:Array = new Array(c);
	var newCubes:Array;
	c.size = 1;

	//Go Up/Left/Right/Front/Back
	var offset = [
		[-1,0,0],
		[1,0,0],
		[0,0,-1],
		[0,0,1],
		[0,1,0]
	];

	for (var j:int = 0; j < maxStep; j++){
		newCubes = new Array();
		for (var powerCube:Cube in poweredCubes){
			for (var i:int = 0; i < offset.length ; i++){
				var neighbour:Cube = GetCubeAt(powerCube.x + offset[i][0],
					powerCube.y + offset[i][1],
					powerCube.z + offset[i][2]);
				if (!neighbour || neighbour.resourceType != c.resourceType){
					return;
				}
				newCubes.push(neighbour);
			}
		}
		c.size++;
		poweredCubes = poweredCubes.Concat(newCubes);
	}
}



function Distance(c1:Cube, c2:Cube):float{
	return c1.Distance(c2);
}

function Distance2D(c1:Cube, c2:Cube):float{
	return c1.Distance2D(c2);
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
	var t:CubeType = GetCubeAt(x,y,z).type;
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


function InitCubeAt(x:int, y:int, z:int, type:CubeType){
	var g:GameObject;
	g = Instantiate(Resources.Load("Cube"+ type.ToString(), GameObject));
			
	var c:Cube = g.GetComponent(Cube);
	c.x = x;
	c.y = y;
	c.z = z;
	cubes.Add(c);
}

// Never call this directly!!
function AddCubeAt(x:int, y:int, z:int, type:CubeType){
	var g:GameObject;
	g = Instantiate(Resources.Load("Cube"+ type.ToString(), GameObject));
			
	var c:Cube = g.GetComponent(Cube);
	c.x = x;
	c.y = y;
	c.z = z;
	cubes.Add(c);

	// TODO: Better data structure
	ModifyActionCount(currentAction, -1);

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

			// Update Resource Count
			if (c.resourceType != ResourceType.None){
				ModifyActionCount(c.resourceType.ToString(), 1);
			}

			return;
		}
	}
}


function IsActionAvailable(action:String):boolean{
	var i:int = GetActionCount(action);
	if (i == -1)
		return true;
	if (i > 0)
		return true;
	return false;
}

private function GetActionCount(action:String):int{
	for (var i:int = 0; i < actions.length; i++){
		if (actions[i] == action){
			return actionCounts[i];
		}
	}
	Debug.LogError("Action not found: " + action);	
	return 0;
}

private function ModifyActionCount(action:String, amount:int){
	for (var i:int = 0; i < actions.length; i++){
		if (actions[i] == action){
			if (actionCounts[i] == -1){
				return;				
			}else{
				var c:int = actionCounts[i];
				actionCounts[i] = c + amount;
				if (action == currentAction && actionCounts[i] == 0){
					//currentAction = "";
				}
				return;
			}
		}
	}
	Debug.LogError("Action not found: " + action);	
}

function GetActionCountInString(action:String):String{
	var count:int = GetActionCount(action);
	if (count == -1)
		return "∞";
	return count.ToString();
}

function IsCurrentActionAvailable():boolean{
	if (GetActionCount(currentAction)>0 || GetActionCount(currentAction) == -1){
		return true;
	}
	return false;
}


///////////////////////////
// Input Callback
///////////////////////////

function CubeTouched(c:Cube, n:Vector3){
	if (!c)
		return;

	// Delete Cube
	if (currentAction == kActionDelete){
		cursor.SetXYZ(c.x, c.y, c.z);
		cursor.Show();
		if (c.CanDelete()){
			cursor.Enable();
		}else{
			cursor.Disable();
		}

		return;
	}

	if (GetCubeAt(c.x+n.x, c.y+n.y, c.z+n.z)){
		cursor.Hide();
		return;
	}

	if (!IsAdjucentCubesPowered(c.x+n.x, c.y+n.y, c.z+n.z))
		return;

	// Add Cube
	cursor.SetXYZ(c.x+n.x, c.y+n.y, c.z+n.z);	
	cursor.Show();

	if (IsCurrentActionAvailable())
		cursor.Enable();
	else
		cursor.Disable();

}

function IsAdjucentCubesPowered(x:int, y:int, z:int){
	var adjucentCubes:Array = GetAdjucentCubes(x,y,z);
	for (var c:Cube in adjucentCubes){
		if (c.isPowered)
			return true;
	}
	return false;

}

function CubeReleased(c:Cube){
	cursor.Hide();

	if (!c)
		return;

	if (!IsCurrentActionAvailable())
		return;

	if (currentAction == kActionDelete){
		if (c.CanDelete()){
			RemoveCubeOperation(cursor.x, cursor.y, cursor.z);
		}
		return;
	}

	if (currentAction != kActionDelete && currentAction != ""){
		if (GetCubeAt(cursor.x, cursor.y, cursor.z))
			return;

		if (!IsAdjucentCubesPowered(cursor.x, cursor.y, cursor.z))
			return;

		AddCubeOperationWithResourceType(cursor.x, cursor.y, cursor.z, Cube.ResourceTypeWithString(currentAction));	
	}
	
}

// TODO: Add different cubes
function AddCubeOperationWithResourceType(x:int, y:int, z:int, t:ResourceType){
	AddCubeOperation(x, y, z, Cube.TypeWithString(t.ToString()));	
}

///////////////////////////
// Pathfinding
///////////////////////////

private var OpenList:Array;
private var ClosedList:Array;
private var AvailableList:Array;


function PathfindGreed(start:Cube, end:Cube):Cube{
	var a:Array = GetAdjucentPassableCubes(start);
	a.Push(start);
	var distance:float = 1000;
	var nextCube:Cube;
	for (var c:Cube in a){
		if (c.PathfindingDistance(end) < distance){
			distance = c.PathfindingDistance(end);
			nextCube = c;			
		}
	}
	// print("Pathfinding Complete, next Cube:" + nextCube.ToString());
	return nextCube;
}

function PathfindAStar(start:Cube, end:Cube):Cube{
	if (start == end)
		return end;

	var startTime:float = Time.time;
	
	if (start.y != end.y){
		//print("Starting and ending cube are not on the same height!");

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
		var adjucentPassableCubes:Array = GetAdjucentPassableCubes(currentCube);
		for (var c:Cube in adjucentPassableCubes){

			// If it is not walkable or if it is on the closed list, ignore it. 
			if (!IsAvailable(c))
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
				c.H = end.PathfindingDistance(c);
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
					c.H = end.PathfindingDistance(c);
					c.F = c.G + c.H;
				}
			}
		}

		// d) Stop when you:

		//	Add the target square to the closed list, in which case the path has been found (see note below), or
		//	Fail to find the target square, and the open list is empty. In this case, there is no path.  		

		if (currentCube == end){
			//print("Path Found!");
			pathFound = true;
			break;
		}

		if (OpenList.length == 0){
			//print("Path Not Found!");
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
		//PrintPath(pathArray);
		return pathArray[0];
	}

	// Pathfinding Failed, return cube closest to target
	c = ClosestToTargetCubeInClosedList(end);

	// Rather not move if not helping with the PathfindingDistance
	if (end.PathfindingDistance(c) >= end.PathfindingDistance(start))
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
		if (c.y == startCube.y && IsAvailable(c)){
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
		if (c.PathfindingDistance(end) < distance){
			closestCube = c;
			distance = c.PathfindingDistance(end);
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

function InitialCameraTarget():Vector3{
	var target:Vector3;
	switch (type){
		case LevelType.Minion:
			if (AvailableMinion())
				target = AvailableMinion().transform.position;
			break;
		case LevelType.Physics:
			if (AvailableSpawner())
				target = AvailableSpawner().SurfacePosition();
			break;
		case LevelType.Build:
			if (AvailableCore())
				target = AvailableCore().SurfacePosition();
			break;
	}
	return target;
}

function AvailableCore():Cube{
	for (var c:Cube in cubes){
		if (c.type == CubeType.Core){
			return c;
		}
	}
	return null;
}

function AvailableSpawner():Cube{
	for (var c:Cube in cubes){
		if (c.type == CubeType.Spawner){
			return c;
		}
	}
	return null;
}

function AvailableMinion():Minion{
	for (var m:Minion in minions){
		if (m.state != MinionState.Victory)
			return m;
	}
	return null;
}

function GetRandomCube():Cube{
	return cubes[0];
}

// Find cube with id x, y, z
function GetCubeAt(x:int, y:int, z:int):Cube{
	for (var c:Cube in cubes) {
		if (c.type == CubeType.None)
			continue;
		if (c.x == x && c.y == y && c.z == z){
			return c;
		}
	}
	return null;
}


function GetClearGetCubeAbove(c:Cube):Cube{
	while (1){
		var GetCubeAbove:Cube = GetCubeAbove(c);
		if (GetCubeAbove == null)
			return c;
		c = GetCubeAbove;
	}
	print("Should Never Go Here");
	return null;
}

private var MAX_STEP_Y = 100;

function ClearGetCubeBelow(c:Cube):Cube{
	for (var i:int = 1; i < MAX_STEP_Y; i++){
		var GetCubeBelow:Cube = GetCubeAt(c.x, c.y-i, c.z);
		if(GetCubeBelow)
			return GetCubeBelow;
	}
	return null;
}

function GetCubeAbove(c:Cube):Cube{
	return GetCubeAt(c.x, c.y+1, c.z);
}

function GetCubeBelow(c:Cube):Cube{
	return GetCubeAt(c.x, c.y-1, c.z);
}


// Find cube at real world position p
function GetCubeAtPosition(p:Vector3):Cube{
	var v:Vector3 = Cube.SnapPositionToGrid(p);
	return GetCubeAt(Mathf.Floor(v.x), Mathf.Floor(v.y), Mathf.Floor(v.z));
}

function IsAvailable(c:Cube):boolean{
	if (!c.CanPass())
		return false;
	if (GetCubeAbove(c))
		return false;
	return true;
}

function GetAdjucentCubes(x:int,y:int,z:int):Array{
	var a:Array = new Array();
	var offset = [
		[-1,0,0],
		[1,0,0],
		[0,0,-1],
		[0,0,1],
		[0,1,0],
		[0,-1,0]
	];

	for (var i:int = 0; i < offset.length ; i++){
		var neighbour:Cube = GetCubeAt(x + offset[i][0],
			y + offset[i][1],
			z + offset[i][2]);
		if (neighbour){
			a.push(neighbour);
		}
	}

	return a;
}

function GetAdjucentPassableCubes(c:Cube):Array{
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
		var neighbour:Cube = GetCubeAt(c.x + offset[i][0],
			c.y + offset[i][1],
			c.z + offset[i][2]);
		if (neighbour && IsAvailable(neighbour)){
			a.push(neighbour);
		}
	}

	return a;
}

function CalculateBoundingBox(){
	bounds = Bounds(Vector3.zero, Vector3.zero);
	
	for (var c:Cube in cubes) {
		if (c.type == CubeType.None)
			continue;
		bounds.Encapsulate(c.transform.position);
	};
}

