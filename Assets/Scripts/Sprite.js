#pragma strict

private var cameraManager:CameraManager;

private var rotationX:float = 0;
private var rotationZ:float = 180;	//Compensate UV...
private var positionOffset:Vector3;
private var size:float = 5;

public var cube:Cube;

function Awake () {
	cameraManager = FindObjectOfType(CameraManager);
}

function Start(){
	//var extents:Vector3 = renderer.bounds.extents;
	positionOffset = Vector3(0, size, 0);
}

function Update () {
	// Rotate toward the camera
	var cameraRotationY:float = cameraManager.transform.eulerAngles.y;
	transform.eulerAngles = Vector3(rotationX, cameraRotationY+180, rotationZ);

	// Snap to Cube
	if (cube){
		transform.position = cube.SurfacePosition() + positionOffset;
	}	
}