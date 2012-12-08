public class CubeCursor extends Cube{
	
	private var enabledMaterial:Material;
	private var disabledMaterial:Material;
	public var isValid:boolean;

	public function Start(){
		super.Start();
		enabledMaterial = Resources.Load("Cursor", Material);
		disabledMaterial = Resources.Load("Cursor_Invalid", Material);
	}

	public function Enable(){
		renderer.material = enabledMaterial;
		isValid = true;
	}

	public function Disable(){
		renderer.material = disabledMaterial;
		isValid = false;
	}

	public function Hide(){
		super.Hide();
		isValid = false;
	}

	public function Show(){
		super.Show();
		isValid = true;
	}


}