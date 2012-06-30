#pragma strict

var m_fps:float;

function Update(){
    m_fps = 1 / Time.deltaTime;
    guiText.text = m_fps.ToString("#.00");
}
