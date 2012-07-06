#pragma strict

public var targetCube:Cube;
public var currentCube:Cube;
public var nextCube:Cube;

private var initialCube:Cube;
public var needRecalculatePathfinding:boolean;

enum MinionState{
	Idle = 0,
	Move = 1,
	Attack = 2,
	Victory = 3,
};

private var cubeManager:CubeManager;
private var state:MinionState;

function Start () {
	cubeManager = FindObjectOfType(CubeManager);
	SetState(MinionState.Move);
}

function Update () {
	FindCurrentCube();
	UpdateNextCube();
	UpdatePosition();
}

private var reachNextCubeTolerance:float = 0.5;

function FindCurrentCube(){
	// Initialization Logic
	if (!currentCube){
		// Find Current Cube by Position
		var v:Vector3 = Vector3(transform.position.x, 
			transform.position.y - Cube.GRID_SIZE_Y/2, 
			transform.position.z);
		currentCube = cubeManager.FindCubeAtPosition(v);		
	}
	if (!initialCube){
		initialCube = currentCube;
	}

	if (currentCube && nextCube){
		var distanceToNextCube:float = Vector3.Distance(transform.position, nextCube.SurfacePosition());
		// var distanceToCurrentCube:float = Vector3.Distance(transform.position, currentCube.transform.position);	
		if (distanceToNextCube < reachNextCubeTolerance){
			currentCube = nextCube;
			needRecalculatePathfinding = true;
		}		
	}
}

function UpdateNextCube () {
	// Do Pathfinding Here
	if (needRecalculatePathfinding){
		print("Recalculte Pathfinding");
		//nextCube = cubeManager.PathfindGreed(currentCube, targetCube);
		nextCube = cubeManager.PathfindAStar(currentCube, targetCube);
		needRecalculatePathfinding = false;
	}

	if (!nextCube){	
		nextCube = currentCube;
	}

	if (!cubeManager.Available(nextCube)){
		nextCube = currentCube;
	}

	// Go back to the center of current Cube if no next cube found.
	if (nextCube.isDestroyed || nextCube.y != currentCube.y){
		nextCube = currentCube;
	}
}

function UpdatePosition(){
	SnapToCubeSurface();
	
	// Update Animation
	if (nextCube.SurfacePosition() == transform.position){
		SetState(MinionState.Idle);
		return;
	}
	SetState(MinionState.Move);

	RotateTowardNextCube();
	MoveTowardNextCube();
}

function SnapToCubeSurface(){
	if (currentCube.isDestroyed){
		currentCube = cubeManager.ClearCubeBelow(currentCube);
		needRecalculatePathfinding = true;
	}else{
		// Snap to the grid surface if over the sky
		currentCube = cubeManager.ClearCubeAbove(currentCube);
	}

	if(!currentCube){
		// CurrentCube Got Deleted && No Replacement Found
		currentCube = initialCube;
		transform.position = currentCube.SurfacePosition();
		needRecalculatePathfinding = true;
		return;
	}

	transform.position = Vector3(transform.position.x,
		currentCube.SurfaceY(),
		transform.position.z);
}

private var smooth:float = 4.0;
private var speed:float = 4.0;


function RotateTowardNextCube(){
	var offset:Vector3 = -(nextCube.SurfacePosition() - transform.position);
	// Update Rotation
	if (offset == Vector3.zero) {
	    return;
	}
	var targetRotation:Quaternion = Quaternion.LookRotation(offset);    
	transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, Time.deltaTime * smooth); 
}

function MoveTowardNextCube(){
	transform.position = Vector3.MoveTowards(transform.position,
	    nextCube.SurfacePosition(),
	    Time.deltaTime * speed);	
}

private var AnimationName = ["Idle", "Move", "Attack", "Victory"];
private var blendTime = 0.3;

function SetState(s:MinionState){
	if (state == s)
		return;

	state = s;

	var animationState:AnimationState = animation[AnimationName[s]];
	print("Switching Animation:" + AnimationName[s]);
	if (animation && animationState){
		animation.CrossFade(AnimationName[s],blendTime);		
	}

}