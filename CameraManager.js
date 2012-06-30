#pragma strict

public var isDirty:boolean;

private var cubeManager:CubeManager;

function Start () {
	cubeManager = GetComponent(CubeManager);
	isDirty = true;
}

function Update () {
	UpdateCamera();
	UpdateInput();
}

///////////////////////////
// Camera Update
///////////////////////////

function UpdateCamera() {
	if (isDirty){
		AlignCamera();
		isDirty = false;
	}	
};


//Distance doesn't matter in Ortho Cam, just need to make sure near clip/far clip not triggered
private var distance:float = 100;

private var RotationX:float = 30;
private var RotationY:float = 45;
private var RotationZ:float = 0;

// Offset a little bit towards the top of the cubes
private var YOffsetPercentage:float = 0.2;

private var extentBuffer:float = 1;

function AlignCamera(){

	transform.rotation =  Quaternion.Euler(RotationX, RotationY, RotationZ);

	// Calculate World Center
	var b:Bounds = cubeManager.BoundingBox();
	print (b);

	// Look At Bounding Center
	var y:float = b.center.y + distance * Mathf.Sin(Mathf.Deg2Rad * RotationX)
		+ b.size.y * YOffsetPercentage;

	var x:float = b.center.x - distance * Mathf.Sin(Mathf.Deg2Rad * RotationY);
	var z:float = b.center.z - distance * Mathf.Cos(Mathf.Deg2Rad * RotationY);	

	transform.position = Vector3(x,y,z);
	// Tweak the OrthorGraphic Size According to Bounding Size

	var extendsWithBuffer:Vector3 = b.extents * extentBuffer;

	var sizeXZ = Mathf.Abs(extendsWithBuffer.z * Mathf.Cos(Mathf.Deg2Rad * RotationY))
		+ Mathf.Abs(extendsWithBuffer.x * Mathf.Sin(Mathf.Deg2Rad * RotationY));

	print(sizeXZ);
	

	var sizeYZ = Mathf.Abs(extendsWithBuffer.z * Mathf.Cos(Mathf.Deg2Rad * RotationX))
		+ Mathf.Abs(extendsWithBuffer.y * Mathf.Sin(Mathf.Deg2Rad * RotationX));

		print(sizeYZ);

	camera.orthographicSize = Mathf.Max(sizeXZ,sizeYZ);
	
}

function TurnCamera(degree:float){
	RotationY += degree;
	isDirty = true;
}


///////////////////////////
// Input Update
///////////////////////////

function UpdateInput(){
	if (Application.platform == RuntimePlatform.IPhonePlayer){
	    var touches = Input.touches;
	    if (touches.length < 1)
	        return;
	    var touch:Touch = touches[0];
	    if(touch.phase == TouchPhase.Began){
	        TouchBeganAt(touch.position);
	    }else if(touch.phase == TouchPhase.Moved
	    || touch.phase == TouchPhase.Stationary){
	        TouchMovedAt(touch.position);
	    }else if(touch.phase == TouchPhase.Ended){
	        TouchEndedAt(touch.position);
	    }
	}else{
	    if(Input.GetMouseButtonDown(0)){
	        TouchBeganAt(Input.mousePosition);
	    }else if(Input.GetMouseButton(0)){
	        TouchMovedAt(Input.mousePosition);
	    }else if(Input.GetMouseButtonUp(0)){
	        TouchEndedAt(Input.mousePosition);
	    }
	}   
}

function TouchBeganAt(p:Vector2){

}

function TouchMovedAt(p:Vector2){
	
}

private static var BorderPercentageToTriggerCameraRotation:float = 0.2;

function TouchEndedAt(p:Vector2){
	// Border Check 
	if (p.x >= Screen.width * (1-BorderPercentageToTriggerCameraRotation)){
		TurnCamera(90);
	}
	else if (p.x <= Screen.width * BorderPercentageToTriggerCameraRotation){
		TurnCamera(-90);
	}
}

