//varying vec3 vColor;
uniform float color;
uniform float width;
		
void main()	{
	//vColor = color;
	
	vec4 localPosition = vec4( position, 1.0 );
	vec4 worldPosition = modelMatrix * localPosition;
	
   	vec4 viewPosition = viewMatrix * worldPosition;

	//viewPosition.x += -0.55;// * width/380.0;
	//viewPosition.y += -0.25;
	//viewPosition.z = -1.0;
   	vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
}