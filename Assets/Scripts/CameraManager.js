#pragma strict
import Helper;

public var isDirty:boolean;

private var cubeManager:CubeManager;
private var inGameGUI:InGameGUI;

function Awake(){
	cubeManager = GetComponent(CubeManager);
	inGameGUI = GetComponent(InGameGUI);	
}

function Start () {
	Application.targetFrameRate = 60.0;

	if (Application.platform == RuntimePlatform.IPhonePlayer){
	    switch (iPhone.generation){
	    	case iPhoneGeneration.iPad1Gen:
	        case iPhoneGeneration.iPhone3GS:
	        	QualitySettings.antiAliasing = 0;
	        	Application.targetFrameRate = 30.0;	        	
	        	break;	        	            
	    }
	}

	if (Application.platform == RuntimePlatform.IPhonePlayer){
	    switch (iPhone.generation){
	    	case iPhoneGeneration.iPad1Gen:
	        case iPhoneGeneration.iPad2Gen:
	        case iPhoneGeneration.iPad3Gen:
	        	numberOfCubesInView *= 2;
	        	break;	        	            
	    }
	}

	targetPosition = transform.position;
	targetRotationY = RotationY;

	ResetCamera();

	if (UseZoomInCamera){
		StartCoroutine(kInitialAnimationSequence);
	}
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

public var UseZoomInCamera:boolean = true;
private var startBlendTime:float;
private var blendInProgress:boolean;
private var zoomInLookAtTarget:Vector3;

public function ZoomOut(){
	if (!UseZoomInCamera){
		return;
	}
	UseZoomInCamera = false;
	zoomInLookAtTarget = lookAtTarget;
	ResetCamera();
}

public function ZoomIn(){
	if (UseZoomInCamera){
		return;	
	}
	UseZoomInCamera = true;
	ResetCamera();
	if (zoomInLookAtTarget != Vector3.zero){		
		LookAt(zoomInLookAtTarget);
	}
}

public static var kInitialAnimationSequence:String = "InitialAnimationSequence";

function ResetCamera(){
	if (UseZoomInCamera){
		InitZoomInCamera();
	}else{
		InitZoomOutCamera();
	}
}

function UpdateCamera() {
	if (blendInProgress && Time.time - startBlendTime > blendTime){
		blendInProgress = false;
	}

	UpdateRotation();
	UpdatePosition();
	UpdateZoom();
	if (isDirty){
		// When Rotating, always keep the current focus
		SetLookAt(lookAtTarget);		
		isDirty = false;
	}
};

function StopInitCamera(){
	StopCoroutine(kInitialAnimationSequence);
	LookAt(cubeManager.InitialCameraTarget());
}

///////////////////////////
// Zoom In Camera
///////////////////////////

private var numberOfCubesInView:int = 5;

function InitZoomInCamera(){
	LookAt(cubeManager.InitialCameraTarget());
	var c:Cube = cubeManager.GetRandomCube();
	var sizeOfCube:float = c.GetComponent(Renderer).bounds.extents.magnitude;
	ZoomTo(numberOfCubesInView * sizeOfCube);
}


function InitialAnimationSequence(){
	if (cubeManager.type == LevelType.Minion){
		var m:Minion = cubeManager.AvailableMinion();
		SetLookAt(m.transform.position);
		yield WaitForSeconds(2);
		LookAt(m.targetCube.SurfacePosition());
		yield WaitForSeconds(4);
		LookAt(m.transform.position);		
	}
}

///////////////////////////
// Zoom Out Camera
///////////////////////////

private static var CameraLerpSpeed:float = 8.0;
private static var CameraMoveLerpSpeed:float = 4.0;

private var lookAtTarget:Vector3;

//Distance doesn't matter in Ortho Cam, just need to make sure near clip/far clip not triggered
private var distance:float = 300;

private var RotationX:float = 30;
private var RotationY:float = 45;
private var targetRotationY:float;
private var RotationZ:float = 0;

private var targetPosition:Vector3; 

// Offset a little bit towards the top of the cubes
private var YOffsetPercentage:float = 0.1;

private var extentBuffer:float = 1.1;
private var zoomOut:boolean = false;

function InitZoomOutCamera(){
	AlignCameraWithWorld();
}


private var rotationTolerance:float = 0.2;

function UpdateRotation(){
	if (targetRotationY != RotationY){
		if (Mathf.Abs(RotationY - targetRotationY) <= rotationTolerance){
			RotationY = targetRotationY;
		}else{
			RotationY = Mathf.Lerp(RotationY, targetRotationY, BlendPercentage());
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
		transform.position = Vector3.Lerp(transform.position, targetPosition, BlendPercentage());
	}
}


private var targetSize:float;
private var sizeTolerance:float = 0.1;

function UpdateZoom(){
	if (Mathf.Abs(camera.orthographicSize - targetSize) <= sizeTolerance){
		camera.orthographicSize = targetSize;
	}else{
		camera.orthographicSize = Mathf.Lerp(camera.orthographicSize, targetSize, BlendPercentage());
	}
}



function AlignCameraWithWorld(){

	var b:Bounds = cubeManager.bounds;
	var center:Vector3 = Vector3(
			b.center.x,
			b.center.y + b.size.y * YOffsetPercentage,
			b.center.z
		);
	LookAt(center);

	// Tweak the OrthorGraphic Size According to Bounding Size
	var extendsWithBuffer:Vector3 = b.extents * extentBuffer;
	ZoomTo(extendsWithBuffer.magnitude * Mathf.Sqrt(0.5));
}

///////////////////////////
// Camera Help Function
///////////////////////////

private var blendTime:float = 1;
private var defaultBlendTime:float = 3.0;
private var inertiaBlendTime:float = 3.0;

function LookAt(target:Vector3){
	SetLookAtTarget(target);
	StartBlending(Time.time, false);
}

function LookAtWithInertia(target:Vector3){
	SetLookAtTarget(target);
	StartBlending(Time.time, true);
	blendTime = inertiaBlendTime;
}

function SetLookAt(target:Vector3){
	SetLookAtTarget(target);
	transform.position = targetPosition;
}

function StopLookAt(){
	targetPosition = transform.position;
}

function SetLookAtTarget(target:Vector3){
	var x:float = target.x - distance * Mathf.Sin(Mathf.Deg2Rad * RotationY);
	var y:float = target.y + distance * Mathf.Sin(Mathf.Deg2Rad * RotationX);	
	var z:float = target.z - distance * Mathf.Cos(Mathf.Deg2Rad * RotationY);	
	targetPosition = Vector3(x,y,z);
	lookAtTarget = target;	
}

function ZoomTo(size:float){
	targetSize = size;
	// Zoom will always happen at the same time as lookat
	StartBlending(Time.time, true);
	blendTime = defaultBlendTime;
}

function StartBlending(t:float, force:boolean){
	if (blendInProgress && !force){
		return;
	}
	startBlendTime = t;
	blendInProgress = true;
}

function BlendPercentage():float{
	var deltaT:float = Time.time - startBlendTime;
	var t:float = deltaT/blendTime;
	var x:float = EaseOutQuad(t, 0, 1, 1);
	return Mathf.Clamp01(x);
}

// t: current time
// b: beginning value
// c: change in value
// d: duration

function EaseInCubic (t:float, b:float, c:float, d:float):float{
	t/=d;
	return c*t*t*t + b;
}


function EaseOutCubic (t:float, b:float, c:float, d:float):float{
	t=t/d-1;
	return c*(t*t*t + 1) + b;
}

function EaseInQuad (t:float, b:float, c:float, d:float):float {
	t/=d;
	return c*t*t + b;
}

function EaseOutQuad (t:float, b:float, c:float, d:float):float {
	t/=d;
	return -c *t*(t-2) + b;
}

///////////////////////////
// Call back from Input
///////////////////////////

function TurnCamera(degree:float){
	//RotationY += degree;
	targetRotationY = targetRotationY + degree;
	StartBlending(Time.time, true);
	blendTime = defaultBlendTime;
}


function PanCamera(offset:Vector3, timeUsed:float){
	if (offset.sqrMagnitude == 0)
		return;

	if (timeUsed == 0){
		SetLookAt(lookAtTarget+offset);
		return;
	}

	// Keep the average speed constant
	var v:float = offset.magnitude/timeUsed;

	print("Time Used:" + timeUsed.ToString());
	
	timeUsed = Mathf.Clamp(timeUsed,0.2,100);

	print(v);

	// Speed limit
	v = Mathf.Clamp(v,0,50);

	var a:float = 2;	// Friction
	var t:float = v/a;

	var extraDistance:float = 0.5 * a * t * t;
	inertiaBlendTime = t;

	// The Distance is already covered in the previous TouchMoved
	LookAtWithInertia(lookAtTarget + offset * extraDistance/offset.magnitude);
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
	    var touch:Touch = ClosestTouchPointFromLast(touches);
	    if(touch.phase == TouchPhase.Began){
	        TouchBeganAt(touch.position);
	    }else if(touch.phase == TouchPhase.Moved
	    || touch.phase == TouchPhase.Stationary){
	        TouchMovedAt(touch.position);
	    }else if(touch.phase == TouchPhase.Ended){
	        TouchEndedAt(touch.position);
	    }
	    // Set last touchpoint only after all the touches are processed
	    lastTouchPoint = touch.position;
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

private var lastTouchPoint:Vector2 = Vector2.zero;

function ClosestTouchPointFromLast(touches:Array):Touch{
	var minDistance:float = 1000;
	var closestTouch:Touch;
	for (var touch:Touch in touches){
		var distance:float = Vector2.Distance(touch.position, lastTouchPoint);
		if (distance < minDistance){
			closestTouch = touch;
			minDistance = distance;
		}
	}
	return closestTouch;
}


// TODO: Optimize the number of Ray Casts

private var touchStartPoint:Vector2;
private var touchStartTime:float;
private var touchEndTime:float;
private var startPointIn3D:Vector3;

private var cameraMovementTolerance:float = 64.0;
private var cameraPanning:boolean = false;

function TouchBeganAt(p:Vector2){
	if (cubeManager.state == LevelState.LevelStart)
		return;

	touchStartPoint = p;
	touchStartTime = Time.time;
	lastCubePoint = Vector2.zero;
	cameraPanning = false;

	PRINT_IOS("Touch Started At" + p.ToString());		

	if (UseZoomInCamera){
		startPointIn3D = RaycastHitForCameraPanning(p);
	}

	// Stop Camera Panning if in Progress
	StopLookAt();

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
		// Reset Start Point once actual drag starts
		startPointIn3D = RaycastHitForCameraPanning(p);
	}

	if (cameraPanning){
		var endPointIn3D = RaycastHitForCameraPanning(p);
		PanCamera(startPointIn3D - endPointIn3D, 0);
		cubeManager.CubeReleased(null);
		return;
	}

	hit = RaycastHitForPoint(CompensatedTouchPoint(p));

	if (hit.collider == null){
		PRINT_IOS("Touch Moved, No Cube At" + p.ToString());		
		return;
	}

	PRINT_IOS("Touch Moved, Cube Found At" + p.ToString());		
	lastCubePoint = p;

	var c:Cube = hit.collider.GetComponent(Cube);
	var normal:Vector3 = hit.normal;

	cubeManager.CubeTouched(c, normal);
}

private static var BorderPercentageToTriggerCameraRotation:float = 0.2;
private var lastCubePoint:Vector2;

function TouchEndedAt(p:Vector2){
	if (cubeManager.state == LevelState.LevelStart){
		cubeManager.LevelStart();
		return;
	}

	// Do not even trigger the camera rotation
	if (cameraPanning){
		var endPointIn3D = RaycastHitForCameraPanning(p);
		touchEndTime = Time.time;
		PanCamera(startPointIn3D - endPointIn3D, touchEndTime - touchStartTime);
		return;
	}

	// Release Cube Cursor
	hit = RaycastHitForPoint(CompensatedTouchPoint(p));

	if (Application.platform == RuntimePlatform.IPhonePlayer 
		&& hit.collider == null 
		&& Vector2.Distance(p, lastCubePoint) <  cameraMovementTolerance * inGameGUI.resolutionRatio){
		// Fetch last touched point here, on iOS very often the finger slips when we do TouchEndedAt();
		p = lastCubePoint;
		hit = RaycastHitForPoint(CompensatedTouchPoint(p));

		PRINT_IOS("Touch Ended, Retry with Last Point:" + p.ToString());
	}

	if (hit.collider == null){
		cubeManager.CubeReleased(null);
		PRINT_IOS("Touch Ended, No Cube At:" + p.ToString());
	}else{
		var c:Cube = hit.collider.GetComponent(Cube);
		cubeManager.CubeReleased(c);
		PRINT_IOS("Touch Ended, Cube Found At" + p.ToString());		
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
	if (Physics.Raycast (ray, h, 1000, kCameraPanningHelperLayerMask)){
		return h.point;
	}
	return Vector3.zero;
}

function RaycastHitForPoint(p:Vector2){
	//Do Ray Cast
	var ray : Ray = camera.ScreenPointToRay(Vector3(p.x,p.y,0));
	var h:RaycastHit;
	if (Physics.Raycast (ray, h, 1000, Cube.kLayerMask)){
		// hit
		return h;
	}
	return h;
}

