#pragma strict

private var gear:Cube;
public var isActive:boolean;

private var x:int;
private var y:int;
private var z:int;

enum ItemType{
	Diamond,
	Telescope,
};

public var type:ItemType;

private var cubeManager:CubeManager;
private var cameraManager:CameraManager;

function Awake(){
	cubeManager = FindObjectOfType(CubeManager);
	cameraManager = FindObjectOfType(CameraManager);
}

function Start () {
	SnapToGrid();
}

function Update () {
	FindGear();

	if (!gear){
		isActive = false;
		return;
	}

	if (gear && gear.isDestroyed){
		isActive = false;
		return;
	}

	isActive = true;
}

function SnapToGrid(){
	var p:Vector3 = transform.position;

	var v:Vector3 = Cube.SnapPositionToGrid(p);
	x = v.x;
	y = v.y;
	z = v.z;

	var t:Vector3 = Vector3.Scale(v, Cube.GridScale());
	print(t);
	

	transform.position = t;
}

function FindGear(){
	var c:Cube = cubeManager.GetCubeAt(x,y,z);
	if (c && c.type == CubeType.Gear){
		gear = c;
	}else{
		gear = null;
	}
}