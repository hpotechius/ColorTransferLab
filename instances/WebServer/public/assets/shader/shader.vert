uniform float time;
uniform vec2 resolution;
uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform float normalFieldOn;
uniform float lightOn;
uniform float rgbCubeOn;
uniform float size;
varying vec3 vColor;
varying vec4 vNormal;
varying vec4 vNormalView;
varying vec3 vNormalBefore;
varying vec4 vPosition;
varying vec3 meshToLight;
varying vec3 meshToCamera;
		
void main()	{
	vColor = color;
	vNormalBefore = normal;
			
	vec4 localPosition = vec4( position, 1.0 );
	vec4 worldPosition = modelMatrix * localPosition;
			
	if(rgbCubeOn == 1.0) {
		localPosition = vec4( (color.r-0.5)*10.0,color.g*10.0,(color.b-0.5)*10.0, 1.0 );
		
		/*localPosition = vec4( (color.r * 0.3811 + color.g * 0.5783 + color.b * 0.0402),
								(color.r * 0.1967 + color.g * 0.7244 + color.b * 0.0782),
								(color.r * 0.0241 + color.g * 0.1288 + color.b * 0.8444),
								1.0);
		localPosition = vec4( log(localPosition.x),
								log(localPosition.y),
								log(localPosition.z),
								1.0);	
		localPosition = vec4( (localPosition.x * 1.0 +localPosition.y * 1.0 +localPosition.z * 1.0),
							  (localPosition.x * 1.0 +localPosition.y * 1.0 -localPosition.z * 2.0),
							  (localPosition.x * 1.0 -localPosition.y * 1.0 +localPosition.z * 0.0),
								1.0);	
		localPosition = vec4( (localPosition.x / sqrt(3.0)),
								(localPosition.y / sqrt(6.0)),
								(localPosition.z / sqrt(2.0)),
								1.0);	*/				
								
		worldPosition = localPosition;
	} else {
		localPosition = vec4( position, 1.0 );
		worldPosition = modelMatrix * localPosition;
	}

		
   	vec4 viewPosition = viewMatrix * worldPosition;
   	vec4 projectedPosition = projectionMatrix * viewPosition;
	vPosition = projectedPosition;
			
	vec4 localLightPosition = vec4( lightPosition, 1.0);
	vec4 localCameraPosition = vec4( 7.92, 12.13, 13.79, 1.0);
			
	vec4 localNormalPosition = vec4(normal, 1.0 );
	vNormal = localNormalPosition;
			
	vNormalView = viewMatrix * localNormalPosition;

	meshToLight = localLightPosition.xyz - worldPosition.xyz;
	meshToCamera = localCameraPosition.xyz - worldPosition.xyz;

    gl_Position = projectedPosition;
	gl_PointSize = size;
}