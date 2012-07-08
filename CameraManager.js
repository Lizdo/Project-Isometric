#pragma strict

public var isDirty:boolean;

private var cubeManager:CubeManager;
private var inGameGUI:InGameGUI;

function Awake(){
	cubeManager = GetComponent(CubeManager);
	inGameGUI = GetComponent(InGameGUI);	
}

function Start () {
	Application.targetFrameRate = 60.0;


	
	InitCamera();
	
	print("Camera Manager Initiated");
}

function LateUpdate () {
	UpdateCamera();
	UpdateInput();
}

///////////////////////////
// Camera Update
///////////////////////////


// Zoom In Camera: 
//  Fixed view port size, drag to pan the view port

// Automated Camera:
// 	Automatically zoom to show the whole level

private var UseZoomInCamera:boolean = true;
public static var kInitialAnimationSequence:String = "InitialAnimationSequence";

function InitCamera(){
	isDirty = true;
	targetPosition = transform.position;
	targetRotationY = RotationY;

	if (UseZoomInCamera){
		InitZoomInCamera();
		StartCoroutine(kInitialAnimationSequence);
	}else{
		InitZoomOutCamera();
	}

}

function UpdateCamera() {
	if (UseZoomInCamera){		
		UpdateZoomInCamera();
	}else{
		UpdateZoomOutCamera();
	}
};

function StopInitCamera(){
	StopCoroutine(kInitialAnimationSequence);
	var m:Minion = cubeManager.AvailableMinion();
	LookAt(m.transform.position);
}

///////////////////////////
// Zoom In Camera
///////////////////////////

private var numberOfCubesInView:int = 5;

function InitZoomInCamera(){
	SetLookAt(cubeManager.AvailableMinion().transform.position);
	var c:Cube = cubeManager.RandomCube();
	var sizeOfCube:float = c.GetComponent(Renderer).bounds.extents.magnitude;
	camera.orthographicSize = numberOfCubesInView * sizeOfCube;
}

function UpdateZoomInCamera(){
	UpdateRotation();
	UpdatePosition();
	if (isDirty){
		AlignCameraWithTarget();
		isDirty = false;
	}
}

function AlignCameraWithTarget(){
	SetLookAt(lookAtTarget);
}

function InitialAnimationSequence(){
	var m:Minion = cubeManager.AvailableMinion();
	SetLookAt(m.transform.position);
	yield WaitForSeconds(2);
	LookAt(m.targetCube.SurfacePosition());
	yield WaitForSeconds(4);
	LookAt(m.transform.position);
}

///////////////////////////
// Zoom Out Camera
///////////////////////////

private static var CameraLerpSpeed:float = 8.0;
private static var CameraMoveLerpSpeed:float = 4.0;

private var lookAtTarget:Vector3;

//Distance doesn't matter in Ortho Cam, just need to make sure near clip/far clip not triggered
private var distance:float = 100;

private var RotationX:float = 30;
private var RotationY:float = 35;
private var targetRotationY:float;
private var RotationZ:float = 0;

private var targetPosition:Vector3; 

// Offset a little bit towards the top of the cubes
private var YOffsetPercentage:float = 0.1;

private var extentBuffer:float = 1.1;
private var zoomOut:boolean = false;

function InitZoomOutCamera(){
}

function UpdateZoomOutCamera(){
	UpdateRotation();
	UpdatePosition();
	if (isDirty){
		AlignCameraWithWorld();
		isDirty = false;
	}	
}

private var rotationTolerance:float = 0.2;

function UpdateRotation(){
	if (targetRotationY != RotationY){
		if (Mathf.Abs(RotationY - targetRotationY) <= rotationTolerance){
			RotationY = targetRotationY;
		}else{
			RotationY = Mathf.Lerp(RotationY, targetRotationY, Time.deltaTime * CameraLerpSpeed);
		}
		isDirty = true;
	}
	transform.rotation =  Quaternion.Euler(RotationX, RotationY, RotationZ);
}

private var positionTolerance:float = 0.2;


function UpdatePosition(){
	if (Mathf.Abs(Vector3.Distance(targetPosition, transform.position)) < positionTolerance){
		transform.position = targetPosition;
	}else{
		transform.position = Vector3.Lerp(transform.position, targetPosition, Time.deltaTime * CameraMoveLerpSpeed);
	}
}



function AlignCameraWithWorld(){

	// Calculate World Center
	var b:Bounds = cubeManager.BoundingBox();
	print (b);

	var center:Vector3 = Vector3(
			b.center.x,
			b.center.y + b.size.y * YOffsetPercentage,
			b.center.z
		);
	SetLookAt(center);

	// Tweak the OrthorGraphic Size According to Bounding Size
	var extendsWithBuffer:Vector3 = b.extents * extentBuffer;
	camera.orthographicSize = extendsWithBuffer.magnitude;
}

///////////////////////////
// Camera Help Function
///////////////////////////

function LookAt(target:Vector3){
	var x:float = target.x - distance * Mathf.Sin(Mathf.Deg2Rad * RotationY);
	var y:float = target.y + distance * Mathf.Sin(Mathf.Deg2Rad * RotationX);	
	var z:float = target.z - distance * Mathf.Cos(Mathf.Deg2Rad * RotationY);	
	targetPosition = Vector3(x,y,z);
	lookAtTarget = target;
}

function SetLookAt(target:Vector3){
	LookAt(target);
	transform.position = targetPosition;	
}


///////////////////////////
// Call back from Input
///////////////////////////

function TurnCamera(degree:float){
	//RotationY += degree;
	targetRotationY = targetRotationY + degree;
}


function PanCamera(offset:Vector3){
	SetLookAt(lookAtTarget+offset);
}

///////////////////////////
// Input Update
///////////////////////////

private var lastGUIAction:float;
private var timeToBlockInput:float = 0.1;
private var kCameraPanningHelperLayerMask:int = 1 << 9;

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

private var touchStartPoint:Vector2;
private var startPointIn3D:Vector3;

private var cameraMovementTolerance:float = 64.0;
private var cameraPanning:boolean = false;

function TouchBeganAt(p:Vector2){
	if (cubeManager.state == LevelState.LevelStart)
		return;

	touchStartPoint = p;
	cameraPanning = false;

	if (UseZoomInCamera){
		startPointIn3D = RaycastHitForCameraPanning(p);
	}

	hit = RaycastHitForPoint(CompensatedTouchPoint(p));

	if (hit.collider == null)
		return;

	var c:Cube = hit.collider.GetComponent(Cube);
	var normal:Vector3 = hit.normal;

	cubeManager.CubeTouched(c, normal);
}

public var hit : RaycastHit;

function TouchMovedAt(p:Vector2){
	if (cubeManager.state == LevelState.LevelStart)
		return;

	if (!cameraPanning && UseZoomInCamera && Vector2.Distance(p, touchStartPoint) > cameraMovementTolerance * inGameGUI.resolutionRatio){
		// Touch moved too much, trigger camera panning
		cameraPanning = true;
	}

	if (cameraPanning){
		var endPointIn3D = RaycastHitForCameraPanning(p);
		PanCamera(startPointIn3D - endPointIn3D);
		cubeManager.CubeReleased(null);
		return;
	}

	hit = RaycastHitForPoint(CompensatedTouchPoint(p));

	if (hit.collider == null)
		return;

	var c:Cube = hit.collider.GetComponent(Cube);
	var normal:Vector3 = hit.normal;

	cubeManager.CubeTouched(c, normal);
}

private static var BorderPercentageToTriggerCameraRotation:float = 0.2;

function TouchEndedAt(p:Vector2){
	if (cubeManager.state == LevelState.LevelStart){
		cubeManager.LevelStart();
		return;
	}

	// Do not even trigger the camera rotation
	if (cameraPanning)
		return;

	// Release Cube Cursor
	hit = RaycastHitForPoint(CompensatedTouchPoint(p));

	if (hit.collider == null){
		cubeManager.CubeReleased(null);
	}else{
		var c:Cube = hit.collider.GetComponent(Cube);
		cubeManager.CubeReleased(c);
		return;
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

function RaycastHitForCameraPanning(p:Vector2):Vector3{
	//Do Ray Cast
	var ray : Ray = camera.ScreenPointToRay(Vector3(p.x,p.y,0));
	var h:RaycastHit;
	var v:Vector2;
	if (Physics.Raycast (ray, h, 200, kCameraPanningHelperLayerMask)){
		return h.point;
	}
	return Vector3.zero;
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

