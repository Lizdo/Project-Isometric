#pragma strict

///////////////////////////
// Public Interface
///////////////////////////

enum LevelPattern{
	Flat,
	Islands,
	Panisular,
	Skyscraper
}

private static var pattern:LevelPattern = LevelPattern.Islands;

public static function SetSeed(seed:int){
	publicSeed = seed;
}

public static function SetPattern(p:LevelPattern){
	pattern = p;

	switch(pattern){
		case LevelPattern.Flat:
			floor = 1;
			height = 5;
			waterLevel = 1;
			base = 0;
			frequency = 0.7;
			amplitude = 1;
			break;
		case LevelPattern.Islands:
			floor = 0;
			height = 16;
			waterLevel = 8;
			base = -0.02;
			frequency = 0.7;
			amplitude = 1;
			break;
		case LevelPattern.Panisular:
			floor = 0;
			height = 7;
			waterLevel = 3;
			base = 0.1;
			frequency = 0.5;
			amplitude = 1;
			break;
		case LevelPattern.Skyscraper:
			floor = 1;
			height = 6;
			waterLevel = 0;
			base = 0;
			frequency = 1;
			amplitude = 1;
			break;
	}
}

public static function Height(x:int, y:int):int{
	SetPattern(pattern);
	
	var value:float = PerlinNoise_2D(x,y);
	return Mathf.Max(Mathf.Round(value*height)-waterLevel, floor);
}

///////////////////////////
// Characteristics
///////////////////////////

// generate a 60 * 60 map by default
private static var resolution:int = 60;

// Max Y value for the terrain generated
private static var floor:int = 0;
private static var base:float = 0;
private static var height:int = 15;
private static var waterLevel:int = 7;
private static var frequency:float = 0.5;
private static var amplitude:float = 1;

private static var privateSeed:int = 0;
private static var publicSeed:int;

// Smoothness
private static var persistence:float = 0.25;

// Iterations to add noise
private static var Number_Of_Octaves:int = 3;


///////////////////////////
// Algorithm
///////////////////////////

// Using Perlin Noise Generation
//		http://freespace.virgin.net/hugo.elias/models/m_perlin.htm

static function Noise(x:int, y:int){
 	var n:int = x + y * resolution;
  	n = (n<<13) ^ n * (privateSeed+publicSeed);
  	Random.seed = n;
 	return Random.value;
 }


static function SmoothedNoise(x:int, y:int){
	var corners:float = ( Noise(x-1, y-1)+Noise(x+1, y-1)+Noise(x-1, y+1)+Noise(x+1, y+1) ) / 16;
	var sides  :float = ( Noise(x-1, y)  +Noise(x+1, y)  +Noise(x, y-1)  +Noise(x, y+1) ) /  8;
	var center :float =  Noise(x, y) / 4;
	return corners + sides + center;
}

static function InterpolatedNoise(x:float, y:float){
	var integer_X:int    = Mathf.Floor(x);
	var fractional_X:float = x - integer_X;

	var integer_Y:int    = Mathf.Floor(y);
	var fractional_Y:float = y - integer_Y;

	var v1:float = SmoothedNoise(integer_X,     integer_Y);
	var v2:float = SmoothedNoise(integer_X + 1, integer_Y);
	var v3:float = SmoothedNoise(integer_X,     integer_Y + 1);
	var v4:float = SmoothedNoise(integer_X + 1, integer_Y + 1);

	var i1:float = Interpolate(v1 , v2 , fractional_X);
	var i2:float = Interpolate(v3 , v4 , fractional_X);

	return Interpolate(i1 , i2 , fractional_Y);
}


static function Interpolate(a:float, b:float, x:float){
	return Cosine_Interpolate(a,b,x);
}

static function Cosine_Interpolate(a:float, b:float, x:float){	
	var ft:float = x * 3.1415927;
	var f:float = (1 - Mathf.Cos(ft)) * .5;
	return  a*(1-f) + b*f;
}

static function PerlinNoise_2D(x:int, y:int){
    var total:float;

    /* Original Algorithm */
    // var p:float = persistence;
    // var n:int = Number_Of_Octaves - 1;

    // for (var i:int = 0; i < n; i++){
    // 	seed = i;
    // 	var frequency:int = Mathf.Pow(2,i);
    // 	var amplitude:float = Mathf.Pow(p,i);
    // 	total = total + InterpolatedNoise(x * frequency, y * frequency) * amplitude;
    // }
    // return total;
    /* End */

    // Only 1 pass with a smoothed interpolation to get less noise

    if (pattern == LevelPattern.Skyscraper){
    	total = base + InterpolatedNoise(x * frequency, y * frequency) * amplitude;
    	if (total < 0.6)
    		return 0;
    	else
    		return total;
    }

    total = base + InterpolatedNoise(x * frequency, y * frequency) * amplitude;
    total = Mathf.Clamp01(total);
    
    return total;
}

