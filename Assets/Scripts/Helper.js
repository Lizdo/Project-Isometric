#pragma strict

static function ColorWithHex(hex:int):Color{
    // 0xRRGGBB
    var r:float = ((hex & 0xFF0000) >> 16)/255.0;
    var g:float = ((hex & 0xFF00) >> 8)/255.0;
    var b:float = (hex & 0xFF)/255.0;
    return Color(r,g,b,1.0);
}

static var s:float = 0.15;

static function RandomColorWithLightness(l:float):Color{
	l = Mathf.Clamp01(l);
	var h:float = Random.value * 360.0;
	return ColorWithHSL(h,s,l);
}

static var kDefaultColor:Color = Color.white;
static var kDisabledColor = Color.gray;

static function ColorWithHSL(h:float, s:float, l:float):Color{
	h = Mathf.Clamp(h, 0, 360);
	s = Mathf.Clamp01(s);
	l = Mathf.Clamp01(l);
	
	var r:float;
	var g:float;
	var b:float;

	if(s == 0){
		// Gray
		r = g = b = l * 255.0;
	}else{
        var q:float = (l<0.5f)?(l * (1.0f+s)):(l+s - (l*s));    
        var p:float = (2.0f * l) - q;  
        var Hk:float = h/360.0f;  
        var T = new float[3];
  
        T[0] = Hk + 0.3333333f; // Tr   0.3333333f=1.0/3.0  
        T[1] = Hk;              // Tb  
        T[2] = Hk - 0.3333333f; // Tg  
  
        for(var i:int=0; i<3; i++){  
            if(T[i] < 0) T[i] += 1.0;  
            if(T[i] > 1) T[i] -= 1.0;  
            if((T[i]*6) < 1){  
                T[i] = p + ((q-p)*6.0f*T[i]);  
            }else if((T[i]*2.0f) < 1) {  //(1.0/6.0)<=T[i] && T[i]<0.5  
                T[i] = q;  
            }else if((T[i]*3.0f) < 2) { // 0.5<=T[i] && T[i]<(2.0/3.0)  
                T[i] = p + (q-p) * ((2.0f/3.0f) - T[i]) * 6.0f;  
            }else {
            	T[i] = p;   
            }
        }    

    }  
	r = T[0];
	g = T[1];
	b = T[2];  
	return Color(r,g,b,1.0);    

  
}  
