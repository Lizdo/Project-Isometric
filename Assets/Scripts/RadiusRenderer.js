#pragma strict

private var segments:int = 60;
private var width:float = 1;
private var c:Cube;

function Awake(){
	c = GetComponent(Cube);
}

function Start(){
	var lineRenderer:LineRenderer = GetComponent(LineRenderer);	
	lineRenderer.SetWidth(width,width);
	Hide();
}


function SetRadius(r:float){
	var lineRenderer:LineRenderer = GetComponent(LineRenderer);	
	lineRenderer.SetVertexCount(segments+1);
	var p:Vector3 = Vector3(r,0,0);
	for (var i:int = 0; i<= segments; i++){
		lineRenderer.SetPosition(i, p+c.BottomPosition());
		p = Quaternion.AngleAxis(360.0/segments, Vector3.up) * p;
	}
}

function SetColor(c:Color){
	var lineRenderer:LineRenderer = GetComponent(LineRenderer);	
	lineRenderer.SetColors(c,c);
}

function Show(){
	var lineRenderer:LineRenderer = GetComponent(LineRenderer);	
	lineRenderer.enabled = true;
}

function Hide(){
	var lineRenderer:LineRenderer = GetComponent(LineRenderer);	
	lineRenderer.enabled = false;
}