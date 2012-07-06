#pragma strict

public var isDirty:boolean;

private var cubeManager:CubeManager;
private var inGameGUI:InGameGUI;

function Start () {
	Application.targetFrameRate = 60.0;

	cubeManager = GetComponent(CubeManager);
	inGameGUI = GetComponent(InGameGUI);
	
	isDirty = true;
	print("Camera Manager Initiated");
}

function LateUpdate () {
	UpdateCamera();
	UpdateInput();
}

///////////////////////////
// Camera Update
///////////////////////////

private static var CameraRotationLerpTime:float = 4;

function UpdateCamera() {
	if (targetRotationY != RotationY){
		if (Mathf.Abs(RotationY - targetRotationY) <= 0.2){
			RotationY = targetRotationY;
		}else{
			RotationY = Mathf.Lerp(RotationY, targetRotationY, Time.deltaTime * CameraRotationLerpTime);
		}
		isDirty = true;
	}
	if (isDirty){
		AlignCamera();
		isDirty = false;
	}	
};


//Distance doesn't matter in Ortho Cam, just need to make sure near clip/far clip not triggered
private var distance:float = 100;

private var RotationX:float = 30;
private var RotationY:float = 45;
private var targetRotationY:float = 45;
private var RotationZ:float = 0;

// Offset a little bit towards the top of the cubes
private var YOffsetPercentage:float = 0.1;

private var extentBuffer:float = 1.1;
private var zoomOut:boolean = false;

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
	
	camera.orthographicSize = extendsWithBuffer.magnitude;

	// TODO: Use fixed Size when Zoomed In
	//camera.orthographicSize = 30;
}

function TurnCamera(degree:float){
	//RotationY += degree;
	targetRotationY = targetRotationY + degree;
}


///////////////////////////
// Input Update
///////////////////////////

private var lastGUIAction:float;
private var timeToBlockInput:float = 0.1;

function OnGUI(){
	if (GUIUtility.hotControl != 0){
		lastGUIAction = Time.time;
	}
}

function UpdateInput(){
	// Block Input if There's an GUI Action
	if (Time.time - lastGUIAction <= timeToBlockInput){
		TouchCancelled();
		return;
	}
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

// TODO: Optimize the number of Ray Casts

function TouchBeganAt(p:Vector2){
	hit = RaycastHitForPoint(CompensatedTouchPoint(p));

	if (hit.collider == null)
		return;

	var c:Cube = hit.collider.GetComponent(Cube);
	var normal:Vector3 = hit.normal;

	cubeManager.CubeTouched(c, normal);
}

public var hit : RaycastHit;

function TouchMovedAt(p:Vector2){
	hit = RaycastHitForPoint(CompensatedTouchPoint(p));

	if (hit.collider == null)
		return;

	var c:Cube = hit.collider.GetComponent(Cube);
	var normal:Vector3 = hit.normal;

	cubeManager.CubeTouched(c, normal);
}

private static var BorderPercentageToTriggerCameraRotation:float = 0.2;

function TouchEndedAt(p:Vector2){
	// Release Cube Cursor
	hit = RaycastHitForPoint(CompensatedTouchPoint(p));

	if (hit.collider == null){
		cubeManager.CubeReleased(null);
	}else{
		var c:Cube = hit.collider.GetComponent(Cube);
		cubeManager.CubeReleased(c);		
	}

	// Check Camera Rotation
	if (p.x >= Screen.width * (1-BorderPercentageToTriggerCameraRotation)){
		TurnCamera(90);
		return;
	}
	else if (p.x <= Screen.width * BorderPercentageToTriggerCameraRotation){
		TurnCamera(-90);
		return;
	}
}

function TouchCancelled(){
	cubeManager.CubeReleased(null);
}

private var touchOffsetForIOS:float = 32;

function CompensatedTouchPoint(p:Vector2):Vector2{
	if (Application.platform == RuntimePlatform.IPhonePlayer){
		return Vector2(p.x, p.y + touchOffsetForIOS * inGameGUI.resolutionRatio);
	}	
	return p;
}

function RaycastHitForPoint(p:Vector2){
	//Do Ray Cast
	var ray : Ray = camera.ScreenPointToRay(Vector3(p.x,p.y,0));
	var h:RaycastHit;
	var v:Vector2;
	if (Physics.Raycast (ray, h, 200, Cube.kLayerMask)){
		return h;
	}
	print(h.collider);
	
	return h;
}

