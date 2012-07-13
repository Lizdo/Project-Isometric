public class Cursor extends Cube{
	
	private var enabledMaterial:Material;
	private var disabledMaterial:Material;

	public function Start(){
		super.Start();
		enabledMaterial = Resources.Load("Cursor", Material);
		disabledMaterial = Resources.Load("Cursor_Invalid", Material);
	}

	public function Enable(){
		renderer.material = enabledMaterial;
	}

	public function Disable(){
		renderer.material = disabledMaterial;
	}


}