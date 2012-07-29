#pragma strict

public class CubeCore extends Cube{

	// Calculated by cubemanager, size of the core
	public var size:int;
	private var radiusRenderer:RadiusRenderer;

	function Awake(){
		super.Awake();
		radiusRenderer = GetComponent(RadiusRenderer);
		radiusRenderer.SetColor(ColorForResourceType(resourceType));
		size = 1;
	}

	function Update(){
		super.Update();
		radiusRenderer.SetRadius(PowerRadius()*GRID_SIZE_X);

		if (isPowered){
			radiusRenderer.Show();
		}else{
			radiusRenderer.Hide();
		}

	}

	function PowerRadius(){
		return PowerRadiusForSize(size);
	}

	static function PowerRadiusForSize(s:int){
		return Mathf.Pow(s+1, 2);	
	}
	
}


