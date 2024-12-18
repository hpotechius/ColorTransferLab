uniform float time;
uniform vec2 resolution;
uniform float normalFieldOn;
uniform float lightOn;
uniform vec3 lightColor;
varying vec3 vColor;
varying vec4 vNormal;
varying vec3 vNormalBefore;
varying vec4 vNormalView;
varying vec4 vPosition;
varying vec3 meshToLight;
varying vec3 meshToCamera;
		
void main()	{
	//gl_FragColor = vec4(abs(vNormal), 1.);
	//gl_FragColor = vec4(vColor.rgb, 1.);
			
	vec3 normalNormal = normalize(vNormal.xyz);
	vec3 normalMeshToLight = normalize(meshToLight.xyz);
	vec3 normalMeshToCamera = normalize(meshToCamera.xyz);
	vec3 normalNormalBefore = normalize(vNormalBefore);
	vec3 normalView = normalize(vNormalView.xyz);

	float cosAngle = dot(normalNormal, normalMeshToLight);
	float cosAngle2 = dot(vNormalView.xyz, normalMeshToCamera);
						
	if(normalFieldOn == 1.0)
		gl_FragColor = vec4(abs(normalNormalBefore), 1.);
	else if(lightOn == 1.0)
		gl_FragColor = vec4(vColor.rgb * cosAngle, 1.) * vec4(lightColor / 255.0 ,1.);
	else
		//gl_FragColor = vec4(vColor.rgb * cosAngle2, 1.);
		gl_FragColor = vec4(vColor.rgb, 1.);
		//gl_FragColor = vec4(vColor.rgb * (abs(normalView.z) / 2.0 + 0.5), 1.);
		
	// TEST
	//gl_FragColor = vec4(abs(normalNormalBefore), 1.);
}