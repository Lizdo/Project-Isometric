#pragma strict

public var resolutionRatio:int = 1;

private var padding:float = 8;
private var buttonSize:float = 64;
private var actionCountPadding:float = -10;

private var buttonLabelWidth:float = 4;

private var cubeManager:CubeManager;
private var skin:GUISkin;

function Start(){
	LoadTextures();
	
	if (Application.platform == RuntimePlatform.IPhonePlayer){
	    switch (iPhone.generation){
	        case iPhoneGeneration.iPhone4:
	        case iPhoneGeneration.iPhone4S:
	        case iPhoneGeneration.iPodTouch4Gen:
	        case iPhoneGeneration.iPad2Gen:
	        	resolutionRatio = 2;
	        	break;	        
	        case iPhoneGeneration.iPad3Gen:
	        	resolutionRatio = 4;
	        	break;	        	            
	    }
	}

	padding *= resolutionRatio;
	buttonSize *= resolutionRatio;
	buttonLabelWidth *= resolutionRatio;
	actionCountPadding *= resolutionRatio;

	cubeManager = GetComponent(CubeManager);
	skin = Resources.Load("Skin", GUISkin);
}

private var actions:Array = ["Delete","Dirt", "Water", "Grass"];
private var actionButtonOnTexture:Array = new Array();
private var actionButtonOffTexture:Array = new Array();

private var redo:Texture;
private var undo:Texture;
private var rotateLeft:Texture;
private var rotateRight:Texture;

function LoadTextures(){
	redo = Resources.Load("Redo", Texture);
	undo = Resources.Load("Undo", Texture);

	rotateLeft = Resources.Load("RotateLeft", Texture);
	rotateRight = Resources.Load("RotateRight", Texture);

	for (var i:int = 0;  i < actions.length; i++) {
		actionButtonOnTexture[i] = Resources.Load(actions[i] + "On", Texture);
		actionButtonOffTexture[i] = Resources.Load(actions[i] + "Off", Texture);		
	};
}


function OnGUI () {
	if (cubeManager.state == LevelState.LevelStart)
		return;

	GUI.skin = skin;

	// Undo/Redo

	if (GUI.Button(Rect(padding,padding,buttonSize,buttonSize), GUIContent("Undo", undo))){
		cubeManager.Undo();
	}
	if (GUI.Button(Rect(padding*2+buttonSize,padding,buttonSize,buttonSize),GUIContent("Redo", redo))){
		cubeManager.Redo();
	}

	// Rotate Left/Right

	var rotateButtonSize:float = buttonSize;

	GUI.Label(Rect(padding, 
		Screen.height/2 - rotateButtonSize/2, 
		rotateButtonSize, 
		rotateButtonSize), rotateLeft);

	GUI.Label(Rect(Screen.width - rotateButtonSize - padding, 
		Screen.height/2 - rotateButtonSize/2, 
		rotateButtonSize, 
		rotateButtonSize), rotateRight);

	// Button Selection

	var w:float = (buttonSize + padding + buttonLabelWidth) * actions.length;
	var h:float = buttonSize;
	var r:Rect = Rect(Screen.width - w,
	    Screen.height - padding - buttonSize, //padding,
	    w,
	    h + padding);
	GUILayout.BeginArea(r);//,  GUIStyle("BarFull")); 
	GUILayout.BeginHorizontal();

	for (var i:int = 0;  i < actions.length; i++) {
		var action:String = actions[i];
		var onTexture:Texture = actionButtonOnTexture[i];
		var offTexture:Texture = actionButtonOffTexture[i];
		
		if (cubeManager.currentAction == action && cubeManager.ActionAvailable(action)){
			if(GUILayout.Button(GUIContent(action, onTexture), GUILayout.MaxWidth(buttonSize), GUILayout.MaxHeight(buttonSize))){
				//Do Nothing
			}
		}else{
			if(GUILayout.Button(GUIContent(action, offTexture), GUILayout.MaxWidth(buttonSize), GUILayout.MaxHeight(buttonSize))){
				cubeManager.currentAction = action;
			}			
		}

		// Set action count padding to make numbers close to the icon
		GUI.skin.label.padding.left = actionCountPadding;

		GUILayout.Label(cubeManager.ActionCountInString(action));

		GUI.skin.label.padding.left = 0;
		
	}

	//TODO: Display the remaining cube count

	GUILayout.EndHorizontal();
	GUILayout.EndArea();


}
