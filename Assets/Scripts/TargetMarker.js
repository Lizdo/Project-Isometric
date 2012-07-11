#pragma strict

private var color:Color;


private var width:float = 0.1;
private var minWidth:float = 0.1;
private var maxWidth:float = 1.5;
private var widthStep:float = 0.05;

private var height:float = 10;
private var minion:Minion;

private var lineRenderer:LineRenderer;

function Awake(){
	lineRenderer = GetComponent(LineRenderer);	
}

function Start () {
	
}

function Update () {
	if (!minion)
		return;

	if (minion.state == MinionState.Victory){
		renderer.enabled = false;
		return;
	}

	if (width < minWidth){
		width = minWidth;
		widthStep = Mathf.Abs(widthStep);
	}

	if (width > maxWidth){
		width = maxWidth;;
		widthStep = -Mathf.Abs(widthStep);
	}

	width += widthStep;
	lineRenderer.SetWidth(width,width);

	lineRenderer.SetVertexCount(2);

	var p0:Vector3 = minion.targetCube.SurfacePosition();
	var p1:Vector3 = Vector3(p0.x, p0.y + height, p0.z);

	lineRenderer.SetPosition(0, p0);
	lineRenderer.SetPosition(1, p1);	


}

function SetMinion(m:Minion){
	minion = m;


}

function SetColor(c:Color){
	color = c;
	lineRenderer.SetColors(c,Color(c.r, c.g, c.b, 0));	
}