#pragma strict

import Helper;

public var targetCube:Cube;
public var currentCube:Cube;
public var nextCube:Cube;

private var initialCube:Cube;
public var needRecalculatePathfinding:boolean;
private var color = Color.white;
private var targetMarker:TargetMarker;

enum MinionState{
	Idle = 0,
	Move = 1,
	Attack = 2,
	Victory = 3,
};

private var cubeManager:CubeManager;
public var state:MinionState;

function Awake (){
	cubeManager = FindObjectOfType(CubeManager);
	var g:GameObject = Instantiate(Resources.Load("TargetMarker", GameObject));
	targetMarker = g.GetComponent(TargetMarker);
}

function Start () {
	SetState(MinionState.Move);
	InitializeCurrentCube();

	targetMarker.SetMinion(this);
	SetColor(ColorWithHex(0x2f4939));
}

function Update () {

	if (state == MinionState.Victory)
		return;

	FindCurrentCube();
	UpdateNextCube();
	UpdatePosition();
}

function InitializeCurrentCube(){
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
}

private var reachNextCubeTolerance:float = 0.5;

function FindCurrentCube(){
	if (currentCube && nextCube){
		var distanceToNextCube:float = Vector3.Distance(transform.position, nextCube.SurfacePosition());
		// var distanceToCurrentCube:float = Vector3.Distance(transform.position, currentCube.transform.position);	
		if (distanceToNextCube < reachNextCubeTolerance){
			currentCube = nextCube;
			needRecalculatePathfinding = true;
		}		
	}

	if (currentCube == targetCube){
		SetState(MinionState.Victory);
	}
}

function UpdateNextCube () {
	if (state == MinionState.Victory)
		return;

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
	if (state == MinionState.Victory)
		return;
			
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
private var speed:float = 10.0;//4.0;


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


protected function Renderer():Renderer{
    if (renderer)
        return renderer;
    
    var mesh:Transform = transform.Find("Mesh");
    if (mesh.renderer){
        return mesh.renderer;
    }

    var child:Transform = transform.Find("Arm/Bone");
    if (child.renderer){
        return child.renderer;    
    }

    print("Failed to get renderer. Need to check model hierarchy.");
    return null;
}

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

function SetColor(c:Color){
	color = c;
	Renderer().material.color = c;
	targetMarker.SetColor(c);
}
