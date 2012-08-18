#pragma strict

private var skin:GUISkin;
public var resolutionRatio:int = 1;


function Start () {
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

	borderPadding *= resolutionRatio;
	minHeight *= resolutionRatio;

	skin = Resources.Load("Skin", GUISkin);
}

private var borderPadding:float = 50;
private var minHeight:float = 25;

function OnGUI () {
	GUI.skin = skin;

	var r:Rect = Rect(borderPadding,borderPadding,Screen.width-borderPadding*2,Screen.height-borderPadding*2);
	GUILayout.BeginArea(r);

	// ID = 0 for menu
	for (var i:int = 1; i < Application.levelCount-1; i++){
		if (GUILayout.Button("Level " + i.ToString(),  GUILayout.MinHeight(minHeight))){
			Application.LoadLevel(i);
		}
	}
	if (GUILayout.Button("Random Generation Test",  GUILayout.MinHeight(minHeight))){
		Application.LoadLevel(Application.levelCount-1);
	}

	GUILayout.EndArea();
}