#pragma strict
import Helper;

public var resolutionRatio:int = 1;

private var padding:float = 8;
private var buttonSize:float = 64;
private var actionCountPadding:float = -10;

private var buttonLabelWidth:float = 4;

private var cubeManager:CubeManager;
private var cameraManager:CameraManager;

private var skin:GUISkin;

public var fontLarge:Font;
public var fontSmall:Font;
private var baseFontSize:int = 16;
private var fontName:String = "MyriadPro-BoldCond";

function Awake(){
	cubeManager = GetComponent(CubeManager);
	cameraManager = GetComponent(CameraManager);

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

	actions = cubeManager.actions;	

	var fontSmallSize:int = baseFontSize * resolutionRatio;
	var fontLargeSize:int = fontSmallSize * 2;

	fontSmall = Resources.Load(fontName + fontSmallSize.ToString(), Font);
	fontLarge = Resources.Load(fontName + fontLargeSize.ToString(), Font);	

}

function Start(){
	skin = Resources.Load("Skin", GUISkin);
	skin.font = fontSmall;
	LoadTextures();

}

private var actions:Array;
private var actionButtonOnTexture:Array = new Array();
private var actionButtonOffTexture:Array = new Array();

private var redo:Texture;
private var undo:Texture;
private var rotateLeft:Texture;
private var rotateRight:Texture;
private var diamond:Texture;

private var zoomIn:Texture;
private var zoomOut:Texture;

function LoadTextures(){
	redo = Resources.Load("Redo", Texture);
	undo = Resources.Load("Undo", Texture);

	rotateLeft = Resources.Load("RotateLeft", Texture);
	rotateRight = Resources.Load("RotateRight", Texture);

	diamond = Resources.Load("Diamond", Texture);
	
	zoomIn = Resources.Load("ZoomIn", Texture);
	zoomOut = Resources.Load("ZoomOut", Texture);
	
	for (var i:int = 0;  i < actions.length; i++) {
		actionButtonOnTexture[i] = Resources.Load(actions[i] + "On", Texture);
		actionButtonOffTexture[i] = Resources.Load(actions[i] + "Off", Texture);		
	};
}


function OnGUI () {
	if (cubeManager.state == LevelState.LevelStart)
		return;

	GUI.skin = skin;

	UndoRedoButtons();
	RotateButtons();
	ActionButtons();
	ScoreUI();
	if (cubeManager.telescopeActive){
		ZoomUI();		
	}
}


function UndoRedoButtons(){
	if (GUI.Button(Rect(padding,padding,buttonSize,buttonSize), GUIContent("Undo", undo))){
		cubeManager.Undo();
	}
	if (GUI.Button(Rect(padding*2+buttonSize,padding,buttonSize,buttonSize),GUIContent("Redo", redo))){
		cubeManager.Redo();
	}
}
function ZoomUI(){
	var r:Rect = Rect(Screen.width - padding - buttonSize,
		padding,
		buttonSize,
		buttonSize
		);

	if (cameraManager.UseZoomInCamera){
		if (GUI.Button(r, GUIContent("ZoomOut", zoomOut))){
			cameraManager.ZoomOut();
		}	
	}else{
		if (GUI.Button(r, GUIContent("ZoomIn", zoomIn))){
			cameraManager.ZoomIn();
		}
	}
}


function RotateButtons(){
	var rotateButtonSize:float = buttonSize/2;

	GUI.Label(Rect(padding, 
		Screen.height/2 - rotateButtonSize/2, 
		rotateButtonSize, 
		rotateButtonSize), rotateLeft);

	GUI.Label(Rect(Screen.width - rotateButtonSize - padding, 
		Screen.height/2 - rotateButtonSize/2, 
		rotateButtonSize, 
		rotateButtonSize), rotateRight);
}

function ScoreUI(){
	// Draw Diamonds
	var diamondCount:int = cubeManager.diamondCount;

	if (diamondCount == 0)
		return;

	var diamondSize:float = buttonSize/2;
	var diamondPadding:float = 0;

	var w:float = (diamondSize+diamondPadding) * diamondCount;
	var h:float =  diamondSize;
	var r:Rect = Rect(Screen.width/2 - w/2, 0,
			w, h);

	GUILayout.BeginArea(r);
	GUILayout.BeginHorizontal();

	for (var i:int = 0; i < diamondCount; i++){
		GUILayout.Label(diamond, GUILayout.MaxWidth(diamondSize), GUILayout.MaxHeight(diamondSize));
	}

	GUILayout.EndHorizontal();
	GUILayout.EndArea();

}



function ActionButtons(){
	// Button Selection

	var w:float = (buttonSize + padding + buttonLabelWidth) * actions.length;
	var h:float = buttonSize;
	var r:Rect = Rect(Screen.width - w,
	    Screen.height - padding - buttonSize, //padding,
	    w,
	    h + padding);
	GUILayout.BeginArea(r);
	GUILayout.BeginHorizontal();

	for (var i:int = 0;  i < actions.length; i++) {
		var action:String = actions[i];
		var onTexture:Texture = actionButtonOnTexture[i];
		var offTexture:Texture = actionButtonOffTexture[i];
		var available:boolean = cubeManager.ActionAvailable(action);
		
		if (cubeManager.currentAction == action && available){
			if(GUILayout.Button(GUIContent(action, onTexture), GUILayout.MaxWidth(buttonSize), GUILayout.MaxHeight(buttonSize))){
				//Do Nothing
			}
		}else{
			if (!available)
				GUI.color = kDisabledColor;

			if(GUILayout.Button(GUIContent(action, offTexture), GUILayout.MaxWidth(buttonSize), GUILayout.MaxHeight(buttonSize))){
				
				if (available)
					cubeManager.currentAction = action;
			}

			GUI.color = kDefaultColor;
		}

		// Set action count padding to make numbers close to the icon
		GUI.skin.label.padding.left = actionCountPadding;

		var countDescription:String = cubeManager.ActionCountInString(action);
		if (countDescription == "0")
			GUI.color = ColorWithHex(0x9d3519);

		GUILayout.Label(countDescription);

		GUI.color = kDefaultColor;
		GUI.skin.label.padding.left = 0;
		
	}

	//TODO: Display the remaining cube count

	GUILayout.EndHorizontal();
	GUILayout.EndArea();


}
