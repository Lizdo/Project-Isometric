#pragma strict

enum OperationType{
	Add,
	Remove,
};

public class Operation extends System.ValueType{

	public var action:OperationType;
	public var x:int;
	public var y:int;
	public var z:int;
	public var type:CubeType;

  	public function Operation(action:OperationType, x:int, y:int, z:int, type:CubeType){
    	this.action = action;
    	this.x = x;
    	this.y = y;
    	this.z = z;
    	this.type = type;
 	}

 	public function Revert():Operation{
 		if (action == OperationType.Add){
 			action = OperationType.Remove;
 		}else if (action == OperationType.Remove){
 			action = OperationType.Add;
 		}
 		return this;
 	}

	public function print(){
		var s:String;
		if(action == OperationType.Add){
			s = "Added Cube At: ";
		}else{
			s = "Removed Cube At: ";
		}

		s = s + " x: " + x.ToString() + " y: " + y.ToString() + " z: " + z.ToString();
		s = s + "\n Type: " + type.ToString();
		
		Debug.Log(s);
	}

}