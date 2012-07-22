#pragma strict

public class CubeSpawner extends Cube{

	private var spawnedObjects:Array = new Array();

	private var spawnInterval:float = 1.0;
	private var lastSpawnTime:float;

	public function Update(){
		if (Time.time - lastSpawnTime >= spawnInterval){
			lastSpawnTime = Time.time;
			Spawn();
		}
	}

	public function Spawn(){
		var ball:GameObject = Instantiate(Resources.Load("PhysicsBall", GameObject));
		var fx:float = Random.value * 5;
		var fy:float = 1;
		var fz:float = 0;//Random.value * 1;
		if (ball.rigidbody){			
			ball.rigidbody.AddForce(fx,fy,fz);
		}else{
			Debug.LogError("No Rigidbody Found for Ball");	
		}
		spawnedObjects.Add(ball);
	}

	public function CanPass(){
		return false;
	}

	public function CanDelete(){
		return false;
	}
	
}


