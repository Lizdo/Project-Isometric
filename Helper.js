#pragma strict

static function ColorWithHex(hex:int){
    // 0xRRGGBB
    var r:float = ((hex & 0xFF0000) >> 16)/255.0;
    var g:float = ((hex & 0xFF00) >> 8)/255.0;
    var b:float = (hex & 0xFF)/255.0;
    return Color(r,g,b,1.0);
}
