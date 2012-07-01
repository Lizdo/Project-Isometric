#pragma strict

private var resolutionRatio:int = 1;

private var padding:float = 8;
private var buttonSize:float = 64;

private var redo:Texture;
private var undo:Texture;

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

	cubeManager = GetComponent(CubeManager);
	skin = Resources.Load("Skin", GUISkin);
}

function LoadTextures(){
	redo = Resources.Load("Redo", Texture);
	undo = Resources.Load("Undo", Texture);	
}


function OnGUI () {
	GUI.skin = skin;

	if (GUI.Button(Rect(padding,padding,buttonSize,buttonSize), GUIContent("Undo", undo))){
		cubeManager.Undo();
	}

	if (GUI.Button(Rect(padding*2+buttonSize,padding,buttonSize,buttonSize),GUIContent("Redo", redo))){
		cubeManager.Redo();
	}	
}
